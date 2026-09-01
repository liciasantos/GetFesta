import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getConfiguracoesSite,
  CONFIG_SOCIAL_INSTAGRAM,
  CONFIG_SOCIAL_TIKTOK,
  CONFIG_SOCIAL_YOUTUBE,
  CONFIG_CONTATO_EMAIL,
  CONFIG_CONTATO_TELEFONE,
  CONFIG_CONTATO_WHATSAPP,
  CONFIG_GOOGLE_ADS_CLIENT,
  CONFIG_GOOGLE_ADS_SLOT,
} from "@/lib/data/config";
import TextConfigForm from "@/components/admin/TextConfigForm";

export const dynamic = "force-dynamic";

export default async function AdminSitePage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const config = await getConfiguracoesSite();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>
      <h1 className="mb-1 mt-3 text-xl font-extrabold">Redes sociais e contato</h1>
      <p className="mb-6 text-sm text-muted">
        Aparecem no rodapé do site e na página &quot;Contato&quot;. Deixe em branco pra manter desabilitado.
      </p>

      <div className="flex flex-col gap-5">
        <TextConfigForm
          titulo="Redes sociais"
          descricao='Link completo de cada rede. Vazio = ícone fica desabilitado no rodapé/contato.'
          campos={[
            { chave: CONFIG_SOCIAL_INSTAGRAM, label: "Instagram", placeholder: "https://instagram.com/getfesta", atual: config[CONFIG_SOCIAL_INSTAGRAM] },
            { chave: CONFIG_SOCIAL_TIKTOK, label: "TikTok", placeholder: "https://tiktok.com/@getfesta", atual: config[CONFIG_SOCIAL_TIKTOK] },
            { chave: CONFIG_SOCIAL_YOUTUBE, label: "YouTube", placeholder: "https://youtube.com/@getfesta", atual: config[CONFIG_SOCIAL_YOUTUBE] },
          ]}
        />

        <TextConfigForm
          titulo="Página de contato"
          descricao="Email, telefone e WhatsApp exibidos em /contato."
          campos={[
            { chave: CONFIG_CONTATO_EMAIL, label: "E-mail", placeholder: "contato@getfesta.com.br", atual: config[CONFIG_CONTATO_EMAIL] },
            { chave: CONFIG_CONTATO_TELEFONE, label: "Telefone", placeholder: "(21) 99999-9999", atual: config[CONFIG_CONTATO_TELEFONE] },
            { chave: CONFIG_CONTATO_WHATSAPP, label: "WhatsApp (DDD + número)", placeholder: "21999999999", atual: config[CONFIG_CONTATO_WHATSAPP] },
          ]}
        />

        <TextConfigForm
          titulo="Anúncio Google (AdSense)"
          descricao="Box de anúncio exibido acima do rodapé em todas as páginas. Deixe em branco pra manter desativado."
          campos={[
            { chave: CONFIG_GOOGLE_ADS_CLIENT, label: "Client ID (publisher)", placeholder: "ca-pub-1234567890123456", atual: config[CONFIG_GOOGLE_ADS_CLIENT] },
            { chave: CONFIG_GOOGLE_ADS_SLOT, label: "Slot ID (bloco de anúncio)", placeholder: "1234567890", atual: config[CONFIG_GOOGLE_ADS_SLOT] },
          ]}
        />
      </div>
    </div>
  );
}
