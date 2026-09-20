import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { parseDataUri } from "@/lib/data-uri";

/** Serve a foto do profissional (foto_perfil_url ou, na falta dela, a
 * primeira foto da galeria) como um arquivo de verdade, cacheável - mesmo
 * padrão de app/api/empresa/[id]/foto-capa/route.ts. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = await queryOne<{ foto: string | null }>(
    `SELECT COALESCE(
       p.foto_perfil_url,
       (SELECT url FROM profissional_galeria g WHERE g.profissional_id = p.usuario_id AND g.tipo = 'foto' ORDER BY g.ordem ASC LIMIT 1)
     ) AS foto
     FROM profissionais p WHERE p.usuario_id = $1`,
    [id]
  );
  if (!row?.foto) return new NextResponse("Não encontrado", { status: 404 });

  const parsed = parseDataUri(row.foto);
  if (!parsed) return new NextResponse("Imagem inválida", { status: 500 });

  return new NextResponse(parsed.bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
