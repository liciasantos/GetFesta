import SocialIcons from "@/components/SocialIcons";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  getConfiguracoesSite,
  CONFIG_CONTATO_EMAIL,
  CONFIG_CONTATO_TELEFONE,
  CONFIG_CONTATO_WHATSAPP,
  CONFIG_SOCIAL_INSTAGRAM,
  CONFIG_SOCIAL_TIKTOK,
  CONFIG_SOCIAL_YOUTUBE,
} from "@/lib/data/config";

export const dynamic = "force-dynamic";

export default async function ContatoPage() {
  const config = await getConfiguracoesSite();
  const email = config[CONFIG_CONTATO_EMAIL];
  const telefone = config[CONFIG_CONTATO_TELEFONE];
  const whatsapp = config[CONFIG_CONTATO_WHATSAPP];

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-extrabold">Contato</h1>
      <p className="mt-2 text-sm text-muted">Dúvidas, sugestões ou algum problema? Fala com a gente.</p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-2">E-mail</h2>
          <a href={`mailto:${email}`} className="mt-1 block text-[14.5px] font-bold text-accent-dark hover:underline">
            {email}
          </a>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-2">Telefone</h2>
          {telefone ? (
            <p className="mt-1 text-[14.5px] font-bold">{telefone}</p>
          ) : (
            <p className="mt-1 text-[13px] text-muted">Ainda não cadastrado.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-2">WhatsApp</h2>
          {whatsapp ? (
            <a
              href={buildWhatsAppLink(whatsapp, "Olá! Vim pelo site da GetFesta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-[14.5px] font-bold text-accent-dark hover:underline"
            >
              {whatsapp}
            </a>
          ) : (
            <>
              <p className="mt-1 text-[14.5px] font-bold">Em breve</p>
              <p className="mt-1 text-[12px] text-muted">Por enquanto, fale com a gente por e-mail.</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-2">Redes sociais</h2>
          <SocialIcons
            instagram={config[CONFIG_SOCIAL_INSTAGRAM]}
            tiktok={config[CONFIG_SOCIAL_TIKTOK]}
            youtube={config[CONFIG_SOCIAL_YOUTUBE]}
          />
        </div>
      </div>
    </div>
  );
}
