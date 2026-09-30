import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { parseDataUri } from "@/lib/data-uri";

/** Serve uma foto da galeria da empresa (data URI em empresa_galeria) como
 * arquivo de verdade. Sem isso o perfil público embutia todas as fotos em
 * base64 no HTML (~1,8 MB por página). O conteúdo de uma foto nunca muda
 * para o mesmo id (trocar = apagar e subir outra), então o cache é longo e
 * imutável. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ fotoId: string }> }) {
  const { fotoId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(fotoId)) return new NextResponse("Não encontrado", { status: 404 });

  const foto = await queryOne<{ url: string }>(`SELECT url FROM empresa_galeria WHERE id = $1`, [fotoId]);
  if (!foto) return new NextResponse("Não encontrado", { status: 404 });
  if (!foto.url.startsWith("data:")) return NextResponse.redirect(foto.url);

  const parsed = parseDataUri(foto.url);
  if (!parsed) return new NextResponse("Imagem inválida", { status: 500 });
  return new NextResponse(parsed.bytes, {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
