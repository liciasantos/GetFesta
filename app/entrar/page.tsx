import Link from "next/link";
import LoginForm from "./LoginForm";
import GoogleAuthButton from "@/components/GoogleAuthButton";

const TIPOS = [
  {
    value: "cliente",
    label: "Cliente",
    resumo: "Você contrata para a sua festa: publica o que precisa e conversa direto com os fornecedores interessados.",
    cadastro: "/cadastro/cliente",
    cadastroLabel: "Criar conta de cliente",
  },
  {
    value: "empresa",
    label: "Empresa",
    resumo:
      "Você presta o serviço (buffet, decoração, salão, fotografia...). Gerencie seu perfil e receba pedidos de clientes da sua região.",
    cadastro: "/cadastro/empresa",
    cadastroLabel: "Cadastrar minha empresa",
  },
  {
    value: "profissional",
    label: "Profissional",
    resumo:
      "Você é o freela contratado pela empresa (ator, animador, garçom...). Monte seu catálogo para empresas te encontrarem.",
    cadastro: "/cadastro/profissional",
    cadastroLabel: "Criar meu catálogo profissional",
  },
] as const;

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; googleErro?: string; emailConfirmado?: string; emailErro?: string }>;
}) {
  const sp = await searchParams;
  const tipoAtual = TIPOS.find((t) => t.value === sp.tipo) ?? TIPOS[0];

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Entrar na GetFesta</h1>
      <p className="mt-1 text-center text-[12.5px] text-muted">Área de acesso — selecione quem você é</p>

      {sp.googleErro && (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-2.5 text-center text-[12px] text-danger-dark">
          Não deu pra continuar com o Google agora. Tente de novo ou entre com e-mail e senha.
        </p>
      )}
      {sp.emailConfirmado && (
        <p className="mt-4 rounded-lg border border-ok/30 bg-ok-soft p-2.5 text-center text-[12px] text-ok">
          E-mail confirmado com sucesso! Pode entrar normalmente.
        </p>
      )}
      {sp.emailErro && (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-2.5 text-center text-[12px] text-danger-dark">
          Esse link de confirmação é inválido ou expirou.
        </p>
      )}

      <div className="mt-5 flex rounded-lg border border-border bg-surface-alt p-1">
        {TIPOS.map((t) => (
          <Link
            key={t.value}
            href={`/entrar?tipo=${t.value}`}
            className={`flex-1 rounded-md py-2 text-center text-[12.5px] font-bold transition-colors ${
              tipoAtual.value === t.value ? "bg-surface text-accent-dark shadow-sm" : "text-muted hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">{tipoAtual.resumo}</p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <LoginForm />

        {(tipoAtual.value === "cliente" || tipoAtual.value === "profissional") && (
          <GoogleAuthButton tipo={tipoAtual.value} label="Continuar com Google" />
        )}
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        Ainda não tem conta?{" "}
        <Link href={tipoAtual.cadastro} className="font-bold text-accent-dark underline">
          {tipoAtual.cadastroLabel}
        </Link>
        .
      </p>
    </div>
  );
}
