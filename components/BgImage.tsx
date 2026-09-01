import Image from "next/image";

/** Imagem de fundo full-bleed (usa fill + object-cover). Passa por next/image
 * (AVIF/WebP automatico, srcset responsivo, priority pra LCP) quando o src é
 * um arquivo estático - cai pra <img> comum quando é uma data URI (upload do
 * admin/empresa), já que aí não sobra nada pra otimizar e evita qualquer
 * inconsistência do componente com data URIs muito grandes. */
export default function BgImage({
  src,
  alt = "",
  className,
  priority = false,
  sizes = "100vw",
}: {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className ?? ""}`} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}
