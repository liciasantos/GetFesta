"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removerAdmin } from "@/lib/actions/admin";

export default function AdminRowActions({ adminId, email, souEu }: { adminId: string; email: string | null; souEu: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (souEu) {
    return <span className="text-[11.5px] font-semibold text-muted-2">Sua conta atual</span>;
  }

  function remover() {
    if (!window.confirm(`Remover o acesso de "${email}"? Ele não vai mais conseguir entrar no painel administrativo.`)) return;
    startTransition(async () => {
      const res = await removerAdmin(adminId);
      if (res?.error) window.alert(res.error);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={remover}
      className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
    >
      Remover admin
    </button>
  );
}
