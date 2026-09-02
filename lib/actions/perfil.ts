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
import { detectContactLeak } from "@/lib/contact-filter";
import { getLimitesProfissional } from "@/lib/data/limites-profissional";

// tamanho maximo aproximado de um avatar em base64 (~600KB) - protege o banco
// de uploads gigantes, ja que a foto e guardada como data URI (sem storage
// externo configurado nesta fase, ver plano de infraestrutura).
const MAX_AVATAR_DATA_URL_LENGTH = 800_000;
// limite de fotos na galeria por enquanto (secao 4 do plano fala em limite por
// plano - aqui aplicamos um teto simples, ate a logica por plano ser feita).
const MAX_FOTOS_GALERIA = 12;
// portfolio/curriculo em PDF - guardado como data URI (mesmo esquema de foto,
// sem storage externo). ~6MB em base64 = ~4.5MB de arquivo real, o bastante
// pra um PDF de portfolio sem pesar demais no banco.
const MAX_PDF_DATA_URL_LENGTH = 6_000_000;

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
    temTatuagem: formData.get("temTatuagem") || undefined,
    tempoExperienciaAnos: formData.get("tempoExperienciaAnos") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const medidasHabilitadas = parsed.data.medidasHabilitadas === "on";
  const tempoExperienciaMeses =
    parsed.data.tempoExperienciaAnos !== null && parsed.data.tempoExperienciaAnos !== undefined
      ? Math.round(parsed.data.tempoExperienciaAnos * 12)
      : null;

  await query(
    `UPDATE profissionais
     SET nome = $1, bairro_id = $2, disponibilidade_status = $3, sexo = $4, medidas_habilitadas = $5,
         altura_cm = $6, peso_kg = $7, cintura_cm = $8, manequim = $9, calcado = $10, tem_tatuagem = $11,
         tempo_experiencia_meses = $12
     WHERE usuario_id = $13`,
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
      medidasHabilitadas ? parsed.data.temTatuagem ?? null : null,
      tempoExperienciaMeses,
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

/** Portfolio/curriculo em PDF - visivel so pra empresa autenticada visitando o
 * perfil (mesma regra do resto do catalogo de profissional). Exige plano
 * Light ou Premium (ou o bonus de lancamento ainda dentro de 1 ano) - ver
 * lib/data/limites-profissional.ts. */
export async function atualizarPortfolioPdfProfissional(dataUrl: string, nomeArquivo: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (!dataUrl.startsWith("data:application/pdf")) return { error: "Escolha um arquivo PDF." };
  if (dataUrl.length > MAX_PDF_DATA_URL_LENGTH) return { error: "PDF muito grande - escolha um arquivo menor." };

  const limites = await getLimitesProfissional(session.usuarioId);
  if (!limites.podePdf) {
    return {
      error: "O portfólio em PDF exige o plano Light ou Premium. Fale com a gente pra contratar.",
    };
  }

  await query(`UPDATE profissionais SET portfolio_pdf_url = $1, portfolio_pdf_nome = $2 WHERE usuario_id = $3`, [
    dataUrl,
    nomeArquivo.slice(0, 200),
    session.usuarioId,
  ]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export async function removerPortfolioPdfProfissional(): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  await query(`UPDATE profissionais SET portfolio_pdf_url = NULL, portfolio_pdf_nome = NULL WHERE usuario_id = $1`, [
    session.usuarioId,
  ]);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

const VIDEO_URL_REGEX = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/i;

/** Link de video externo (YouTube), exclusivo do plano Premium - ate 3 links,
 * embutidos no perfil publico pra empresa avaliar a performance do
 * profissional sem precisar sair do site (ver componente VideoEmbed). */
export async function adicionarVideoLinkProfissional(url: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };
  if (!VIDEO_URL_REGEX.test(url.trim())) {
    return { error: "Cole um link do YouTube (youtube.com/watch?v=... ou youtu.be/...)." };
  }

  const limites = await getLimitesProfissional(session.usuarioId);
  if (limites.maxVideos === 0) {
    return { error: "Links de vídeo são exclusivos do plano Premium. Fale com a gente pra contratar." };
  }

  const atual = await queryOne<{ count: string }>(
    `SELECT count(*) FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'video_link'`,
    [session.usuarioId]
  );
  if (Number(atual?.count ?? 0) >= limites.maxVideos) {
    return { error: `Limite de ${limites.maxVideos} vídeos atingido.` };
  }

  const proximaOrdem = await queryOne<{ max: number | null }>(
    `SELECT max(ordem) FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'video_link'`,
    [session.usuarioId]
  );
  await query(`INSERT INTO profissional_galeria (profissional_id, tipo, url, ordem) VALUES ($1,'video_link',$2,$3)`, [
    session.usuarioId,
    url.trim(),
    (proximaOrdem?.max ?? -1) + 1,
  ]);

  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export async function removerVideoLinkProfissional(id: string): Promise<UploadResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") return { error: "Sessão inválida." };

  await query(`DELETE FROM profissional_galeria WHERE id = $1 AND profissional_id = $2 AND tipo = 'video_link'`, [
    id,
    session.usuarioId,
  ]);
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

  // A descricao e o texto livre pra "encantar o cliente" - nao pode virar um
  // atalho pra vazar telefone/link e furar o funil de contato controlado
  // (mesma logica ja usada na descricao do pedido, ver lib/contact-filter.ts).
  if (parsed.data.descricao && detectContactLeak(parsed.data.descricao).blocked) {
    return {
      error:
        "A descrição não pode conter números de telefone nem links. Corrija o texto e salve novamente — o telefone de contato já tem um campo próprio, logo abaixo.",
    };
  }

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

  const limites = await getLimitesProfissional(session.usuarioId);
  const atual = await queryOne<{ count: string }>(
    `SELECT count(*) FROM profissional_galeria WHERE profissional_id = $1 AND tipo = 'foto'`,
    [session.usuarioId]
  );
  if (Number(atual?.count ?? 0) >= limites.maxFotos) {
    return {
      error: `Limite de ${limites.maxFotos} fotos do plano ${limites.planoNome} atingido. Fale com a gente pra fazer upgrade.`,
    };
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

export type AlterarPlanoResult = { error?: string; ok?: boolean; pendente?: boolean };

/** pendente=true quando o plano escolhido é pago: ainda não existe cobrança
 * automática (sem integração real com o Mercado Pago - ver
 * mercado_pago_assinatura_id em assinaturas), então NÃO ativamos sozinhos.
 * A empresa fecha o pagamento pelo WhatsApp e o admin ativa manualmente em
 * /admin/pagamentos (mesmo fluxo que já existe pra marcar pagamento e trocar
 * plano manualmente). Plano grátis continua aplicando na hora, sem cobrança. */
export async function alterarPlanoEmpresa(planoId: number, meses?: number): Promise<AlterarPlanoResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = alterarPlanoEmpresaSchema.safeParse({ planoId, meses });
  if (!parsed.success) return { error: "Plano inválido." };

  const plano = await queryOne<{ id: number; valor_mensal: string }>(
    `SELECT id, valor_mensal FROM planos WHERE id = $1 AND tipo::text LIKE 'empresa_%'`,
    [parsed.data.planoId]
  );
  if (!plano) return { error: "Esse plano não está disponível." };

  if (Number(plano.valor_mensal) === 0) {
    await query(`INSERT INTO assinaturas (usuario_id, plano_id, status) VALUES ($1, $2, 'ativa')`, [
      session.usuarioId,
      plano.id,
    ]);
    revalidatePath("/painel");
    return { ok: true };
  }

  return { ok: true, pendente: true };
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
