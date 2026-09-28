import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPerfilPermuta, getPermutaConfig, getPlanosEmpresaPorTipo, getUsoPlanoPermuta } from "@/lib/data/permuta";
import Apresentacao from "@/components/permuta/Apresentacao";

export const dynamic = "force-dynamic";

export default async function ComoFuncionaPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar?tipo=empresa");
  const cfg = await getPermutaConfig();
  const [perfil, uso, planos] = await Promise.all([
    getPerfilPermuta(session.usuarioId, cfg),
    getUsoPlanoPermuta(session.usuarioId, cfg),
    getPlanosEmpresaPorTipo(),
  ]);
  if (!perfil) redirect("/painel");
  return <Apresentacao cfg={cfg} perfil={perfil} uso={uso} planos={planos} mostrarAdesao={!perfil.participa} />;
}
