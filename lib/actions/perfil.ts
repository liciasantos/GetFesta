"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  alterarPlanoEmpresaSchema,
  atualizarPerfilClienteSchema,
  atualizarPerfilEmpresaSchema,
  atualizarPerfilProfissionalSchema,
  avaliacaoGoogleSchema,
} from "@/lib/validators";

// tamanho maximo aproximado de um avatar em base64 (~600KB) - protege o banco
// de uploads gigantes, ja que a foto e guardada como data URI (sem storage
// externo configurado nesta fase, ver plano de infraestrutura).
const MAX_AVATAR_DATA_URL_LENGTH = 800_000;
// limite de fotos na galeria por enquanto (secao 4 do plano fala em limite por
// plano - aqui aplicamos um teto simples, ate a logica por plano ser feita).
const MAX_FOTOS_GALERIA = 12;
// profissional_galeria.tipo='foto': secao 6 do schema fala em 1-2 fotos no modo
// limitado; o pedido do usuario foi "area para incluir 4 fotos" no catalogo.
const MAX_FOTOS_GALERIA_PROFISSIONAL = 4;

export type UploadResult = { error?: string; ok?: boolean };
export type PerfilActionState = { error?: string; success?: boolean } | undefined;

export async function atualizarPerfilCliente(_prevState: PerfilActionState, formData: FormData): Promise<PerfilActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const parsed = atualizarPerfilClienteSchema.safeParse({
    nome: formData.get("nome"),
    cidadeId: formData.get("cidadeId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(`UPDATE clientes SET nome = $1, cidade_id = $2 WHERE usuario_id = $3`, [
    parsed.data.nome,
    parsed.data.cidadeId ?? null,
    session.usuarioId,
  ]);

  revalidatePath("/meu-perfil");
  revalidatePath("/meus-pedidos");
  return { success: true };
}

export async function atualizarFotoCliente(dataUrl: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) return { error: "Imagem muito grande, escolha uma foto menor." };

  await query(`UPDATE clientes SET foto_url = $1 WHERE usuario_id = $2`, [dataUrl, session.usuarioId]);
  revalidatePath("/meu-perfil");
  revalidatePath("/meus-pedidos");
  return { ok: true };
}

export async function atualizarPerfilProfissional(
  _prevState: PerfilActionState,
  formData: FormData
): Promise<PerfilActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  const parsed = atualizarPerfilProfissionalSchema.safeParse({
    nome: formData.get("nome"),
    bairroId: formData.get("bairroId") || undefined,
    disponibilidadeStatus: formData.get("disponibilidadeStatus"),
    categoriaIds: formData.getAll("categoriaIds"),
    sexo: formData.get("sexo") || undefined,
    medidasHabilitadas: formData.get("medidasHabilitadas") || undefined,
    alturaCm: formData.get("alturaCm") || undefined,
    pesoKg: formData.get("pesoKg") || undefined,
    cinturaCm: formData.get("cinturaCm") || undefined,
    manequim: formData.get("manequim") || undefined,
    calcado: formData.get("calcado") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const medidasHabilitadas = parsed.data.medidasHabilitadas === "on";

  await query(
    `UPDATE profissionais
     SET nome = $1, bairro_id = $2, disponibilidade_status = $3, sexo = $4, medidas_habilitadas = $5,
         altura_cm = $6, peso_kg = $7, cintura_cm = $8, manequim = $9, calcado = $10
     WHERE usuario_id = $11`,
    [
      parsed.data.nome,
      parsed.data.bairroId ?? null,
      parsed.data.disponibilidadeStatus,
      parsed.data.sexo ?? null,
      medidasHabilitadas,
      medidasHabilitadas ? parsed.data.alturaCm ?? null : null,
      medidasHabilitadas ? parsed.data.pesoKg ?? null : null,
      medidasHabilitadas ? parsed.data.cinturaCm ?? null : null,
      medidasHabilitadas ? parsed.data.manequim ?? null : null,
      medidasHabilitadas ? parsed.data.calcado ?? null : null,
      session.usuarioId,
    ]
  );

  await query(`DELETE FROM profissional_categorias WHERE profissional_id = $1`, [session.usuarioId]);
  for (const categoriaId of parsed.data.categoriaIds) {
    await query(`INSERT INTO profissional_categorias (profissional_id, categoria_id) VALUES ($1,$2)`, [
      session.usuarioId,
      categoriaId,
    ]);
  }

  revalidatePath("/perfil-profissional");
  return { success: true };
}

export async function atualizarFotoProfissional(dataUrl: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) return { error: "Imagem muito grande, escolha uma foto menor." };

  await query(`UPDATE profissionais SET foto_perfil_url = $1 WHERE usuario_id = $2`, [dataUrl, session.usuarioId]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export async function atualizarPerfilEmpresa(_prevState: PerfilActionState, formData: FormData): Promise<PerfilActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = atualizarPerfilEmpresaSchema.safeParse({
    descricao: formData.get("descricao") || undefined,
    capacidadeConvidados: formData.get("capacidadeConvidados") || undefined,
    precoAPartirDe: formData.get("precoAPartirDe") || undefined,
    instagram: formData.get("instagram") || undefined,
    telefoneContato: formData.get("telefoneContato"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(
    `UPDATE empresas
     SET descricao = $1, capacidade_convidados = $2, preco_a_partir_de = $3, instagram = $4, telefone_contato = $5
     WHERE usuario_id = $6`,
    [
      parsed.data.descricao ?? null,
      parsed.data.capacidadeConvidados ?? null,
      parsed.data.precoAPartirDe ?? null,
      parsed.data.instagram ?? null,
      parsed.data.telefoneContato,
      session.usuarioId,
    ]
  );

  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { success: true };
}

export async function atualizarLogoEmpresa(dataUrl: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) return { error: "Imagem muito grande, escolha uma foto menor." };

  await query(`UPDATE empresas SET logo_url = $1 WHERE usuario_id = $2`, [dataUrl, session.usuarioId]);
  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { ok: true };
}

export async function adicionarFotoGaleria(dataUrl: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) return { error: "Imagem muito grande, escolha uma foto menor." };

  const atual = await queryOne<{ count: string }>(`SELECT count(*) FROM empresa_galeria WHERE empresa_id = $1`, [
    session.usuarioId,
  ]);
  if (Number(atual?.count ?? 0) >= MAX_FOTOS_GALERIA) {
    return { error: `Limite de ${MAX_FOTOS_GALERIA} fotos na galeria atingido.` };
  }

  const proximaOrdem = await queryOne<{ max: number | null }>(
    `SELECT max(ordem) FROM empresa_galeria WHERE empresa_id = $1`,
    [session.usuarioId]
  );
  await query(`INSERT INTO empresa_galeria (empresa_id, url, ordem) VALUES ($1,$2,$3)`, [
    session.usuarioId,
    dataUrl,
    (proximaOrdem?.max ?? -1) + 1,
  ]);

  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { ok: true };
}

export async function removerFotoGaleria(fotoId: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  await query(`DELETE FROM empresa_galeria WHERE id = $1 AND empresa_id = $2`, [fotoId, session.usuarioId]);
  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { ok: true };
}

export async function adicionarFotoGaleriaProfissional(dataUrl: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) return { error: "Imagem muito grande, escolha uma foto menor." };

  const atual = await queryOne<{ count: string }>(
    `SELECT count(*) FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'foto'`,
    [session.usuarioId]
  );
  if (Number(atual?.count ?? 0) >= MAX_FOTOS_GALERIA_PROFISSIONAL) {
    return { error: `Limite de ${MAX_FOTOS_GALERIA_PROFISSIONAL} fotos atingido.` };
  }

  const proximaOrdem = await queryOne<{ max: number | null }>(
    `SELECT max(ordem) FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'foto'`,
    [session.usuarioId]
  );
  await query(`INSERT INTO profissional_galeria (profissional_id, tipo, url, ordem) VALUES ($1,'foto',$2,$3)`, [
    session.usuarioId,
    dataUrl,
    (proximaOrdem?.max ?? -1) + 1,
  ]);

  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export async function removerFotoGaleriaProfissional(fotoId: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  await query(`DELETE FROM profissional_galeria WHERE id = $1 AND profissional_id = $2`, [fotoId, session.usuarioId]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export type AlterarPlanoResult = { error?: string; ok?: boolean };

export async function alterarPlanoEmpresa(planoId: number): Promise<AlterarPlanoResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = alterarPlanoEmpresaSchema.safeParse({ planoId });
  if (!parsed.success) return { error: "Plano inválido." };

  const plano = await queryOne<{ id: number }>(`SELECT id FROM planos WHERE id = $1 AND tipo::text LIKE 'empresa_%'`, [
    parsed.data.planoId,
  ]);
  if (!plano) return { error: "Esse plano não está disponível." };

  await query(
    `INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1, $2, 'ativa')`,
    [session.usuarioId, plano.id]
  );

  revalidatePath("/painel");
  return { ok: true };
}

export async function salvarAvaliacaoGoogle(_prevState: PerfilActionState, formData: FormData): Promise<PerfilActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = avaliacaoGoogleSchema.safeParse({
    notaMediaGoogle: formData.get("notaMediaGoogle"),
    totalAvaliacoesGoogle: formData.get("totalAvaliacoesGoogle"),
    urlPerfilGoogle: formData.get("urlPerfilGoogle"),
    googlePlaceId: formData.get("googlePlaceId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(
    `INSERT INTO empresa_avaliacoes_google (empresa_id, google_place_id, nota_media_google, total_avaliacoes_google, url_perfil_google, ativo)
     VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (empresa_id) DO UPDATE SET
       google_place_id = $2, nota_media_google = $3, total_avaliacoes_google = $4, url_perfil_google = $5, ativo = true`,
    [
      session.usuarioId,
      parsed.data.googlePlaceId ?? null,
      parsed.data.notaMediaGoogle,
      parsed.data.totalAvaliacoesGoogle,
      parsed.data.urlPerfilGoogle,
    ]
  );

  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { success: true };
}

export async function removerAvaliacaoGoogle(): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  await query(`DELETE FROM empresa_avaliacoes_google WHERE empresa_id = $1`, [session.usuarioId]);

  revalidatePath("/painel/perfil");
  revalidatePath(`/empresa/${session.usuarioId}`);
  return { ok: true };
}
