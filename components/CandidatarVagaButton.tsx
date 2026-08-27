"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { candidatarVaga } from "@/lib/actions/vagas";
import { buttonClass } from "@/components/ui";

export default function CandidatarVagaButton({ vagaId }: { vagaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={isPending}
        className={buttonClass("primary", "sm")}
        onClick={() =>
          startTransition(async () => {
            const res = await candidatarVaga(vagaId);
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {isPending ? "Enviando..." : "Tenho interesse"}
      </button>
      {error && <p className="mt-1 text-[11px] font-semibold text-accent-dark">{error}</p>}
    </div>
  );
}
