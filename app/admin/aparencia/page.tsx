import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getConfiguracoesSite,
  CONFIG_COMO_FUNCIONA_BG,
  CONFIG_BUSCA_BANNER_BG,
  CONFIG_CTA_FORNECEDOR_BG,
  CONFIG_CTA_FORNECEDOR_COR,
  CONFIG_PROFISSIONAIS_HERO_BG,
  CONFIG_PROFISSIONAIS_HERO_IMAGEM,
  CONFIG_PROFISSIONAIS_HERO_TITULO,
  CONFIG_PROFISSIONAIS_HERO_SUBTITULO,
  CONFIG_EMPRESAS_HERO_BG,
  CONFIG_EMPRESAS_HERO_IMAGEM,
  CONFIG_EMPRESAS_HERO_TITULO,
  CONFIG_EMPRESAS_HERO_SUBTITULO,
} from "@/lib/data/config";
import AparenciaImageForm from "@/components/admin/AparenciaImageForm";
import AparenciaColorForm from "@/components/admin/AparenciaColorForm";
import TextConfigForm from "@/components/admin/TextConfigForm";

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

        <h2 className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-2">Página /profissionais — banner hero</h2>
        <AparenciaColorForm
          chave={CONFIG_PROFISSIONAIS_HERO_BG}
          label="Cor de fundo do banner"
          descricao="Cor sólida atrás do banner hero da página /profissionais."
          atual={config[CONFIG_PROFISSIONAIS_HERO_BG]}
        />
        <AparenciaImageForm
          chave={CONFIG_PROFISSIONAIS_HERO_IMAGEM}
          label="Foto do banner (opcional)"
          descricao="Foto por cima da cor de fundo, com um degradê escuro pra não brigar com o texto. Sem foto, fica só a cor sólida."
          atual={config[CONFIG_PROFISSIONAIS_HERO_IMAGEM]}
          opcional
        />
        <TextConfigForm
          titulo="Textos do banner"
          descricao="Título e subtítulo do banner hero da página /profissionais."
          campos={[
            { chave: CONFIG_PROFISSIONAIS_HERO_TITULO, label: "Título", placeholder: "Sua agenda cheia e seu talento em destaque.", atual: config[CONFIG_PROFISSIONAIS_HERO_TITULO] },
            {
              chave: CONFIG_PROFISSIONAIS_HERO_SUBTITULO,
              label: "Subtítulo",
              placeholder: "Conecte-se com empresas que precisam do seu trabalho pontual.",
              atual: config[CONFIG_PROFISSIONAIS_HERO_SUBTITULO],
            },
          ]}
        />

        <h2 className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-2">Página /empresas — banner hero</h2>
        <AparenciaColorForm
          chave={CONFIG_EMPRESAS_HERO_BG}
          label="Cor de fundo do banner"
          descricao="Cor do overlay em cima da foto do banner hero da página /empresas."
          atual={config[CONFIG_EMPRESAS_HERO_BG]}
        />
        <AparenciaImageForm
          chave={CONFIG_EMPRESAS_HERO_IMAGEM}
          label="Foto do banner (opcional)"
          descricao="Foto de fundo do banner hero, com a cor acima por cima em baixa opacidade. Sem foto, fica só a cor sólida."
          atual={config[CONFIG_EMPRESAS_HERO_IMAGEM]}
          opcional
        />
        <TextConfigForm
          titulo="Textos do banner"
          descricao="Título e subtítulo do banner hero da página /empresas."
          campos={[
            { chave: CONFIG_EMPRESAS_HERO_TITULO, label: "Título", placeholder: "Clientes da sua região estão procurando os seus serviços agora.", atual: config[CONFIG_EMPRESAS_HERO_TITULO] },
            {
              chave: CONFIG_EMPRESAS_HERO_SUBTITULO,
              label: "Subtítulo",
              placeholder: "Receba pedidos qualificados e negocie direto pelo WhatsApp.",
              atual: config[CONFIG_EMPRESAS_HERO_SUBTITULO],
            },
          ]}
        />
      </div>
    </div>
  );
}
