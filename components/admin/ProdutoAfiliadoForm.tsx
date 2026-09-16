"use client";

import { useActionState } from "react";
import {
  atualizarProdutoAfiliado,
  criarProdutoAfiliado,
  type ProdutoAfiliadoActionState,
} from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import { CATEGORIAS_PRODUTOS, FAIXAS_ETARIAS_PRODUTOS } from "@/lib/produtos-afiliados-constantes";
import type { ProdutoAfiliadoAdmin } from "@/lib/data/admin";

export default function ProdutoAfiliadoForm({
  mode,
  produto,
}: {
  mode: "criar" | "editar";
  produto?: ProdutoAfiliadoAdmin;
}) {
  const action = mode === "criar" ? criarProdutoAfiliado : atualizarProdutoAfiliado;
  const [state, formAction, pending] = useActionState<ProdutoAfiliadoActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {mode === "editar" && produto && <input type="hidden" name="id" value={produto.id} />}

      <Field label="Nome do produto">
        <input
          name="nome"
          required
          defaultValue={produto?.nome}
          placeholder="Ex: Fantasia Homem-Aranha Infantil"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <Field label="URL da imagem (opcional)">
        <input
          name="imagemUrl"
          type="url"
          defaultValue={produto?.imagem_url ?? ""}
          placeholder="Cole a URL da foto do anúncio no Mercado Livre"
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço (R$)">
          <input
            name="preco"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={produto?.preco}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Categoria">
          <select
            name="categoria"
            required
            defaultValue={produto?.categoria ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          >
            <option value="" disabled>
              Selecione
            </option>
            {CATEGORIAS_PRODUTOS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tema (opcional)">
          <input
            name="tema"
            defaultValue={produto?.tema ?? ""}
            placeholder="Ex: Sonic, Frozen, Halloween..."
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          />
        </Field>
        <Field label="Faixa etária">
          <select
            name="faixaEtaria"
            defaultValue={produto?.faixa_etaria ?? ""}
            className="rounded-md border border-border px-3 py-2.5 text-sm"
          >
            <option value="">Não informado</option>
            {FAIXAS_ETARIAS_PRODUTOS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Link do anúncio no Mercado Livre">
        <input
          name="urlProduto"
          type="url"
          required
          defaultValue={produto?.url_produto}
          placeholder="https://produto.mercadolivre.com.br/..."
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <Field label="Link de afiliado (opcional — preencha quando a conta for aprovada)">
        <input
          name="urlAfiliado"
          type="url"
          defaultValue={produto?.url_afiliado ?? ""}
          placeholder="https://mercadolivre.com/sec/..."
          className="rounded-md border border-border px-3 py-2.5 text-sm"
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold">
          <input type="checkbox" name="destaque" defaultChecked={produto?.destaque ?? false} className="h-4 w-4" />
          Mostrar em &quot;Mais procurados&quot;
        </label>
        {mode === "editar" && (
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true} className="h-4 w-4" />
            Ativo (visível na vitrine)
          </label>
        )}
      </div>

      {state?.error && <p className="text-[12.5px] font-semibold text-accent-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Salvando..." : mode === "criar" ? "Cadastrar produto" : "Salvar alterações"}
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
