import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getConfiguracoesSite,
  CONFIG_COMO_FUNCIONA_BG,
  CONFIG_BUSCA_BANNER_BG,
  CONFIG_CTA_FORNECEDOR_BG,
  CONFIG_CTA_FORNECEDOR_COR,
} from "@/lib/data/config";
import AparenciaImageForm from "@/components/admin/AparenciaImageForm";
import AparenciaColorForm from "@/components/admin/AparenciaColorForm";

export const dynamic = "force-dynamic";

export default async function AdminAparenciaPage() {
  const session = await getSession();
  if (!session || session.tipo !== "admin") redirect("/entrar");

  const config = await getConfiguracoesSite();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin" className="text-[12.5px] font-bold text-accent-dark underline">
        ← Painel administrativo
      </Link>
      <h1 className="mb-1 mt-3 text-xl font-extrabold">Aparência do site</h1>
      <p className="mb-6 text-sm text-muted">Imagens de fundo trocáveis sem precisar mexer no código.</p>

      <div className="flex flex-col gap-5">
        <AparenciaImageForm
          chave={CONFIG_COMO_FUNCIONA_BG}
          label='Home — seção "Como funciona"'
          descricao="Imagem de fundo full-bleed atrás dos 3 passos, na home."
          atual={config[CONFIG_COMO_FUNCIONA_BG]}
        />
        <AparenciaImageForm
          chave={CONFIG_BUSCA_BANNER_BG}
          label='Página "Buscar fornecedores" — banner'
          descricao="Foto sutil por cima da cor de fundo do banner (fica com opacidade baixa pra não brigar com o texto)."
          atual={config[CONFIG_BUSCA_BANNER_BG]}
        />
        <AparenciaImageForm
          chave={CONFIG_CTA_FORNECEDOR_BG}
          label='Home — seção "Você é fornecedor de festas?"'
          descricao="Imagem de fundo atrás do box de call-to-action, no fim da home."
          atual={config[CONFIG_CTA_FORNECEDOR_BG]}
        />
        <AparenciaColorForm
          chave={CONFIG_CTA_FORNECEDOR_COR}
          label='Home — cor da seção "Você é fornecedor de festas?"'
          descricao="Cor do overlay em cima da imagem de fundo dessa seção."
          atual={config[CONFIG_CTA_FORNECEDOR_COR]}
        />
      </div>
    </div>
  );
}
