"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { avaliarProfissionalSchema, criarVagaSchema } from "@/lib/validators";
import { sendEmail, buildVagaSelecionadaEmail } from "@/lib/email";

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
    sexoDesejado: formData.get("sexoDesejado") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await query(
    `INSERT INTO vagas_profissionais (
       empresa_id, categoria_profissional_id, cidade_id, bairro_id, data_evento, hora_inicio, duracao_horas, valor, descricao, sexo_desejado
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
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
      parsed.data.sexoDesejado ?? "indiferente",
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

/** Calcula o horário de término (HH:MM) a partir do início + duração em
 * horas. Retorna null se passar da meia-noite (TIME não representa isso) -
 * nesse caso o chamador bloqueia o dia inteiro em vez de um horário. */
function calcularHoraFim(horaInicio: string, duracaoHoras: number): string | null {
  const [h, m] = horaInicio.split(":").map(Number);
  const totalMin = h * 60 + m + Math.round(duracaoHoras * 60);
  if (totalMin >= 24 * 60) return null;
  const fh = Math.floor(totalMin / 60);
  const fm = totalMin % 60;
  return `${String(fh).padStart(2, "0")}:${String(fm).padStart(2, "0")}`;
}

/** Empresa marca com qual profissional fechou a vaga - é o único jeito de
 * saber, depois que a data do evento passa, se ela conseguiu contratar
 * alguém ou não (ver comentário na coluna profissional_selecionado_id).
 * Além de fechar a vaga: marca a candidatura escolhida como 'selecionado' e
 * as demais como 'recusado', bloqueia automaticamente o dia/horário do
 * evento na agenda do profissional (profissional_dias_indisponiveis, com
 * vaga_id pra poder desfazer depois - ver removerSelecaoVaga) e avisa o
 * profissional por e-mail. */
export async function marcarVagaPreenchida(vagaId: string, profissionalId: string): Promise<FecharVagaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const candidatura = await queryOne<{ id: string }>(
    `SELECT id FROM vaga_candidaturas WHERE vaga_id = $1 AND profissional_id = $2`,
    [vagaId, profissionalId]
  );
  if (!candidatura) return { error: "Esse profissional não é candidato dessa vaga." };

  const vaga = await queryOne<{
    categoria_nome: string;
    data_evento: string;
    hora_inicio: string;
    duracao_horas: string;
    nome_fantasia: string;
  }>(
    `SELECT cp.nome AS categoria_nome, v.data_evento, v.hora_inicio, v.duracao_horas, e.nome_fantasia
     FROM vagas_profissionais v
     JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
     JOIN empresas e ON e.usuario_id = v.empresa_id
     WHERE v.id = $1 AND v.empresa_id = $2`,
    [vagaId, session.usuarioId]
  );
  if (!vaga) return { error: "Vaga não encontrada." };

  const res = await query<{ id: string }>(
    `UPDATE vagas_profissionais SET status = 'preenchida', profissional_selecionado_id = $1 WHERE id = $2 AND empresa_id = $3 RETURNING id`,
    [profissionalId, vagaId, session.usuarioId]
  );
  if (res.length === 0) return { error: "Vaga não encontrada." };

  await query(`UPDATE vaga_candidaturas SET status = 'selecionado' WHERE vaga_id = $1 AND profissional_id = $2`, [
    vagaId,
    profissionalId,
  ]);
  await query(`UPDATE vaga_candidaturas SET status = 'recusado' WHERE vaga_id = $1 AND profissional_id != $2`, [
    vagaId,
    profissionalId,
  ]);

  try {
    const horaFim = calcularHoraFim(vaga.hora_inicio, Number(vaga.duracao_horas));
    if (horaFim) {
      await query(
        `INSERT INTO profissional_dias_indisponiveis (profissional_id, data, hora_inicio, hora_fim, vaga_id)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [profissionalId, vaga.data_evento, vaga.hora_inicio, horaFim, vagaId]
      );
    } else {
      // evento passa da meia-noite - bloqueia o dia inteiro pra nao arriscar sobreposicao
      await query(
        `INSERT INTO profissional_dias_indisponiveis (profissional_id, data, vaga_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [profissionalId, vaga.data_evento, vagaId]
      );
    }
  } catch {
    // se ja existir um bloqueio manual conflitante nesse horario, nao trava a selecao por causa disso
  }

  const profissional = await queryOne<{ email: string | null; nome: string }>(
    `SELECT u.email, p.nome FROM profissionais p JOIN usuarios u ON u.id = p.usuario_id WHERE p.usuario_id = $1`,
    [profissionalId]
  );
  if (profissional?.email) {
    const { subject, html } = buildVagaSelecionadaEmail(
      profissional.nome,
      vaga.categoria_nome,
      vaga.nome_fantasia,
      vaga.data_evento,
      vaga.hora_inicio
    );
    await sendEmail({ to: profissional.email, subject, html });
  }

  revalidatePath("/painel/vagas");
  revalidatePath(`/painel/vagas/${vagaId}`);
  revalidatePath("/perfil-profissional");
  return { ok: true };
}

/** Desfaz a seleção de uma vaga já preenchida (ex.: o profissional escolhido
 * ficou impossibilitado de cumprir o evento) - reabre a vaga pra novos
 * candidatos, devolve todas as candidaturas pra 'candidatado' e libera o
 * bloqueio de agenda que tinha sido criado automaticamente. */
export async function removerSelecaoVaga(vagaId: string): Promise<FecharVagaResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const vaga = await queryOne<{ id: string }>(
    `SELECT id FROM vagas_profissionais WHERE id = $1 AND empresa_id = $2 AND status = 'preenchida'`,
    [vagaId, session.usuarioId]
  );
  if (!vaga) return { error: "Vaga não encontrada ou não está preenchida." };

  await query(`UPDATE vagas_profissionais SET status = 'aberta', profissional_selecionado_id = NULL WHERE id = $1`, [
    vagaId,
  ]);
  await query(`UPDATE vaga_candidaturas SET status = 'candidatado' WHERE vaga_id = $1`, [vagaId]);
  await query(`DELETE FROM profissional_dias_indisponiveis WHERE vaga_id = $1`, [vagaId]);

  revalidatePath("/painel/vagas");
  revalidatePath(`/painel/vagas/${vagaId}`);
  revalidatePath("/perfil-profissional");
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

export type AvaliarProfissionalState = { error?: string; success?: boolean } | undefined;

/** Empresa avalia o profissional depois de fechar a vaga com ele - alimenta a
 * pontuação usada em "buscar profissionais" (ver lib/data/profissionais.ts:
 * listProfissionaisCompativeis). Só pode avaliar quem de fato foi selecionado
 * pra essa vaga, e só uma vez por vaga (reenviar atualiza a nota/comentário). */
export async function avaliarProfissional(
  _prevState: AvaliarProfissionalState,
  formData: FormData
): Promise<AvaliarProfissionalState> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") return { error: "Sessão inválida." };

  const parsed = avaliarProfissionalSchema.safeParse({
    vagaId: formData.get("vagaId"),
    profissionalId: formData.get("profissionalId"),
    nota: formData.get("nota"),
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const vaga = await queryOne<{ id: string }>(
    `SELECT id FROM vagas_profissionais
     WHERE id = $1 AND empresa_id = $2 AND status = 'preenchida' AND profissional_selecionado_id = $3`,
    [parsed.data.vagaId, session.usuarioId, parsed.data.profissionalId]
  );
  if (!vaga) return { error: "Essa vaga não pode ser avaliada." };

  await query(
    `INSERT INTO avaliacoes_profissional (profissional_id, empresa_id, vaga_id, nota, comentario)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (vaga_id, empresa_id) DO UPDATE SET nota = $4, comentario = $5`,
    [parsed.data.profissionalId, session.usuarioId, parsed.data.vagaId, parsed.data.nota, parsed.data.comentario ?? null]
  );

  revalidatePath(`/painel/vagas/${parsed.data.vagaId}`);
  return { success: true };
}
