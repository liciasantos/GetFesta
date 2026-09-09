import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilCliente } from "@/lib/data/clientes";
import { getMeuPerfilProfissional } from "@/lib/data/profissionais";
import CompletarCpfForm from "@/components/CompletarCpfForm";

export const dynamic = "force-dynamic";

/** Gate obrigatório logo após o cadastro via Google (cliente/profissional) -
 * essas contas não passam pelo formulário normal e por isso nunca informam
 * CPF (ver app/api/auth/google/callback/route.ts). Quem já tem CPF cadastrado
 * (inclusive contas antigas revisitando essa URL por acaso) é mandado direto
 * pro destino normal - esse gate só trava quem realmente ainda não informou. */
export default async function CompletarCadastroCpfPage() {
  const session = await getSession();
  if (!session || (session.tipo !== "cliente" && session.tipo !== "profissional")) redirect("/entrar");

  const destino = session.tipo === "cliente" ? "/meus-pedidos" : "/perfil-profissional";
  const perfil =
    session.tipo === "cliente"
      ? await getMeuPerfilCliente(session.usuarioId)
      : await getMeuPerfilProfissional(session.usuarioId);
  if (!perfil) redirect("/entrar");
  if (perfil.cpf) redirect(destino);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-extrabold">Só mais um passo</h1>
      <p className="mt-1 text-sm text-muted">
        Pra manter a GetFesta livre de perfis falsos, pedimos o CPF de quem se cadastra pelo Google. Ele não aparece
        pra ninguém — fica só na sua conta.
      </p>
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <CompletarCpfForm />
      </div>
    </div>
  );
}
