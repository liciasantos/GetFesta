import Link from "next/link";
import { listCategorias, listCidades } from "@/lib/data/geo";
import { getEmpresasDestaque } from "@/lib/data/empresas";
import { listPedidosFeed } from "@/lib/data/pedidos";
import { listBannersAtivos } from "@/lib/data/banners";
import { Badge, PlaceholderImg, buttonClass } from "@/components/ui";
import Hero from "@/components/HeroBannerCarousel";
import MiniPedidoForm from "@/components/MiniPedidoForm";
import PedidosCarousel from "@/components/PedidosCarousel";
import DestaquesGrid, { DestaquesKicker } from "@/components/DestaquesGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categorias, cidades, empresasDestaque, pedidos, banners] = await Promise.all([
    listCategorias(),
    listCidades(),
    getEmpresasDestaque(4),
    listPedidosFeed({ limit: 15 }),
    listBannersAtivos(),
  ]);

  return (
    <div>
      {/* HERO — banner full-bleed de anúncios */}
      <Hero banners={banners} />

      {/* BOX "SEM CUSTO PRA QUEM CONTRATA" — sobrepõe a base do banner, como um
          card flutuante (negative margin puxa pra cima do hero) */}
      <section className="relative z-10 px-6">
        <div className="mx-auto -mt-[46px] max-w-6xl rounded-2xl border border-border bg-surface p-6 shadow-card-hover sm:-mt-16 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="lg:max-w-[280px] lg:shrink-0">
              <span className="section-kicker">Sem custo pra quem contrata</span>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                Encontre quem faz <span className="text-accent">sua festa acontecer</span>.
              </h1>
            </div>
            <div className="lg:flex-1">
              <MiniPedidoForm cidades={cidades} />
            </div>
          </div>
        </div>
      </section>

      {/* PEDIDOS FEED — carrossel */}
      <section className="border-b border-border px-6 pb-16 pt-[58px] sm:pb-20 sm:pt-[72px]">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker">01 — Pedidos</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Pedidos publicados agora</h2>
          <p className="mt-1.5 max-w-lg text-[13.5px] text-muted">Visível para qualquer visitante — sem nome, sem contato.</p>
          <div className="mt-9">
            <PedidosCarousel pedidos={pedidos} />
          </div>
          <div className="mt-2 text-center">
            <Link href="/pedidos" className={buttonClass("secondary")}>
              Ver mais pedidos
            </Link>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA — imagem full-bleed com faixa de passos numerados por
          cima, inspirado numa referencia de site de turismo que o usuario
          trouxe (fundo atmosferico + coluna de intro + steps com divisorias) */}
      <section id="como-funciona" className="relative min-h-[420px] w-full overflow-hidden bg-text sm:min-h-[465px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sitio-festa-infantil.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-black/15" />

        {/* faixa fixada na base da imagem via position absolute (nao margem
            negativa) - assim nao corre risco de "vazar" texto por cima da
            imagem em telas/alturas diferentes, como aconteceu no banner da
            empresa antes. */}
        <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-text/75 backdrop-blur-[1px]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-[1.1fr_repeat(3,1fr)]">
            <div className="border-white/15 px-6 py-9 sm:border-r sm:py-11">
              <span className="section-kicker">02 — Como funciona</span>
              <p className="mt-3 max-w-xs text-lg font-bold leading-snug text-white sm:text-xl">
                Do pedido ao fornecedor certo, em três passos — sem custo pra quem contrata.
              </p>
            </div>
            {[
              {
                n: "01",
                t: "Publique seu pedido",
                d: "Tipo de festa, data e o que procura — leva 2 minutos, sem criar conta.",
              },
              {
                n: "02",
                t: "Empresas te respondem",
                d: "Fornecedores da sua região avaliam e manifestam interesse.",
              },
              {
                n: "03",
                t: "Combine no WhatsApp",
                d: "Interesse aceito, contato liberado direto no WhatsApp.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`border-white/15 px-6 py-9 sm:py-11 ${i > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}
              >
                <div className="font-display text-4xl font-extrabold text-white sm:text-[42px]">{s.n}</div>
                <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-white/50">Passo</div>
                <h3 className="mt-7 text-[15.5px] font-bold text-white sm:mt-9">{s.t}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/60">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUES DA SEMANA */}
      {banners.length > 0 && (
        <section className="border-b border-border bg-surface-alt/60 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <span className="section-kicker">03 — Destaques da semana</span>
            <div className="mt-3">
              <DestaquesKicker />
            </div>
            <p className="mt-1.5 max-w-lg text-[13.5px] text-muted">
              Posição fixa por categoria — clique abre o WhatsApp direto, sem passar pelo funil de interesse.
            </p>
            <div className="mt-9">
              <DestaquesGrid banners={banners} />
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIAS */}
      <section className="border-b border-border px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker">{banners.length > 0 ? "04" : "03"} — Categorias</span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold sm:text-[26px]">O que você está procurando?</h2>
            <Link href="/busca" className="text-[13px] font-bold text-accent-dark hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-2.5">
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/busca?categoria=${cat.slug}`}
                className="rounded-lg border-2 border-[#6B7684] px-4 py-2.5 text-[12.5px] font-bold text-[#6B7684] transition-colors hover:bg-[#6B7684] hover:text-white"
              >
                {cat.nome}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EMPRESAS EM DESTAQUE */}
      <section className="border-b border-border px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker">{banners.length > 0 ? "05" : "04"} — Fornecedores</span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold sm:text-[26px]">Empresas em destaque na sua região</h2>
            <Link href="/busca" className="text-[13px] font-bold text-accent-dark hover:underline">
              Ver todas →
            </Link>
          </div>
          <p className="mt-1.5 max-w-lg text-[13.5px] text-muted">
            Sem login: nome, categoria, cidade e nota. Instagram e telefone só depois de login e interesse aceito.
          </p>
          <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">
            {empresasDestaque.map((e) => (
              <Link
                key={e.usuario_id}
                href={`/empresa/${e.usuario_id}`}
                className="card-hover overflow-hidden rounded-2xl border border-border bg-surface"
              >
                {e.foto_capa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto_capa} alt={e.nome_fantasia} className="h-28 w-full object-cover" />
                ) : (
                  <PlaceholderImg className="h-28 w-full" />
                )}
                <div className="p-3.5">
                  <div className="text-[13.5px] font-bold">{e.nome_fantasia}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {e.categorias[0] ?? "Fornecedor"} · {e.cidades[0] ?? ""}
                  </div>
                  <div className="mt-1 text-[11.5px] font-semibold text-accent-dark">
                    {e.nota_exibida ? `⭐ ${Number(e.nota_exibida).toFixed(1)} (${e.total_avaliacoes_exibido})` : "Empresa nova"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.aprovada_para_destaque && <Badge tone="ad">Destaque</Badge>}
                    {e.selo_verificado && <Badge tone="ok">Selo verificado</Badge>}
                    {e.nota_fonte === "google" && <Badge tone="muted">Nota no Google</Badge>}
                    {!e.perfil_reivindicado && <Badge tone="warn">Perfil não confirmado</Badge>}
                  </div>
                </div>
              </Link>
            ))}
            {empresasDestaque.length === 0 && (
              <p className="col-span-full text-sm text-muted">Nenhuma empresa cadastrada por aqui ainda.</p>
            )}
          </div>
        </div>
      </section>

      {/* PLANOS PARA FORNECEDORES */}
      <section className="border-b border-border bg-surface-alt/60 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker">{banners.length > 0 ? "06" : "05"} — Planos para fornecedores</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-[26px]">Comece grátis, cresça no seu ritmo</h2>
          <p className="mt-1.5 max-w-lg text-[13.5px] text-muted">
            Sem contrato de fidelidade — mude de plano quando quiser, direto no seu painel.
          </p>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANOS_FORNECEDOR.map((p) => (
              <div
                key={p.nome}
                className={`relative rounded-2xl border p-6 ${
                  p.destaque ? "border-accent bg-surface shadow-card-hover" : "border-border bg-surface"
                }`}
              >
                {p.destaque && (
                  <span className="absolute -top-3 left-6">
                    <Badge tone="ad">Mais popular</Badge>
                  </span>
                )}
                <h3 className="text-[15px] font-bold">{p.nome}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold">{p.preco}</span>
                  {p.preco !== "R$ 0" && <span className="text-[12px] text-muted">/mês</span>}
                </div>
                <ul className="mt-5 flex flex-col gap-2.5 text-[12.5px] leading-relaxed">
                  {p.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-0.5 text-ok">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro/empresa"
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-[13px] font-bold ${
                    p.destaque
                      ? "bg-accent text-white hover:bg-accent-dark"
                      : "border border-border-strong text-text hover:bg-surface-alt"
                  }`}
                >
                  Contratar {p.nome}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col items-center justify-between gap-6 rounded-2xl bg-text px-8 py-10 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="text-lg font-extrabold text-white">Você é fornecedor de festas?</h3>
              <p className="mt-1.5 max-w-md text-[13px] text-white/70">
                Receba pedidos de clientes da sua região — cadastro gratuito, comece no plano Grátis agora mesmo.
              </p>
            </div>
            <Link href="/cadastro/empresa" className={`${buttonClass("primary", "lg")} shrink-0`}>
              Quero receber pedidos de festa →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const PLANOS_FORNECEDOR = [
  {
    nome: "Grátis",
    preco: "R$ 0",
    destaque: false,
    beneficios: ["Até 4 orçamentos respondidos por mês", "Perfil completo com fotos e descrição", "Sem cartão, sem fidelidade"],
  },
  {
    nome: "Light",
    preco: "R$ 20",
    destaque: false,
    beneficios: ["Até 25 orçamentos respondidos por mês", "Perfil completo com fotos e descrição", "Suporte por WhatsApp"],
  },
  {
    nome: "Completo",
    preco: "R$ 55",
    destaque: true,
    beneficios: [
      "Orçamentos ilimitados por mês",
      "2 meses em Destaques da semana na home",
      "Pra manter o destaque no ciclo seguinte, é só contratar o plano bimestral",
    ],
  },
];
