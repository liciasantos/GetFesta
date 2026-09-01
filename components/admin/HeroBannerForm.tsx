"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { atualizarBannerHero, criarBannerHero, type BannerActionState } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import ImageFieldUpload from "@/components/ImageFieldUpload";
import type { EmpresaOption, HeroBannerAdmin } from "@/lib/data/admin";

export default function HeroBannerForm({
  mode,
  banner,
  empresas,
}: {
  mode: "criar" | "editar";
  banner?: HeroBannerAdmin;
  empresas: EmpresaOption[];
}) {
  const action = mode === "criar" ? criarBannerHero : atualizarBannerHero;
  const [state, formAction, pending] = useActionState<BannerActionState, FormData>(action, undefined);
  const tituloRef = useRef<HTMLInputElement>(null);
  const botaoLabelRef = useRef<HTMLInputElement>(null);
  const botaoUrlRef = useRef<HTMLInputElement>(null);

  function aplicarEmpresa(empresaId: string) {
    const empresa = empresas.find((e) => e.usuario_id === empresaId);
    if (!empresa) return;
    if (tituloRef.current && !tituloRef.current.value) tituloRef.current.value = empresa.nome_fantasia;
    if (botaoLabelRef.current && !botaoLabelRef.current.value) botaoLabelRef.current.value = "Ver perfil";
    if (botaoUrlRef.current) botaoUrlRef.current.value = `/empresa/${empresa.slug}`;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {mode === "editar" && banner && <input type="hidden" name="id" value={banner.id} />}

      {mode === "criar" && (
        <Field label="Reaproveitar dados de uma empresa (opcional)">
          <select
            defaultValue=""
            onChange={(e) => aplicarEmpresa(e.target.value)}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          >
            <option value="">Nenhuma — texto livre</option>
            {empresas.map((e) => (
              <option key={e.usuario_id} value={e.usuario_id}>
                {e.nome_fantasia}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10.5px] text-muted-2">
            Preenche título e link do botão automaticamente — tudo continua editável antes de salvar.
          </p>
        </Field>
      )}

      <Field label="Título">
        <input
          ref={tituloRef}
          name="titulo"
          required
          maxLength={160}
          defaultValue={banner?.titulo}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <Field label="Texto (opcional)">
        <textarea
          name="texto"
          maxLength={300}
          rows={2}
          defaultValue={banner?.texto ?? ""}
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Texto do botão (opcional)">
          <input
            ref={botaoLabelRef}
            name="botaoLabel"
            maxLength={60}
            placeholder="Ex: Saiba mais"
            defaultValue={banner?.botao_label ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Link do botão (opcional)">
          <input
            ref={botaoUrlRef}
            name="botaoUrl"
            maxLength={500}
            placeholder="/busca"
            defaultValue={banner?.botao_url ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
      </div>

      <ImageFieldUpload name="imagemFundo" label="Imagem de fundo (desktop)" initialUrl={banner?.imagem_fundo} />
      <ImageFieldUpload
        name="imagemFundoMobile"
        label="Imagem de fundo (mobile) — opcional, senão reusa a de desktop"
        initialUrl={banner?.imagem_fundo_mobile}
        targetWidth={1080}
        targetHeight={1350}
        hint="ou arraste a imagem aqui — recomendado ~1080×1350px, retrato (mais alto que largo, formato de celular)"
      />

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : mode === "criar" ? "Criar banner" : "Salvar alterações"}
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
