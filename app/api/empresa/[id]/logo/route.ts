import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { parseDataUri } from "@/lib/data-uri";

/** Serve o logo da empresa (guardado como data URI em empresas.logo_url)
 * como um arquivo de verdade, cacheável - mesmo padrão de
 * app/api/empresa/[id]/foto-capa/route.ts. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const empresa = await queryOne<{ logo_url: string | null }>(`SELECT logo_url FROM empresas WHERE usuario_id = $1`, [
    id,
  ]);
  if (!empresa?.logo_url) return new NextResponse("Não encontrado", { status: 404 });

  const parsed = parseDataUri(empresa.logo_url);
  if (!parsed) return new NextResponse("Imagem inválida", { status: 500 });

  return new NextResponse(parsed.bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
