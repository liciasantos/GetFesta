import type { Metadata } from "next";

/** Monta title/description + Open Graph juntos, sempre em sincronia -
 * definir "openGraph" numa página SUBSTITUI por completo o objeto herdado
 * de app/layout.tsx (não faz merge campo a campo), então uma página que só
 * define "title"/"description" soltos acaba mostrando o título genérico do
 * site quando o link é compartilhado (WhatsApp, Instagram etc.) - foi
 * exatamente esse bug que motivou criar esse helper. `image` aceita URL
 * absoluta ou caminho relativo (resolvido contra metadataBase); sem imagem
 * própria, cai na imagem padrão do site (app/opengraph-image.tsx). */
export function paginaMetadata({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string | null;
}): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, images: [image || "/opengraph-image"] },
  };
}
