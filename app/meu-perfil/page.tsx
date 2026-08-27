import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMeuPerfilCliente } from "@/lib/data/clientes";
import { listCidades } from "@/lib/data/geo";
import AvatarUpload from "@/components/AvatarUpload";
import { atualizarFotoCliente } from "@/lib/actions/perfil";
import PerfilClienteForm from "./PerfilClienteForm";

export const dynamic = "force-dynamic";

export default async function MeuPerfilPage() {
  const session = await getSession();
  if (!session || session.tipo !== "cliente") redirect("/entrar");

  const [perfil, cidades] = await Promise.all([getMeuPerfilCliente(session.usuarioId), listCidades()]);
  if (!perfil) redirect("/entrar");

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-xl font-extrabold">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted">{perfil.email}</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <AvatarUpload initialUrl={perfil.foto_url} name={perfil.nome} action={atualizarFotoCliente} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <PerfilClienteForm perfil={perfil} cidades={cidades} />
      </div>
    </div>
  );
}
