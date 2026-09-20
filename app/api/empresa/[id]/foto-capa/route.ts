import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { parseDataUri } from "@/lib/data-uri";

/** Serve a primeira foto da galeria da empresa (guardada como data URI em
 * empresa_galeria) como um arquivo de verdade, cacheável - ver
 * app/api/hero-banner/[id]/imagem/[variant]/route.ts pro mesmo padrão. Sem
 * isso, EMPRESA_CARD_SELECT (lib/data/empresas.ts) traria o base64 inteiro
 * embutido em toda listagem de empresas (home, busca), a cada carregamento. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const foto = await queryOne<{ url: string }>(
    `SELECT url FROM empresa_galeria WHERE empresa_id = $1 ORDER BY ordem ASC LIMIT 1`,
    [id]
  );
  if (!foto) return new NextResponse("Não encontrado", { status: 404 });

  const parsed = parseDataUri(foto.url);
  if (!parsed) return new NextResponse("Imagem inválida", { status: 500 });

  return new NextResponse(parsed.bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
