"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UploadResult } from "@/lib/actions/perfil";
import { resizeImageToDataUrl } from "@/lib/image-client";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export type AvatarUploadHandle = { openPicker: () => void };

const AvatarUpload = forwardRef<
  AvatarUploadHandle,
  {
    initialUrl: string | null;
    name: string;
    action: (dataUrl: string) => Promise<UploadResult>;
    size?: number;
    /** "compact" mostra só o círculo da foto (sem botão/legenda ao lado) -
     * usado no herói mobile do catálogo do profissional, onde o "Trocar
     * foto" vira um dos botões da fileira abaixo do nome em vez de ficar
     * colado no avatar. */
    variant?: "default" | "compact";
  }
>(function AvatarUpload({ initialUrl, name, action, size = 96, variant = "default" }, ref) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [meta, setMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  useImperativeHandle(ref, () => ({ openPicker: () => inputRef.current?.click() }));

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    try {
      const resized = await resizeImageToDataUrl(file);
      setPreview(resized.dataUrl);
      setMeta({ width: resized.width, height: resized.height, sizeKb: resized.sizeKb });
      startTransition(async () => {
        const res = await action(resized.dataUrl);
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

  // no herói mobile (compact) o contorno vira um anel branco grosso, pra
  // "flutuar" sobre a divisa escuro/claro do cartão; no uso normal continua
  // uma borda fina de 1px, sutil.
  const contornoClass =
    variant === "compact"
      ? `ring-4 ${dragOver ? "ring-accent" : "ring-surface"}`
      : `border ${dragOver ? "border-2 border-accent" : "border-border"}`;

  const avatarCircle = (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
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
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={name}
          className={`h-full w-full rounded-full object-cover ${contornoClass}`}
          style={{ width: size, height: size }}
          // data URIs chegam "complete" antes do onLoad conseguir ser anexado -
          // o ref callback cobre esse caso comum, onLoad cobre o resto.
          ref={(el) => {
            if (el && el.naturalWidth && !meta) {
              setMeta({ width: el.naturalWidth, height: el.naturalHeight, sizeKb: Math.round((preview.length * 0.75) / 1024) });
            }
          }}
          onLoad={(e) => {
            if (meta) return;
            const el = e.currentTarget;
            setMeta({ width: el.naturalWidth, height: el.naturalHeight, sizeKb: Math.round((preview.length * 0.75) / 1024) });
          }}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-accent-soft font-display text-xl font-extrabold text-accent-dark ${contornoClass}`}
          style={{ width: size, height: size }}
        >
          {initialsOf(name) || "?"}
        </div>
      )}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
          ...
        </div>
      )}
    </div>
  );

  const fileInput = (
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
  );

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center">
        {avatarCircle}
        {fileInput}
        {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {avatarCircle}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] font-bold hover:bg-surface-alt disabled:opacity-50"
        >
          {preview ? "Trocar foto" : "Adicionar foto"}
        </button>
        <p className="mt-1 text-[10.5px] text-muted-2">ou arraste a imagem aqui</p>
        {meta && (
          <p className="mt-1 text-[10.5px] text-muted-2">
            {meta.width}×{meta.height}px · ~{meta.sizeKb} KB
          </p>
        )}
        {fileInput}
        {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
      </div>
    </div>
  );
});

export default AvatarUpload;
