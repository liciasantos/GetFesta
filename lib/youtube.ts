/** Extrai o ID de um link do YouTube (watch, youtu.be ou shorts) pra montar a
 * URL de embed - mesma validação usada em adicionarVideoLinkProfissional. */
export function getYoutubeEmbedUrl(url: string): string | null {
  const match = url
    .trim()
    .match(/^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/i);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
}
