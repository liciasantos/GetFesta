import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** app/robots.ts é uma convenção do Next.js - gera /robots.txt automaticamente.
 * Bloqueia áreas logadas/privadas (nunca têm conteúdo público pra indexar) e
 * a API - o resto do site é livre pra rastrear. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/painel",
        "/perfil-profissional",
        "/meu-perfil",
        "/meus-pedidos",
        "/calculadora-eventos",
        "/profissional/",
        "/entrar",
        "/cadastro",
        "/completar-cadastro",
        "/contratar",
        "/esqueci-senha",
        "/redefinir-senha",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
