const DATA_URI_REGEX = /^data:([^;]+);base64,([\s\S]+)$/;

/** Decodifica um data URI (formato usado em todo upload de imagem/PDF do
 * site, sem storage externo) pros bytes reais + mime type - usado pelas
 * rotas /api/**\/imagem|foto|logo que servem esses arquivos como resposta
 * HTTP de verdade (com Cache-Control), em vez de embutir o base64 direto
 * no HTML/JSON de cada página. */
export function parseDataUri(value: string): { mime: string; bytes: Buffer<ArrayBuffer> } | null {
  const match = value.match(DATA_URI_REGEX);
  if (!match) return null;
  const [, mime, base64] = match;
  return { mime, bytes: Buffer.from(base64, "base64") };
}
