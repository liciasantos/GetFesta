import Link from "next/link";

export default function AceiteTermosCheckbox() {
  return (
    <label className="flex items-start gap-2 text-[11.5px] text-muted">
      <input type="checkbox" name="aceitouTermos" required className="mt-0.5" />
      <span>
        Li e concordo com a{" "}
        <Link href="/privacidade" target="_blank" className="font-bold text-accent-dark underline">
          Política de Privacidade
        </Link>{" "}
        e os{" "}
        <Link href="/termos" target="_blank" className="font-bold text-accent-dark underline">
          Termos de Uso
        </Link>
        .
      </span>
    </label>
  );
}
