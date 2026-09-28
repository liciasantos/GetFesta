import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listCategorias } from "@/lib/data/geo";
import { getPerfilPermuta, getPermutaConfig, listBuscas, listOfertas } from "@/lib/data/permuta";
import { PausarParticipacao } from "@/components/permuta/ParticipacaoForms";
import OfertasManager from "@/components/permuta/OfertasManager";
import BuscasForm from "@/components/permuta/BuscasForm";

export const dynamic = "force-dynamic";

export default async function MinhasOfertasPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");

  const { bemvindo } = await searchParams;
  const cfg = await getPermutaConfig();
  const [ofertas, buscas, categorias, perfil] = await Promise.all([
    listOfertas(session.usuarioId, false),
    listBuscas(session.usuarioId),
    listCategorias(),
    getPerfilPermuta(session.usuarioId, cfg),
  ]);

  return (
    <div className="flex flex-col gap-5">
      {bemvindo && perfil?.participa && (
        <div className="rounded-xl border border-[#bfe0cb] bg-ok-soft p-4 text-[13px] text-ok">
          <b>Pronto, sua empresa faz parte da rede de permutas!</b> Agora cadastre o que você oferece e o que busca — é isso
          que faz você aparecer para as empresas certas.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="text-[13px]">
          <b>Participação na rede:</b>{" "}
          {perfil?.participa ? <span className="font-bold text-ok">ativa</span> : <span className="font-bold text-note-text">pausada</span>}
          <span className="block text-[12px] text-muted">
            {perfil?.participa
              ? "Sua empresa aparece na vitrine e pode receber propostas."
              : "Sua empresa não aparece na vitrine nem recebe propostas."}
          </span>
        </div>
        {perfil?.participa && <PausarParticipacao ativa />}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-[15px] font-extrabold">O que você oferece</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Seu serviço é a moeda da troca. Informe um valor de referência de mercado — ele aparece na proposta para
          equilibrar os dois lados.
        </p>
        <div className="mt-4">
          <OfertasManager ofertas={ofertas} categorias={categorias} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-[15px] font-extrabold">O que você busca</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Usamos isso para sugerir empresas compatíveis e para mostrar seu perfil a quem oferece essas categorias.
        </p>
        <div className="mt-4">
          <BuscasForm categorias={categorias} selecionadas={buscas.map((b) => b.categoria_id)} />
        </div>
      </section>
      </div>
    </div>
  );
}
