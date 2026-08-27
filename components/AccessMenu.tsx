"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui";

const SEGMENTOS = [
  {
    tipo: "cliente",
    label: "Cliente",
    desc: "Publique pedidos e converse com fornecedores",
    entrar: "/entrar?tipo=cliente",
    cadastrar: "/cadastro/cliente",
    cadastrarLabel: "Criar conta",
  },
  {
    tipo: "empresa",
    label: "Empresa",
    desc: "Gerencie seu perfil e receba pedidos de clientes",
    entrar: "/entrar?tipo=empresa",
    cadastrar: "/cadastro/empresa",
    cadastrarLabel: "Cadastrar empresa",
  },
  {
    tipo: "profissional",
    label: "Profissional",
    desc: "Monte seu catálogo pra empresas te encontrarem",
    entrar: "/entrar?tipo=profissional",
    cadastrar: "/cadastro/profissional",
    cadastrarLabel: "Criar catálogo",
  },
] as const;

function SegmentosList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      {SEGMENTOS.map((s) => (
        <div key={s.tipo} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-alt">
          <div>
            <div className="text-[12.5px] font-bold">{s.label}</div>
            <div className="text-[11px] text-muted">{s.desc}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Link href={s.entrar} onClick={onNavigate} className="text-[11.5px] font-bold text-accent-dark hover:underline">
              Entrar
            </Link>
            <Link href={s.cadastrar} onClick={onNavigate} className="text-[10.5px] font-semibold text-muted hover:underline">
              {s.cadastrarLabel}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Área de acesso segmentada por tipo de usuário (cliente/empresa/profissional),
 * inspirada em portais que separam claramente "quem é você" antes do login
 * (ex.: bancos com area PF/PJ). `inline` renderiza a lista direto, sem o
 * dropdown próprio — usado dentro do menu mobile, que já tem seu toggle. */
export default function AccessMenu({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (inline) {
    return (
      <div>
        <p className="px-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-2">
          Área de acesso — quem é você?
        </p>
        <SegmentosList />
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={buttonClass("secondary", "sm")}
      >
        Entrar / Cadastrar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-border bg-surface p-2 shadow-card-hover">
          <p className="px-2 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-wide text-muted-2">
            Área de acesso — quem é você?
          </p>
          <SegmentosList onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
