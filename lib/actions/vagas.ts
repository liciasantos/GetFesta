"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { criarVagaSchema } from "@/lib/validators";

export type VagaActionState = { error?: string; success?: boolean } | undefined;

export async function criarVaga(_prevState: VagaActionState, formData: FormData): Promise<VagaActionState> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = criarVagaSchema.safeParse({
    categoriaProfissionalId: formData.get("categoriaProfissionalId"),
    cidadeId: formData.get("cidadeId"),
    bairroId: formData.get("bairroId") || undefined,
    dataEvento: formData.get("dataEvento"),
    horaInicio: formData.get("horaInicio"),
    duracaoHoras: formData.get("duracaoHoras"),
    valor: formData.get("valor") || undefined,
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(
    `INSERT INTO vagas_profissionais (
       empresa_id, categoria_profissional_id, cidade_id, bairro_id, data_evento, hora_inicio, duracao_horas, valor, descricao
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      session.usuarioId,
      parsed.data.categoriaProfissionalId,
      parsed.data.cidadeId,
      parsed.data.bairroId ?? null,
      parsed.data.dataEvento,
      parsed.data.horaInicio,
      parsed.data.duracaoHoras,
      parsed.data.valor ?? null,
      parsed.data.descricao,
    ]
  );

  revalidatePath("/painel/vagas");
  redirect("/painel/vagas");
}

export type CandidatarVagaResult = { error?: string; ok?: boolean };

/**
 * Profissional se candidata a uma vaga - o botão nunca recebe/expõe dados da
 * empresa (nem telefone, nem instagram): só registra o interesse. A empresa é
 * quem vê a lista de candidatos e decide contatar (secao 6 do schema: o
 * profissional é visível pra empresa autenticada, não o contrário).
 */
export async function candidatarVaga(vagaId: string): Promise<CandidatarVagaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "profissional") {
    return { error: "Só profissionais logados podem se candidatar." };
  }

  const vaga = await queryOne<{ status: string }>(`SELECT status FROM vagas_profissionais WHERE id = $1`, [vagaId]);
  if (!vaga || vaga.status !== "aberta") {
    return { error: "Essa vaga não está mais disponível." };
  }

  await query(
    `INSERT INTO vaga_candidaturas (vaga_id, profissional_id) VALUES ($1, $2) ON CONFLICT (vaga_id, profissional_id) DO NOTHING`,
    [vagaId, session.usuarioId]
  );

  revalidatePath("/perfil-profissional");
  return { ok: true };
}

export type FecharVagaResult = { error?: string; ok?: boolean };

/** Empresa marca com qual profissional fechou a vaga - é o único jeito de
 * saber, depois que a data do evento passa, se ela conseguiu contratar
 * alguém ou não (ver comentário na coluna profissional_selecionado_id). */
export async function marcarVagaPreenchida(vagaId: string, profissionalId: string): Promise<FecharVagaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const candidatura = await queryOne<{ id: string }>(
    `SELECT id FROM vaga_candidaturas WHERE vaga_id = $1 AND profissional_id = $2`,
    [vagaId, profissionalId]
  );
  if (!candidatura) return { error: "Esse profissional não é candidato dessa vaga." };

  const res = await query<{ id: string }>(
    `UPDATE vagas_profissionais SET status = 'preenchida', profissional_selecionado_id = $1 WHERE id = $2 AND empresa_id = $3 RETURNING id`,
    [profissionalId, vagaId, session.usuarioId]
  );
  if (res.length === 0) return { error: "Vaga não encontrada." };

  revalidatePath("/painel/vagas");
  revalidatePath(`/painel/vagas/${vagaId}`);
  return { ok: true };
}

/** Empresa informa que não fechou com ninguém (vaga cancelada ou evento
 * aconteceu sem contratar via GetFesta) - fecha o loop de acompanhamento. */
export async function marcarVagaNaoPreenchida(vagaId: string): Promise<FecharVagaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const res = await query<{ id: string }>(
    `UPDATE vagas_profissionais SET status = 'cancelada', profissional_selecionado_id = NULL WHERE id = $1 AND empresa_id = $2 RETURNING id`,
    [vagaId, session.usuarioId]
  );
  if (res.length === 0) return { error: "Vaga não encontrada." };

  revalidatePath("/painel/vagas");
  revalidatePath(`/painel/vagas/${vagaId}`);
  return { ok: true };
}
