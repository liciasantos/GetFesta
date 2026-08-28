import Link from "next/link";
import { Badge, PlaceholderImg } from "@/components/ui";
import type { ProfissionalBusca } from "@/lib/data/profissionais";

export default function ProfissionalCard({ p }: { p: ProfissionalBusca }) {
  return (
    <Link
      href={`/profissional/${p.slug}`}
      className="card-hover overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {p.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto} alt={p.nome} className="aspect-square w-full object-cover" />
      ) : (
        <PlaceholderImg className="aspect-square w-full" />
      )}
      <div className="p-3.5">
        <div className="text-[13.5px] font-bold">{p.nome}</div>
        <div className="mt-0.5 text-[11.5px] text-muted">
          {p.categoria_principal ?? "Profissional"} · {p.bairro_nome ?? p.cidade_nome ?? ""}
        </div>
        <div className="mt-1 text-[11.5px] font-semibold text-accent-dark">
          {p.nota_media ? `⭐ ${Number(p.nota_media).toFixed(1)} (${p.total_avaliacoes})` : "Ainda sem avaliação"}
        </div>
        {p.aprovada_para_destaque && (
          <div className="mt-2">
            <Badge tone="ad">Anúncio</Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
