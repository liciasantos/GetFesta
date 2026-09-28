"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validarMeuCnpj } from "@/lib/actions/cnpj";
import { buttonClass } from "@/components/ui";

/** Status do CNPJ em Perfil da empresa, com o botão de consultar a Receita. */
export default function ValidarCnpjCard({
  cnpj,
  validado,
  validadoEm,
}: {
  cnpj: string;
  validado: boolean;
  validadoEm: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px]">
          <div>
            CNPJ: <b>{cnpj}</b>
          </div>
          <div className="mt-0.5">
            {validado ? (
              <span className="font-bold text-ok">
                ✓ Validado{validadoEm ? ` em ${new Date(validadoEm).toLocaleDateString("pt-BR")}` : ""}
              </span>
            ) : (
              <span className="font-bold text-note-text">Ainda não validado</span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await validarMeuCnpj();
              setMsg(r.ok ? { ok: true, texto: r.mensagem ?? "CNPJ validado." } : { ok: false, texto: r.error ?? "Não foi possível validar." });
              router.refresh();
            })
          }
          className={buttonClass(validado ? "secondary" : "primary", "sm")}
        >
          {pending ? "Consultando a Receita..." : validado ? "Consultar de novo" : "Validar meu CNPJ"}
        </button>
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        Consultamos a situação do CNPJ na Receita Federal. CNPJ com situação ATIVA fica validado — é um dos requisitos
        para participar da rede de permutas. Se o número estiver errado, fale com a equipe GetFesta.
      </p>
      {msg && (
        <p className={`rounded-md px-3 py-2 text-[12.5px] font-semibold ${msg.ok ? "bg-ok-soft text-ok" : "bg-note-bg text-note-text"}`}>
          {msg.texto}
        </p>
      )}
    </div>
  );
}
