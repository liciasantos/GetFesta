import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getEmpresaById, getAvaliacaoGoogle } from "@/lib/data/empresas";
import AvatarUpload from "@/components/AvatarUpload";
import GaleriaManager from "@/components/GaleriaManager";
import AlterarSenhaForm from "@/components/AlterarSenhaForm";
import { atualizarLogoEmpresa, adicionarFotoGaleria, removerFotoGaleria } from "@/lib/actions/perfil";
import PerfilEmpresaForm from "./PerfilEmpresaForm";
import AvaliacaoGoogleForm from "./AvaliacaoGoogleForm";

export const dynamic = "force-dynamic";

export default async function PainelPerfilPage() {
  const session = await getSession();
  if (!session || session.tipo !== "empresa") redirect("/entrar");

  const [empresa, avaliacaoGoogle] = await Promise.all([
    getEmpresaById(session.usuarioId),
    getAvaliacaoGoogle(session.usuarioId),
  ]);
  if (!empresa) redirect("/entrar");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Editar perfil da empresa</h1>
        <Link href="/painel" className="text-[12.5px] font-bold text-accent-dark underline">
          ← Voltar ao painel
        </Link>
      </div>
      <p className="text-sm text-muted">
        Essas informações aparecem na sua página pública ({empresa.nome_fantasia}) e ajudam o cliente a decidir.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Logo</h2>
        <AvatarUpload initialUrl={empresa.logo_url} name={empresa.nome_fantasia} action={atualizarLogoEmpresa} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Galeria de fotos</h2>
        <GaleriaManager fotos={empresa.galeria} onAdd={adicionarFotoGaleria} onRemove={removerFotoGaleria} />
        <p className="mt-3 rounded-lg border border-note-border bg-note-bg p-3 text-[11.5px] leading-relaxed text-note-text">
          ⚠️ <b>Atenção com fotos de crianças e adolescentes:</b> se a foto mostrar o rosto de uma criança ou
          adolescente, a lei (LGPD, art. 14) exige autorização específica dos pais ou responsáveis pra publicar essa
          imagem. Sem essa autorização, borre ou corte o rosto antes de subir a foto. Ao publicar, você declara ser
          o responsável por essa autorização e assume as consequências pelo uso indevido da imagem.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Dados do perfil</h2>
        <PerfilEmpresaForm empresa={empresa} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Nota do Google Meu Negócio</h2>
        <AvaliacaoGoogleForm avaliacao={avaliacaoGoogle} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Alterar senha</h2>
        <AlterarSenhaForm />
      </div>
    </div>
  );
}
