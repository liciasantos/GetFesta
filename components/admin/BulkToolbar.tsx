"use client";

/** Barra fixa que aparece quando pelo menos 1 item está selecionado numa
 * lista de admin com checkbox por linha (profissionais, pedidos). */
export default function BulkToolbar({
  total,
  onLimpar,
  onRemover,
  isPending,
}: {
  total: number;
  onLimpar: () => void;
  onRemover: () => void;
  isPending: boolean;
}) {
  if (total === 0) return null;

  return (
    <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-2.5">
      <span className="text-[12.5px] font-bold text-accent-dark">{total} selecionado(s)</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLimpar}
          disabled={isPending}
          className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px] font-bold hover:bg-surface-alt disabled:opacity-50"
        >
          Limpar seleção
        </button>
        <button
          type="button"
          onClick={onRemover}
          disabled={isPending}
          className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
        >
          {isPending ? "Removendo..." : "Remover selecionados"}
        </button>
      </div>
    </div>
  );
}
