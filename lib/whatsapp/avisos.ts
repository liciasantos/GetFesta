import { query, queryOne } from "@/lib/db";
import { nomeDaVaga } from "@/lib/vaga";
import { enfileirar, urlSite } from "./fila";

/** Monta e enfileira cada aviso de WhatsApp a partir do fato que aconteceu.
 * Chamados dentro de after() nas ações (não atrasam a resposta) e nunca
 * lançam erro - quem não ativou o WhatsApp é filtrado em enfileirar(). */

function seguro(nome: string, fn: () => Promise<unknown>) {
  return fn().catch((err) => console.error(`Falha ao montar aviso de WhatsApp (${nome}):`, err));
}

type VagaInfo = {
  id: string;
  empresa_id: string;
  titulo: string | null;
  categoria_nome: string;
  nome_fantasia: string;
  cidade_nome: string;
  data: string;
  hora: string;
};

async function vagaInfo(vagaId: string) {
  return queryOne<VagaInfo>(
    `SELECT v.id, v.empresa_id, v.titulo, cp.nome AS categoria_nome, e.nome_fantasia, ci.nome AS cidade_nome,
            to_char(v.data_evento, 'DD/MM') AS data, to_char(v.hora_inicio, 'HH24"h"MI') AS hora
       FROM vagas_profissionais v
       JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
       JOIN empresas e ON e.usuario_id = v.empresa_id
       JOIN cidades ci ON ci.id = v.cidade_id
      WHERE v.id = $1`,
    [vagaId]
  );
}

/** Pedido de orçamento novo → empresas com a categoria e atuação no estado. */
export function avisarPedidoNovo(pedidoId: string) {
  return seguro("pedido_novo", async () => {
    const p = await queryOne<{ tipo_evento: string; data: string; cidade_nome: string; categorias: string }>(
      `SELECT p.tipo_evento, to_char(p.data_evento, 'DD/MM/YYYY') AS data, ci.nome AS cidade_nome,
              (SELECT string_agg(c.nome, ', ' ORDER BY c.nome) FROM pedido_categorias pc JOIN categorias c ON c.id = pc.categoria_id
                WHERE pc.pedido_id = p.id) AS categorias
         FROM pedidos p JOIN cidades ci ON ci.id = p.cidade_id WHERE p.id = $1`,
      [pedidoId]
    );
    if (!p) return;
    const empresas = await query<{ usuario_id: string }>(
      `SELECT e.usuario_id FROM empresas e
         JOIN usuarios u ON u.id = e.usuario_id AND u.whatsapp_avisos
        WHERE EXISTS (SELECT 1 FROM pedido_categorias pc
                        JOIN empresa_categorias ec ON ec.categoria_id = pc.categoria_id AND ec.empresa_id = e.usuario_id
                       WHERE pc.pedido_id = $1)
          AND EXISTS (SELECT 1 FROM empresa_areas_atuacao ea
                        JOIN cidades cea ON cea.id = ea.cidade_id
                        JOIN pedidos pp ON pp.id = $1
                        JOIN cidades cp ON cp.id = pp.cidade_id
                       WHERE ea.empresa_id = e.usuario_id AND cea.estado = cp.estado)`,
      [pedidoId]
    );
    const texto =
      `🎉 *Novo pedido de orçamento na GetFesta*\n\n` +
      `${p.tipo_evento} · ${p.data} · ${p.cidade_nome}\n` +
      (p.categorias ? `Procura: ${p.categorias}\n` : "") +
      `\nVeja os detalhes e mostre interesse:\n${urlSite()}/painel/pedidos`;
    await enfileirar(
      "pedido_novo",
      empresas.map((e) => ({ usuarioId: e.usuario_id, chave: `pedido_novo:${pedidoId}:${e.usuario_id}`, texto }))
    );
  });
}

/** Vaga nova → profissionais da função, do estado e do perfil pedido. */
export function avisarVagaNova(vagaId: string) {
  return seguro("vaga_nova", async () => {
    const v = await vagaInfo(vagaId);
    if (!v) return;
    const profs = await query<{ usuario_id: string }>(
      `SELECT p.usuario_id FROM profissionais p
         JOIN usuarios u ON u.id = p.usuario_id AND u.whatsapp_avisos
         JOIN bairros pb ON pb.id = p.bairro_id
         JOIN cidades pci ON pci.id = pb.cidade_id
         JOIN vagas_profissionais v ON v.id = $1
         JOIN cidades ci ON ci.id = v.cidade_id
        WHERE pci.estado = ci.estado
          AND (v.sexo_desejado = 'indiferente' OR v.sexo_desejado = p.sexo)
          AND EXISTS (SELECT 1 FROM profissional_categorias pc WHERE pc.profissional_id = p.usuario_id AND pc.categoria_id = v.categoria_profissional_id)`,
      [vagaId]
    );
    const texto =
      `📣 *Nova vaga para você na GetFesta*\n\n` +
      `${nomeDaVaga(v)} · ${v.nome_fantasia}\n${v.data} às ${v.hora} · ${v.cidade_nome}\n\n` +
      `Veja e candidate-se:\n${urlSite()}/vaga/${v.id}`;
    await enfileirar(
      "vaga_nova",
      profs.map((p) => ({ usuarioId: p.usuario_id, chave: `vaga_nova:${vagaId}:${p.usuario_id}`, texto }))
    );
  });
}

/** Profissional se candidatou → empresa dona da vaga. */
export function avisarCandidatura(vagaId: string, profissionalId: string) {
  return seguro("candidatura_nova", async () => {
    const v = await vagaInfo(vagaId);
    const prof = await queryOne<{ nome: string }>(`SELECT nome FROM profissionais WHERE usuario_id = $1`, [profissionalId]);
    if (!v || !prof) return;
    const texto =
      `🙋 *Novo candidato na sua vaga*\n\n` +
      `${prof.nome} se candidatou para ${nomeDaVaga(v)} (${v.data} às ${v.hora}).\n\n` +
      `Veja o perfil e escolha quem vai:\n${urlSite()}/painel/vagas/${v.id}`;
    await enfileirar("candidatura_nova", [{ usuarioId: v.empresa_id, chave: `candidatura:${vagaId}:${profissionalId}`, texto }]);
  });
}

/** Empresa escolheu o profissional → profissional. */
export function avisarSelecionado(vagaId: string, profissionalId: string) {
  return seguro("vaga_selecionado", async () => {
    const v = await vagaInfo(vagaId);
    if (!v) return;
    const texto =
      `✅ *Você foi escolhido(a)!*\n\n` +
      `${v.nome_fantasia} escolheu você para ${nomeDaVaga(v)}.\n${v.data} às ${v.hora} · ${v.cidade_nome}\n\n` +
      `A data já foi bloqueada na sua agenda. Veja os detalhes e o contato da empresa:\n${urlSite()}/perfil-profissional?tab=vagas`;
    await enfileirar("vaga_selecionado", [
      { usuarioId: profissionalId, chave: `selecionado:${vagaId}:${profissionalId}:${Date.now()}`, texto },
    ]);
  });
}

/** Profissional escolhido desistiu → empresa. */
export function avisarDesistencia(vagaId: string, profissionalNome: string) {
  return seguro("vaga_desistencia", async () => {
    const v = await vagaInfo(vagaId);
    if (!v) return;
    const texto =
      `⚠️ *Um profissional desistiu da sua vaga*\n\n` +
      `${profissionalNome} não vai mais para ${nomeDaVaga(v)} (${v.data} às ${v.hora}). A vaga voltou a ficar aberta para novos candidatos.\n\n` +
      `${urlSite()}/painel/vagas/${v.id}`;
    await enfileirar("vaga_desistencia", [
      { usuarioId: v.empresa_id, chave: `desistencia:${vagaId}:${profissionalNome}:${Date.now()}`, texto },
    ]);
  });
}

/** Lembrete na véspera: profissionais escolhidos e a empresa de cada vaga
 * de amanhã. Chave por dia → rodar várias vezes não repete o aviso. */
export async function enfileirarLembretes(): Promise<number> {
  const vagas = await query<VagaInfo & { selecionados: { id: string; nome: string }[] }>(
    `SELECT v.id, v.empresa_id, v.titulo, cp.nome AS categoria_nome, e.nome_fantasia, ci.nome AS cidade_nome,
            to_char(v.data_evento, 'DD/MM') AS data, to_char(v.hora_inicio, 'HH24"h"MI') AS hora,
            COALESCE(json_agg(json_build_object('id', p.usuario_id, 'nome', p.nome)) FILTER (WHERE p.usuario_id IS NOT NULL), '[]') AS selecionados
       FROM vagas_profissionais v
       JOIN categorias_profissionais cp ON cp.id = v.categoria_profissional_id
       JOIN empresas e ON e.usuario_id = v.empresa_id
       JOIN cidades ci ON ci.id = v.cidade_id
       LEFT JOIN vaga_candidaturas vc ON vc.vaga_id = v.id AND vc.status = 'selecionado'
       LEFT JOIN profissionais p ON p.usuario_id = vc.profissional_id
      WHERE v.status <> 'cancelada'
        AND v.data_evento = (now() AT TIME ZONE 'America/Sao_Paulo')::date + 1
      GROUP BY v.id, cp.nome, e.nome_fantasia, ci.nome`
  );
  let n = 0;
  for (const v of vagas) {
    if (v.selecionados.length === 0) continue;
    for (const s of v.selecionados) {
      n += await enfileirar("lembrete_vaga", [
        {
          usuarioId: s.id,
          chave: `lembrete:${v.id}:${s.id}`,
          texto:
            `⏰ *Lembrete: seu evento é amanhã*\n\n` +
            `${nomeDaVaga(v)} · ${v.nome_fantasia}\n${v.data} às ${v.hora} · ${v.cidade_nome}\n\n` +
            `Se tiver qualquer imprevisto, avise a empresa o quanto antes.\n${urlSite()}/perfil-profissional?tab=vagas`,
        },
      ]);
    }
    const nomes = v.selecionados.map((s) => s.nome).join(", ");
    n += await enfileirar("lembrete_vaga", [
      {
        usuarioId: v.empresa_id,
        chave: `lembrete:${v.id}:${v.empresa_id}`,
        texto:
          `⏰ *Lembrete: evento amanhã*\n\n` +
          `${nomeDaVaga(v)} · ${v.data} às ${v.hora} · ${v.cidade_nome}\n` +
          `Profissional(is) confirmado(s): ${nomes}\n\n${urlSite()}/painel/vagas/${v.id}`,
      },
    ]);
  }
  return n;
}
