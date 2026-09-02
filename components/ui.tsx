import { type ReactNode } from "react";

export function Badge({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "ad" | "warn" | "danger" | "muted" }) {
  const tones: Record<string, string> = {
    ok: "bg-ok-soft text-ok",
    ad: "bg-gold-soft text-[#8a6300]",
    warn: "bg-note-bg text-note-text border border-note-border",
    danger: "bg-danger-soft text-danger-dark",
    muted: "bg-surface-alt text-muted border border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        active ? "border-accent-soft-2 bg-accent-soft text-accent-dark" : "border-border bg-surface-alt text-text"
      }`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>{children}</div>;
}

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export function buttonClass(variant: "primary" | "secondary" | "ghost" = "primary", size: "md" | "sm" | "lg" = "md") {
  const variants: Record<string, string> = {
    primary: "bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-md",
    secondary: "bg-surface text-text border border-border-strong hover:bg-surface-alt",
    ghost: "bg-transparent text-accent-dark border border-accent-soft-2 hover:bg-accent-soft",
  };
  const sizes: Record<string, string> = {
    lg: "px-6 py-3.5 text-[15px]",
    md: "px-4 py-2.5",
    sm: "px-3 py-1.5 text-[13px]",
  };
  return `${buttonBase} ${variants[variant]} ${sizes[size]}`;
}

export function PlaceholderImg({ className = "" }: { className?: string }) {
  return <div className={`placeholder-img flex items-center justify-center text-[11px] font-semibold text-muted-2 ${className}`} />;
}
