"use client";

import { useActionState } from "react";
import { criarBannerHero, type BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import ImageFieldUpload from "@/components/ImageFieldUpload";

export default function NovoBannerHeroForm() {
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(criarBannerHero, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Título">
        <input name="titulo" required maxLength={160} className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      <Field label="Texto (opcional)">
        <textarea name="texto" maxLength={300} rows={2} className="rounded-md border border-border px-3 py-2.5 text-sm" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Texto do botão (opcional)">
          <input name="botaoLabel" maxLength={60} placeholder="Ex: Saiba mais" className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
        <Field label="Link do botão (opcional)">
          <input name="botaoUrl" maxLength={500} placeholder="/busca" className="rounded-md border border-border px-3 py-2.5 text-sm" />
        </Field>
      </div>

      <ImageFieldUpload name="imagemFundo" label="Imagem de fundo" />

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : "Criar banner"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold uppercase text-muted-2">{label}</label>
      {children}
    </div>
  );
}
