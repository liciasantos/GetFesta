"use client";

import { useState } from "react";

/** input type="date" nativo exibe o formato de acordo com o idioma do
 * SISTEMA OPERACIONAL/navegador de quem acessa, não com o lang="pt-BR" da
 * página - então em máquinas com Windows/Chrome em inglês aparece
 * mm/dd/aaaa mesmo no site em português, o que confunde. Esse componente
 * escreve/lê sempre em dd/mm/aaaa, independente da configuração de quem
 * está usando, e por baixo manda um input hidden em formato ISO
 * (aaaa-mm-dd) - que é o que o banco/zod esperam. */
export default function DateInputBR({
  name,
  required,
  defaultValue,
  className = "",
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(() => isoParaBR(defaultValue));

  const digitos = texto.replace(/\D/g, "");
  const iso = digitos.length === 8 ? brParaIso(texto) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitosDigitados = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTexto(mascarar(digitosDigitados));
  }

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={texto}
        onChange={handleChange}
        required={required}
        pattern="\d{2}/\d{2}/\d{4}"
        maxLength={10}
        className={className}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}

function mascarar(digitos: string): string {
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const ano = digitos.slice(4, 8);
  let texto = dia;
  if (mes) texto += `/${mes}`;
  if (ano) texto += `/${ano}`;
  return texto;
}

function brParaIso(textoBR: string): string {
  const [dia, mes, ano] = textoBR.split("/");
  return `${ano}-${mes}-${dia}`;
}

function isoParaBR(iso: string | undefined): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return "";
  return `${dia}/${mes}/${ano}`;
}
