"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "getfesta_regiao";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

/** Salva o estado escolhido no filtro de região da barra utilitária (ver
 * components/RegionPicker.tsx) - não é sessão, só uma preferência de
 * navegação, por isso sem httpOnly (lido só server-side em app/busca e
 * app/page.tsx, mas não guarda nada sensível). `null` limpa o filtro
 * ("Todas as regiões"). */
export async function definirRegiaoAction(estado: string | null): Promise<void> {
  const store = await cookies();
  if (estado) {
    store.set(COOKIE_NAME, estado, { maxAge: MAX_AGE_SECONDS, path: "/", sameSite: "lax" });
  } else {
    store.delete(COOKIE_NAME);
  }
}

export async function getRegiaoAtual(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}
