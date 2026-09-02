"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UploadResult } from "@/lib/actions/perfil";
import { buttonClass } from "@/components/ui";

export default function VideoLinkManager({
  videos,
  limite,
  onAdd,
  onRemove,
}: {
  videos: { id: string; url: string }[];
  limite: number;
  onAdd: (url: string) => Promise<UploadResult>;
  onRemove: (id: string) => Promise<UploadResult>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    const url = inputRef.current?.value.trim();
    if (!url) return;
    startTransition(async () => {
      const res = await onAdd(url);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    setError(null);
    startTransition(async () => {
      await onRemove(id);
      router.refresh();
    });
  }

  if (limite === 0) {
    return (
      <p className="text-[11.5px] font-semibold text-accent-dark">
        🔒 Links de vídeo são exclusivos do plano Premium. Fale com a gente pra contratar.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {videos.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-[12px]">
            <span className="truncate">{v.url}</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemove(v.id)}
              className="shrink-0 text-[11.5px] font-bold text-danger-dark hover:underline disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {videos.length < limite && (
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            className="min-w-0 flex-1 rounded-md border border-border-strong px-2.5 py-1.5 text-[12.5px]"
          />
          <button type="button" disabled={isPending} onClick={handleAdd} className={buttonClass("secondary", "sm")}>
            Adicionar
          </button>
        </div>
      )}

      <p className="mt-1.5 text-[10.5px] text-muted-2">
        {videos.length}/{limite} vídeos do YouTube.
      </p>
      {error && <p className="mt-1 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
