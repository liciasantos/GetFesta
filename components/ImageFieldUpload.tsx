"use client";

import { useRef, useState } from "react";
import { resizeImageToDataUrlWide } from "@/lib/image-client";

/** Campo de imagem pra formularios multi-campo (useActionState) - ao contrario
 * do AvatarUpload (que salva sozinho ao trocar a foto), aqui o data URI só
 * fica num input hidden e vai junto no submit do formulario inteiro. */
export default function ImageFieldUpload({
  name,
  initialUrl,
  label = "Imagem de fundo",
  targetWidth = 1600,
  targetHeight = 600,
  hint = "ou arraste a imagem aqui — recomendado ~1600×600px, landscape",
}: {
  name: string;
  initialUrl?: string | null;
  label?: string;
  targetWidth?: number;
  targetHeight?: number;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    try {
      const resized = await resizeImageToDataUrlWide(file, targetWidth, targetHeight);
      setPreview(resized.dataUrl);
    } catch {
      setError("Não foi possível processar essa imagem.");
    }
  }

  return (
    <div>
      <label className="text-[12px] font-semibold text-muted">{label}</label>
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
        className={`mt-1 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border ${
          dragOver ? "border-2 border-accent" : "border-border"
        } bg-surface-alt`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] text-muted-2">Nenhuma imagem selecionada</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt"
      >
        {preview ? "Trocar imagem" : "Escolher imagem"}
      </button>
      <p className="mt-1 text-[10.5px] text-muted-2">{hint}</p>
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
      <input type="hidden" name={name} value={preview ?? ""} />
    </div>
  );
}
