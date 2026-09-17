import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { listEmpresaSlugsParaSitemap } from "@/lib/data/empresas";
import { listVagaIdsParaSitemap } from "@/lib/data/vagas";
import {
  listSlugsProdutosAfiliadosParaSitemap,
  listTemasComContagem,
} from "@/lib/data/produtos-afiliados";
import { CATEGORIAS_PRODUTOS } from "@/lib/produtos-afiliados-constantes";

/** Sitemap dinâmico (app/sitemap.ts é uma convenção do Next.js - gera
 * /sitemap.xml automaticamente). Só entram páginas realmente públicas e
 * indexáveis: perfil de profissional (/profissional/[id]) fica de fora de
 * propósito, porque só abre pra empresa autenticada (ver o comentário em
 * app/profissional/[id]/page.tsx) - nunca deve ser indexado. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [empresaSlugs, vagaIds, produtoSlugs, temas] = await Promise.all([
    listEmpresaSlugsParaSitemap(),
    listVagaIdsParaSitemap(),
    listSlugsProdutosAfiliadosParaSitemap(),
    listTemasComContagem(50),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/busca`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/pedidos`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/produtos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/produtos/favoritos`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${SITE_URL}/clientes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/empresas`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/profissionais`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/publicar-pedido`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/quem-somos`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contato`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoriasProdutos: MetadataRoute.Sitemap = CATEGORIAS_PRODUTOS.map((c) => ({
    url: `${SITE_URL}/produtos/categoria/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const temasProdutos: MetadataRoute.Sitemap = temas.map((t) => ({
    url: `${SITE_URL}/produtos/tema/${encodeURIComponent(t.tema.toLowerCase())}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const empresas: MetadataRoute.Sitemap = empresaSlugs.map((slug) => ({
    url: `${SITE_URL}/empresa/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const vagas: MetadataRoute.Sitemap = vagaIds.map((id) => ({
    url: `${SITE_URL}/vaga/${id}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  const produtos: MetadataRoute.Sitemap = produtoSlugs.map((slug) => ({
    url: `${SITE_URL}/produtos/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...paginasEstaticas, ...categoriasProdutos, ...temasProdutos, ...empresas, ...vagas, ...produtos];
}
