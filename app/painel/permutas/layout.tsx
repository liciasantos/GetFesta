import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import {
  getPerfilPermuta,
  getPermutaConfig,
  getPlanosEmpresaPorTipo,
  getUsoPlanoPermuta,
  sincronizarPermutas,
} from "@/lib/data/permuta";
import PermutaTabs from "@/components/permuta/PermutaTabs";
import Apresentacao from "@/components/permuta/Apresentacao";
import { PausarParticipacao } from "@/components/permuta/ParticipacaoForms";

export const dynamic = "force-dynamic";

/** Casca da seção Permutas: exige empresa logada e atualiza entregas vencidas
 * (confirmação automática) antes de qualquer página ler os dados.
 * A participação é opcional: quem nunca ativou (e não tem acordo nenhum) vê
 * só a explicação com o botão de participar; quem pausou continua acessando
 * os acordos que já tem, com um aviso pra reativar. */
export default async function PermutasLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const cfg = await getPermutaConfig();
  await sincronizarPermutas(cfg);

  const header = (
    <div className="mb-4">
      <h1 className="text-2xl font-extrabold">Permutas</h1>
      <p className="mt-1 text-sm text-muted">Troque serviços com outros fornecedores verificados da plataforma.</p>
    </div>
  );

  if (!cfg.ativa) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 pb-28 sm:pb-8">
        {header}
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          A rede de permutas está temporariamente desativada. Volte em breve!
        </div>
      </div>
    );
  }

  const [perfil, temAcordos] = await Promise.all([
    getPerfilPermuta(session.usuarioId, cfg),
    queryOne<{ tem: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM permuta_acordos WHERE $1 IN (proponente_id, destinatario_id)) AS tem`,
      [session.usuarioId]
    ),
  ]);
  if (!perfil) redirect("/painel");

  if (!perfil.participa && !temAcordos?.tem) {
    const [uso, planos] = await Promise.all([getUsoPlanoPermuta(session.usuarioId, cfg), getPlanosEmpresaPorTipo()]);
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 pb-28 sm:pb-8">
        {header}
        <Apresentacao cfg={cfg} perfil={perfil} uso={uso} planos={planos} mostrarAdesao />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 pb-28 sm:pb-8">
      {header}
      {!perfil.participa && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-note-border bg-note-bg p-4 text-[13px] text-note-text">
          <span>
            <b>Sua participação está pausada.</b> Sua empresa não aparece na vitrine e não recebe novas propostas. Os acordos
            em andamento continuam normalmente.
          </span>
          <PausarParticipacao ativa={false} />
        </div>
      )}
      <PermutaTabs />
      {children}
    </div>
  );
}
