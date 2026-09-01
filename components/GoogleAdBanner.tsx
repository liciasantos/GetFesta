import { getConfiguracoesSite, CONFIG_GOOGLE_ADS_CLIENT, CONFIG_GOOGLE_ADS_SLOT } from "@/lib/data/config";
import GoogleAdUnit from "@/components/GoogleAdUnit";

/** Box de anuncio do Google (AdSense), acima do rodape em todas as
 * paginas. Fica invisivel ate o admin cadastrar client/slot em
 * /admin/site - evita caixa vazia pra quem ainda nao configurou. */
export default async function GoogleAdBanner() {
  const config = await getConfiguracoesSite();
  const clientId = config[CONFIG_GOOGLE_ADS_CLIENT];
  const slotId = config[CONFIG_GOOGLE_ADS_SLOT];
  if (!clientId || !slotId) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <GoogleAdUnit clientId={clientId} slotId={slotId} />
    </div>
  );
}
