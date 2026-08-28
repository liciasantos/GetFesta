"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { detectContactLeak } from "@/lib/contact-filter";
import { orcamentoFaixaParaMinMax, publicarPedidoSchema, type PublicarPedidoInput } from "@/lib/validators";

export type CriarPedidoResult = { error?: string; pedidoId?: string };

/**
 * Cria o pedido sem exigir login (secao 5 do plano). Roda a validacao de novo
 * no servidor (o formulario guiado ja valida no cliente, mas essa funcao pode
 * ser chamada diretamente via POST, entao nao da pra confiar so no client-side)
 * e aplica o filtro anti-vazamento de contato na descricao antes de gravar.
 */
export async function criarPedido(input: PublicarPedidoInput): Promise<CriarPedidoResult> {
  const parsed = publicarPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const leak = detectContactLeak(data.descricao);
  if (leak.blocked) {
    return {
      error:
        "Detectamos uma possível informação de contato na descrição (telefone ou e-mail). Remova esse trecho — o contato é liberado automaticamente quando uma empresa demonstra interesse.",
    };
  }

  const { min, max } = orcamentoFaixaParaMinMax(data.orcamentoFaixa);

  const pedido = await queryOne<{ id: string }>(
    `INSERT INTO pedidos (
       nome_temp, telefone_temp, telefone_verificado_temp, tipo_evento, data_evento,
       cidade_id, bairro_id, descricao, detalhe_outros_servico, orcamento_min, orcamento_max, status
     ) VALUES ($1,$2,false,$3,$4,$5,$6,$7,$8,$9,$10,'aberto') RETURNING id`,
    [
      data.nomeTemp,
      data.telefoneTemp,
      data.tipoEvento,
      data.dataEvento,
      data.cidadeId,
      data.bairroId ?? null,
      data.descricao,
      data.detalheOutrosServico ?? null,
      min,
      max,
    ]
  );
  if (!pedido) return { error: "Não foi possível publicar o pedido, tente novamente." };

  for (const categoriaId of data.categoriaIds) {
    await query(`INSERT INTO pedido_categorias (pedido_id, categoria_id) VALUES ($1,$2)`, [pedido.id, categoriaId]);
  }

  revalidatePath("/");
  return { pedidoId: pedido.id };
}

export type ManifestarInteresseResult = { error?: string; ok?: boolean };

/**
 * Empresa manifesta interesse num pedido - esse e o UNICO gatilho que libera
 * contato dos dois lados (secao 5 e secao 10 do plano): o telefone do cliente
 * fica visivel pra empresa (via link wa.me) e o Instagram/telefone da empresa
 * ficam visiveis pro cliente quando ele olhar o perfil dela.
 */
export async function manifestarInteresse(pedidoId: string): Promise<ManifestarInteresseResult> {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") {
    return { error: "Só empresas logadas podem manifestar interesse em um pedido." };
  }

  const pedido = await queryOne<{ status: string }>(`SELECT status FROM pedidos WHERE id = $1`, [pedidoId]);
  if (!pedido || pedido.status !== "aberto") {
    return { error: "Esse pedido não está mais disponível." };
  }

  // ja respondeu esse pedido? nao conta de novo pra cota (idempotente)
  const jaRespondeu = await queryOne<{ id: string }>(
    `SELECT id FROM pedido_interesses WHERE pedido_id = $1 AND empresa_id = $2`,
    [pedidoId, session.usuarioId]
  );

  if (!jaRespondeu) {
    const plano = await queryOne<{ limite_orcamentos_mes: number | null; nome: string }>(
      `SELECT pl.limite_orcamentos_mes, pl.nome
       FROM assinaturas a
       JOIN planos pl ON pl.id = a.plano_id
       WHERE a.usuario_id = $1
       ORDER BY a.criado_em DESC
       LIMIT 1`,
      [session.usuarioId]
    );

    if (plano && plano.limite_orcamentos_mes !== null) {
      const usados = await queryOne<{ count: string }>(
        `SELECT count(*) FROM pedido_interesses
         WHERE empresa_id = $1 AND date_trunc('month', criado_em) = date_trunc('month', now())`,
        [session.usuarioId]
      );
      if (Number(usados?.count ?? 0) >= plano.limite_orcamentos_mes) {
        return {
          error: `Seu plano ${plano.nome} permite responder ${plano.limite_orcamentos_mes} orçamentos por mês, e esse limite já foi atingido. Faça upgrade de plano no seu painel pra continuar respondendo.`,
        };
      }
    }
  }

  await query(
    `INSERT INTO pedido_interesses (pedido_id, empresa_id, status, contato_liberado_em)
     VALUES ($1, $2, 'contato_liberado', now())
     ON CONFLICT (pedido_id, empresa_id) DO NOTHING`,
    [pedidoId, session.usuarioId]
  );

  revalidatePath("/painel");
  return { ok: true };
}

export async function registrarCliqueWhatsapp(empresaId: string): Promise<void> {
  await query(`INSERT INTO empresa_eventos (empresa_id, tipo) VALUES ($1, 'clique_whatsapp')`, [empresaId]);
}

export type MarcarPedidoConcluidoResult = { error?: string; ok?: boolean };

/** Cliente informa que fechou com um fornecedor - pede pra dizer se foi
 * atraves da GetFesta (metrica real de conversao do funil). */
export async function marcarPedidoConcluido(pedidoId: string, encontradoPeloSite: boolean): Promise<MarcarPedidoConcluidoResult> {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") return { error: "Sessão inválida." };

  const pedido = await queryOne<{ id: string }>(`SELECT id FROM pedidos WHERE id = $1 AND cliente_id = $2`, [
    pedidoId,
    session.usuarioId,
  ]);
  if (!pedido) return { error: "Pedido não encontrado." };

  await query(`UPDATE pedidos SET status = 'concluido', encontrado_pelo_site = $1 WHERE id = $2`, [
    encontradoPeloSite,
    pedidoId,
  ]);

  revalidatePath("/meus-pedidos");
  return { ok: true };
}
