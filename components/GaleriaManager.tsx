"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resizeImageToDataUrl } from "@/lib/image-client";
import type { UploadResult } from "@/lib/actions/perfil";

export default function GaleriaManager({
  fotos,
  onAdd,
  onRemove,
  limite = 12,
}: {
  fotos: { id: string; url: string }[];
  onAdd: (dataUrl: string) => Promise<UploadResult>;
  onRemove: (id: string) => Promise<UploadResult>;
  limite?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const vagas = Math.max(0, limite - fotos.length);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const imagens = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imagens.length === 0) return;
    const aceitas = imagens.slice(0, vagas);
    if (imagens.length > aceitas.length) {
      setError(`Só cabiam mais ${vagas} foto(s) — o restante não foi enviado (limite de ${limite}).`);
    }

    startTransition(async () => {
      for (const file of aceitas) {
        try {
          const resized = await resizeImageToDataUrl(file, 640, 0.82);
          const res = await onAdd(resized.dataUrl);
          if (res.error) {
            setError(res.error);
            break;
          }
        } catch {
          setError("Não foi possível processar uma das imagens.");
          break;
        }
      }
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    setRemovingId(id);
    startTransition(async () => {
      await onRemove(id);
      setRemovingId(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div
        className={`grid grid-cols-3 gap-2.5 rounded-lg sm:grid-cols-4 ${dragOver ? "outline outline-2 outline-offset-4 outline-accent" : ""}`}
        onDragOver={(e) => {
          if (vagas === 0) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (vagas === 0 || !e.dataTransfer.files) return;
          void handleFiles(e.dataTransfer.files);
        }}
      >
        {fotos.map((f) => (
          <FotoThumb key={f.id} foto={f} pending={isPending} removingId={removingId} onRemove={handleRemove} />
        ))}

        {vagas > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-muted hover:border-accent-soft-2 hover:bg-accent-soft disabled:opacity-50"
          >
            <span className="text-xl">+</span>
            <span className="text-[10.5px] font-bold">Adicionar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-[11px] text-muted-2">
        {fotos.length}/{limite} fotos. Você pode selecionar várias de uma vez ou arrastar e soltar aqui.
      </p>
      {error && <p className="mt-1 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}

function FotoThumb({
  foto,
  pending,
  removingId,
  onRemove,
}: {
  foto: { id: string; url: string };
  pending: boolean;
  removingId: string | null;
  onRemove: (id: string) => void;
}) {
  const [meta, setMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);

  function measure(el: HTMLImageElement) {
    if (meta || !el.naturalWidth) return;
    setMeta({ width: el.naturalWidth, height: el.naturalHeight, sizeKb: Math.round((foto.url.length * 0.75) / 1024) });
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.url}
        alt=""
        className="h-full w-full object-cover"
        // data URIs geralmente já chegam "complete" antes do React anexar o
        // onLoad (não passam por rede) - o ref callback cobre esse caso e o
        // onLoad cobre o caso raro de ainda estar carregando.
        ref={(el) => {
          if (el) measure(el);
        }}
        onLoad={(e) => measure(e.currentTarget)}
      />
      <button
        type="button"
        onClick={() => onRemove(foto.id)}
        disabled={pending}
        aria-label="Remover foto"
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-base font-bold text-white shadow-sm disabled:opacity-50"
      >
        {removingId === foto.id ? "…" : "×"}
      </button>
      {meta && (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-center text-[9.5px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          {meta.width}×{meta.height}px · ~{meta.sizeKb}KB
        </span>
      )}
    </div>
  );
}
