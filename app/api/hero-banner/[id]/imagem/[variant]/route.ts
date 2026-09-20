import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { parseDataUri } from "@/lib/data-uri";

/** Serve a imagem do banner hero (guardada como data URI em banners_hero,
 * mesmo esquema de upload sem storage externo usado em todo o site) como um
 * arquivo de verdade, com Content-Type e Cache-Control proprios - em vez de
 * embutir a imagem inteira dentro do HTML da home a cada carregamento. Isso
 * também deixa o next/image (via BgImage) otimizar e cachear a imagem, já
 * que deixa de ser reconhecida como data: URI. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant: variantParam } = await params;
  const variant = variantParam === "mobile" ? "mobile" : "desktop";

  const banner = await queryOne<{ imagem_fundo: string; imagem_fundo_mobile: string | null }>(
    `SELECT imagem_fundo, imagem_fundo_mobile FROM banners_hero WHERE id = $1`,
    [id]
  );
  if (!banner) return new NextResponse("Não encontrado", { status: 404 });

  const dataUri = (variant === "mobile" ? banner.imagem_fundo_mobile : null) ?? banner.imagem_fundo;
  const parsed = parseDataUri(dataUri);
  if (!parsed) return new NextResponse("Imagem inválida", { status: 500 });

  return new NextResponse(parsed.bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
