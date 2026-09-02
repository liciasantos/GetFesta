"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarPortfolioPdfProfissional, removerPortfolioPdfProfissional } from "@/lib/actions/perfil";
import { fileToDataUrl } from "@/lib/pdf-client";
import { buttonClass } from "@/components/ui";

export default function PortfolioPdfUpload({ nomeAtual, elegivel }: { nomeAtual: string | null; elegivel: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(nomeAtual);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Escolha um arquivo PDF.");
      return;
    }
    try {
      const { dataUrl, nome: nomeArquivo } = await fileToDataUrl(file);
      startTransition(async () => {
        const res = await atualizarPortfolioPdfProfissional(dataUrl, nomeArquivo);
        if (res.error) {
          setError(res.error);
          return;
        }
        setNome(nomeArquivo);
        router.refresh();
      });
    } catch {
      setError("Não foi possível processar esse arquivo.");
    }
  }

  function remover() {
    setError(null);
    startTransition(async () => {
      const res = await removerPortfolioPdfProfissional();
      if (res.error) {
        setError(res.error);
        return;
      }
      setNome(null);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-[12.5px]">{nome ? `📄 ${nome}` : "Nenhum arquivo enviado ainda."}</p>
      {!elegivel && (
        <p className="mt-1 text-[11.5px] font-semibold text-accent-dark">
          🔒 O portfólio em PDF exige o plano Light ou Premium (grátis por 1 ano pros 20 primeiros profissionais
          cadastrados). Fale com a gente pra contratar.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending || !elegivel}
          className={buttonClass("secondary", "sm")}
        >
          {isPending ? "Enviando..." : nome ? "Trocar PDF" : "Enviar PDF"}
        </button>
        {nome && (
          <button
            type="button"
            onClick={remover}
            disabled={isPending}
            className="rounded-md border border-border-strong px-2.5 py-1 text-[11.5px] font-bold text-danger-dark hover:bg-danger-soft disabled:opacity-50"
          >
            Remover
          </button>
        )}
      </div>
      <p className="mt-1 text-[10.5px] text-muted-2">PDF de até ~4,5 MB. Empresas autenticadas podem visualizar.</p>
      {error && <p className="mt-1.5 text-[11.5px] font-semibold text-accent-dark">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
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
