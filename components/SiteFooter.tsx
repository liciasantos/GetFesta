import Link from "next/link";
import SocialIcons from "@/components/SocialIcons";

const COLUNAS = [
  {
    titulo: "Para clientes",
    links: [
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Buscar fornecedores", href: "/busca" },
      { label: "Publicar pedido", href: "/publicar-pedido" },
    ],
  },
  {
    titulo: "Para empresas",
    links: [
      { label: "Cadastrar minha empresa", href: "/cadastro/empresa" },
      { label: "Entrar no painel", href: "/entrar?tipo=empresa" },
    ],
  },
  {
    titulo: "Para profissionais",
    links: [
      { label: "Criar catálogo profissional", href: "/cadastro/profissional" },
      { label: "Entrar", href: "/entrar?tipo=profissional" },
    ],
  },
  {
    titulo: "Institucional",
    links: [
      { label: "Quem somos", href: "/quem-somos" },
      { label: "Contato", href: "/contato" },
      { label: "Termos de uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface-alt">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-6 py-12 sm:grid-cols-[1.2fr_repeat(2,1fr)] lg:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div className="col-span-2 sm:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-getfesta.svg" alt="GetFesta — quem faz sua festa acontecer" className="h-auto w-[190px]" />
          <p className="mt-4 max-w-xs text-[12.5px] leading-relaxed text-muted">
            O marketplace que conecta clientes a fornecedores de festas e eventos — sem custo para quem contrata.
          </p>
          <SocialIcons className="mt-4" />
        </div>

        {COLUNAS.map((col) => (
          <div key={col.titulo}>
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-2">{col.titulo}</h4>
            <ul className="flex flex-col gap-2.5 text-[13px] font-semibold text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-accent-dark">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-[11.5px] text-muted">
          <p>
            GetFesta é uma ferramenta de conexão entre clientes e prestadores independentes — não é empregadora,
            contratante nem garante a qualidade do serviço prestado.
          </p>
          <p className="text-muted-2">© {new Date().getFullYear()} GetFesta. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
