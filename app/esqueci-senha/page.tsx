import Link from "next/link";
import EsqueciSenhaForm from "./EsqueciSenhaForm";

export default function EsqueciSenhaPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Esqueci minha senha</h1>
      <p className="mt-1 text-center text-[12.5px] text-muted">
        Informe o e-mail da sua conta pra receber um link de redefinição.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <EsqueciSenhaForm />
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        <Link href="/entrar" className="font-bold text-accent-dark underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
