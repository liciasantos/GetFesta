import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CookieConsent from "@/components/CookieConsent";
import GoogleAdBanner from "@/components/GoogleAdBanner";
import GoogleAdsenseHead from "@/components/GoogleAdsenseHead";
import ClarityScript from "@/components/ClarityScript";
import GoogleTagManagerScript, { GoogleTagManagerNoScript } from "@/components/GoogleTagManager";
import MobileAccountNav from "@/components/MobileAccountNav";
import { getSession } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const TITULO_SITE = "GetFesta — quem faz sua festa acontecer";
const DESCRICAO_SITE = "Marketplace que conecta clientes a fornecedores de festas e eventos — sem custo para quem contrata.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITULO_SITE,
  description: DESCRICAO_SITE,
  // Padrão pra toda página que não define o próprio openGraph/twitter (ex:
  // perfil de empresa, vaga) - sem isso, links compartilhados no WhatsApp/
  // Instagram/etc não mostravam nenhuma prévia (nem imagem, nem texto
  // customizado). A imagem vem de app/opengraph-image.tsx (gerada pelo
  // Next.js, sem precisar de um arquivo estático).
  openGraph: {
    title: TITULO_SITE,
    description: DESCRICAO_SITE,
    url: SITE_URL,
    siteName: "GetFesta",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_SITE,
    description: DESCRICAO_SITE,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="pt-BR" className={`h-full ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        {/* strategy="beforeInteractive" faz o Next.js injetar esse script no
            <head>, independente de estar declarado aqui dentro do <body> -
            é a forma documentada de carregar o GTM no App Router. */}
        <GoogleTagManagerScript />
        <GoogleTagManagerNoScript />
        <GoogleAdsenseHead />
        <ClarityScript />
        <SiteHeader />
        <main className="flex-1">
          <MobileAccountNav tipo={session?.tipo ?? null}>{children}</MobileAccountNav>
        </main>
        <GoogleAdBanner />
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
