import SocialIcons from "@/components/SocialIcons";

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-extrabold">Contato</h1>
      <p className="mt-2 text-sm text-muted">Dúvidas, sugestões ou algum problema? Fala com a gente.</p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-2">E-mail</h2>
          <a href="mailto:contato@getfesta.com.br" className="mt-1 block text-[14.5px] font-bold text-accent-dark hover:underline">
            contato@getfesta.com.br
          </a>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-2">WhatsApp</h2>
          <p className="mt-1 text-[14.5px] font-bold">Em breve</p>
          <p className="mt-1 text-[12px] text-muted">Por enquanto, fale com a gente por e-mail.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-2">Redes sociais</h2>
          <SocialIcons />
        </div>
      </div>

      <p className="mt-8 text-[11.5px] text-muted">
        Este é um ambiente de demonstração — os canais de contato acima ainda serão configurados antes do lançamento.
      </p>
    </div>
  );
}
