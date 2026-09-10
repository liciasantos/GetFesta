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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function CookieConsent() {
  const [visivel, setVisivel] = useState(false);
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(false);
  const [analiticos, setAnaliticos] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!lerPreferenciasSalvas()) setVisivel(true);
  }, []);

  function aceitarTodos() {
    salvarPreferencias({ necessarios: true, analiticos: true, marketing: true });
    setVisivel(false);
    setPreferenciasAbertas(false);
  }

  function salvarPersonalizado() {
    salvarPreferencias({ necessarios: true, analiticos, marketing });
    setVisivel(false);
    setPreferenciasAbertas(false);
  }

  if (!visivel) return null;

  // Popup (não mais barra fixa no rodapé) - no mobile uma barra colada no
  // rodapé sempre acabava sobreposta pela navegação fixa de quem está
  // logado (empresa/profissional), escondendo os dois. Um popup evita esse
  // conflito de vez, além de já seguir o mesmo padrão visual do modal de
  // "Preferências de cookies" abaixo.
  if (!preferenciasAbertas) {
    // Um botão principal (cheio, óbvio de clicar) + um link secundário
    // sublinhado embaixo, os dois centralizados - evita a leitura de "dois
    // textos soltos lado a lado" que confundia sobre o que era clicável.
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
        <div className="w-full max-w-sm rounded-t-xl border border-border bg-surface p-5 text-center sm:rounded-xl">
          <p className="text-[13px] font-bold">🍪 Usamos cookies</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Cookies necessários mantêm o site funcionando; os demais só com sua autorização.{" "}
            <Link href="/privacidade" className="font-semibold text-accent-dark underline">
              Saiba mais
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={aceitarTodos}
              className="w-full rounded-lg bg-accent px-3 py-2.5 text-[13px] font-bold text-white hover:bg-accent-dark"
            >
              Aceitar todos
            </button>
            <button
              type="button"
              onClick={() => setPreferenciasAbertas(true)}
              className="text-[12px] font-bold text-accent-dark underline"
            >
              Preferências de cookies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-xl border border-border bg-surface p-5 sm:rounded-xl">
        <h2 className="text-[14px] font-bold">Preferências de cookies</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Escolha quais categorias de cookies você autoriza. Saiba mais na{" "}
              <Link href="/privacidade" className="font-semibold text-accent-dark underline">
                Política de Privacidade
              </Link>
              .
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-bold">Necessários</div>
                  <div className="text-[11px] text-muted">Essenciais pro site funcionar — sempre ativos.</div>
                </div>
                <input type="checkbox" checked disabled className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-bold">Analíticos</div>
                  <div className="text-[11px] text-muted">Nos ajudam a entender como o site é usado.</div>
                </div>
                <input
                  type="checkbox"
                  checked={analiticos}
                  onChange={(e) => setAnaliticos(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-bold">Marketing</div>
                  <div className="text-[11px] text-muted">Usados pra anúncios mais relevantes.</div>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={salvarPersonalizado}
                className="flex-1 rounded-lg border border-border-strong px-3 py-2 text-[12.5px] font-bold hover:bg-surface-alt"
              >
                Salvar preferências
              </button>
              <button
                type="button"
                onClick={aceitarTodos}
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-bold text-white hover:bg-accent-dark"
              >
                Aceitar todos
              </button>
            </div>
      </div>
    </div>
  );
}
