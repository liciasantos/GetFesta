"use client";

import { useState } from "react";

/** Input de senha com botão de olho pra mostrar/esconder o valor digitado -
 * usado nas 3 telas de login (cliente/empresa/profissional compartilham o
 * mesmo LoginForm) e em qualquer outro formulário de senha do site. */
export default function PasswordInput({
  name,
  required,
  className = "",
  autoComplete,
}: {
  name: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visivel ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        className={`w-full rounded-md border border-border px-3 py-2.5 pr-10 text-sm ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
      >
        {visivel ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
