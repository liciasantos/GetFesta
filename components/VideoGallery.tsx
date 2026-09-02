import { getYoutubeEmbedUrl } from "@/lib/youtube";

export default function VideoGallery({ videos }: { videos: { id: string; url: string }[] }) {
  const embeds = videos.map((v) => ({ id: v.id, embedUrl: getYoutubeEmbedUrl(v.url) })).filter((v) => v.embedUrl);
  if (embeds.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {embeds.map((v) => (
        <div key={v.id} className="aspect-video overflow-hidden rounded-lg border border-border">
          <iframe
            src={v.embedUrl!}
            title="Vídeo de performance"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}
