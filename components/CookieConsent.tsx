"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "getfesta_cookie_consent";

type Preferencias = { necessarios: true; analiticos: boolean; marketing: boolean };

function lerPreferenciasSalvas(): Preferencias | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function salvarPreferencias(prefs: Preferencias) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // navegação anônima/armazenamento bloqueado: só não lembra a escolha
  }
}

/** Aviso de cookies em cartão no rodapé, sem escurecer nem bloquear a página
 * (antes era uma janela no meio da tela, cobrindo o conteúdo). "Recusar" e
 * "Aceitar todos" têm o mesmo peso visual, como pede a LGPD.
 * No celular, quando existe a barra de ícones fixa de quem está logado
 * (empresa/profissional - marcada com data-barra-inferior), o cartão sobe e
 * fica acima dela - foi esse conflito que tinha motivado a janela central. */
export default function CookieConsent() {
  const [visivel, setVisivel] = useState(false);
  const [personalizando, setPersonalizando] = useState(false);
  const [analiticos, setAnaliticos] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [temBarraInferior, setTemBarraInferior] = useState(false);

  useEffect(() => {
    if (lerPreferenciasSalvas()) return;
    // pequeno atraso: o cartão entra depois que a página já apareceu, em vez
    // de "pular" junto com o carregamento
    const t = window.setTimeout(() => {
      setTemBarraInferior(!!document.querySelector("[data-barra-inferior]"));
      setVisivel(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, []);

  function fechar(prefs: Preferencias) {
    salvarPreferencias(prefs);
    setVisivel(false);
  }

  if (!visivel) return null;

  const posicaoMobile = temBarraInferior
    ? "bottom-[calc(env(safe-area-inset-bottom)+80px)]"
    : "bottom-[calc(env(safe-area-inset-bottom)+12px)]";

  return (
    <section
      aria-label="Preferências de cookies"
      className={`fixed inset-x-3 z-[60] rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card-hover)] motion-safe:animate-[subir_220ms_ease-out] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[380px] ${posicaoMobile}`}
    >
      <p className="text-[13.5px] font-bold">Usamos cookies</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Os necessários mantêm o site funcionando. Analíticos e de marketing, só com a sua autorização.{" "}
        <Link href="/privacidade" className="font-semibold text-accent-dark underline">
          Saiba mais
        </Link>
      </p>

      {personalizando && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[12.5px] font-bold">Necessários</span>
              <span className="block text-[11.5px] text-muted">Sempre ativos</span>
            </span>
            <input type="checkbox" checked disabled className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[12.5px] font-bold">Analíticos</span>
              <span className="block text-[11.5px] text-muted">Entender como o site é usado</span>
            </span>
            <input type="checkbox" checked={analiticos} onChange={(e) => setAnaliticos(e.target.checked)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[12.5px] font-bold">Marketing</span>
              <span className="block text-[11.5px] text-muted">Anúncios mais relevantes</span>
            </span>
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {personalizando ? (
          <button
            type="button"
            onClick={() => fechar({ necessarios: true, analiticos, marketing })}
            className="col-span-2 rounded-lg bg-accent-strong px-3 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
          >
            Salvar minhas escolhas
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fechar({ necessarios: true, analiticos: false, marketing: false })}
              className="rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[13px] font-bold text-text hover:bg-surface-alt"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => fechar({ necessarios: true, analiticos: true, marketing: true })}
              className="rounded-lg border border-accent-strong bg-accent-strong px-3 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
            >
              Aceitar todos
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setPersonalizando((v) => !v)}
        className="mt-2 w-full text-center text-[12px] font-semibold text-muted underline hover:text-text"
      >
        {personalizando ? "Voltar" : "Personalizar"}
      </button>
    </section>
  );
}
