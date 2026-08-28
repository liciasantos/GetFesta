"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarConfiguracaoSite } from "@/lib/actions/admin";
import { resizeImageToDataUrlWide } from "@/lib/image-client";

export default function AparenciaImageForm({
  chave,
  label,
  descricao,
  atual,
}: {
  chave: string;
  label: string;
  descricao: string;
  atual: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(atual);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    try {
      const resized = await resizeImageToDataUrlWide(file);
      setPreview(resized.dataUrl);
      startTransition(async () => {
        const res = await salvarConfiguracaoSite(chave, resized.dataUrl);
        if (res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
      });
    } catch {
      setError("Não foi possível processar essa imagem.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-[14px] font-bold">{label}</h2>
      <p className="mt-1 text-[12.5px] text-muted">{descricao}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`relative mt-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border bg-surface-alt ${
          dragOver ? "border-2 border-accent" : "border-border"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-full w-full object-cover" />
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] font-bold text-white">
            Salvando...
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="mt-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
      >
        Trocar imagem
      </button>
      <p className="mt-1 text-[10.5px] text-muted-2">ou arraste a imagem aqui — recomendado ~1600×600px, landscape</p>
      {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
