import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { contatoLiberadoParaCliente, getEmpresaById, registrarVisualizacaoPerfil } from "@/lib/data/empresas";
import { Badge, Chip, PlaceholderImg } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";
import GaleriaLightbox from "@/components/GaleriaLightbox";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmpresaPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empresa = await getEmpresaById(id);
  if (!empresa) notFound();

  const session = await getSession();
  const contatoLiberado =
    session?.tipo === "cliente" ? await contatoLiberadoParaCliente(empresa.usuario_id, session.usuarioId) : false;

  // Efeito colateral: registra a visualizacao (KPI real do painel do fornecedor).
  await registrarVisualizacaoPerfil(empresa.usuario_id);

  return (
    <div>
      {/* CABEÇALHO — sem banner full-bleed; a foto de destaque da galeria fica
          numa coluna grande ao lado do nome (largura fixa ~400px), esticada
          via flex (items-stretch) até a altura da coluna da esquerda — ou
          seja, até a base do card de numeros. */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
          <div className="flex flex-1 flex-col gap-5">
            <div className="flex items-center gap-4">
              {empresa.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empresa.logo_url}
                  alt={empresa.nome_fantasia}
                  className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover shadow-card sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-accent-soft font-display text-2xl font-extrabold text-accent-dark shadow-card sm:h-24 sm:w-24">
                  {empresa.nome_fantasia[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold sm:text-2xl">{empresa.nome_fantasia}</h1>
                  {empresa.selo_verificado && <Badge tone="ok">✓ Selo verificado</Badge>}
                  {empresa.aprovada_para_destaque && <Badge tone="ad">Destaque</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
                  {empresa.nota_exibida ? (
                    <span>
                      ⭐ <b className="text-text">{Number(empresa.nota_exibida).toFixed(1)}</b> (
                      {empresa.total_avaliacoes_exibido} avaliações)
                      {empresa.nota_fonte === "google" && empresa.url_perfil_google && (
                        <>
                          {" "}
                          <a
                            href={empresa.url_perfil_google}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="ml-1 rounded-full bg-surface-alt px-2 py-0.5 text-[10.5px] font-bold text-muted hover:underline"
                          >
                            Nota no Google ↗
                          </a>
                        </>
                      )}
                    </span>
                  ) : (
                    <span>Empresa nova na GetFesta</span>
                  )}
                  {empresa.cidades.length > 0 && (
                    <span>
                      📍 <b className="text-text">{empresa.cidades.join(", ")}</b>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded-xl border border-border bg-surface px-4 py-3 text-[12.5px]">
              {empresa.preco_a_partir_de && (
                <Stat label="a partir de" value={`R$ ${Number(empresa.preco_a_partir_de).toLocaleString("pt-BR")}`} />
              )}
              {empresa.capacidade_convidados && <Stat label="capacidade" value={`${empresa.capacidade_convidados} conv.`} />}
              {empresa.tempo_resposta_medio_minutos && (
                <Stat label="responde em" value={`~${empresa.tempo_resposta_medio_minutos} min`} />
              )}
            </div>
          </div>

          {/* position:relative + img absoluto: a foto não pode participar do calculo
              de altura do flex item, senão o proprio tamanho natural da imagem
              (e não o conteudo da coluna da esquerda) decide a altura da linha. */}
          <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-2xl bg-surface-alt sm:h-auto sm:w-[400px]">
            {empresa.foto_capa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={empresa.foto_capa} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <PlaceholderImg className="absolute inset-0 h-full w-full" />
            )}
          </div>
        </div>

        {!empresa.perfil_reivindicado && (
          <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-[#efece5] p-2.5 text-[11.5px] text-muted">
            Este perfil foi criado pela GetFesta a partir de dados públicos para ajudar você a encontrar esse
            fornecedor. Ainda não foi confirmado pela empresa — os dados podem estar desatualizados.{" "}
            <Link href="/cadastro/empresa" className="font-bold text-accent-dark underline">
              É dono deste negócio? Reivindique o perfil grátis.
            </Link>
          </div>
        )}

        {/* SOBRE — texto livre da empresa, o principal espaço pra ela se vender pro cliente */}
        {empresa.descricao && (
          <section className="mt-10">
            <h2 className="section-kicker">Sobre a {empresa.nome_fantasia}</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-text">{empresa.descricao}</p>
          </section>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-[2fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-10">
          {empresa.galeria.length > 0 && (
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Galeria</h4>
              <GaleriaLightbox fotos={empresa.galeria} />
            </section>
          )}

          {empresa.estrutura.length > 0 && (
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Estrutura do espaço</h4>
              <div className="flex flex-wrap gap-2">
                {empresa.estrutura.map((item) => (
                  <Chip key={item} active>
                    {item.replace(/_/g, " ")}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {empresa.pacotes.length > 0 && (
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Pacotes</h4>
              <div className="flex flex-col gap-2">
                {empresa.pacotes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <div className="text-[12.5px] font-bold">{p.nome}</div>
                      {p.descricao && <div className="text-[11.5px] text-muted">{p.descricao}</div>}
                    </div>
                    {p.preco && <div className="text-[12.5px] font-bold text-accent-dark">R$ {Number(p.preco).toLocaleString("pt-BR")}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Avaliações de clientes</h4>
            {empresa.avaliacoes.length === 0 ? (
              <p className="text-[12.5px] text-muted">Essa empresa ainda não tem avaliações na GetFesta.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {empresa.avaliacoes.map((a, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="mb-1 text-[12px] font-bold">{"⭐".repeat(a.nota)}</div>
                    {a.comentario && <div className="text-[12px] text-muted">{a.comentario}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-10">
          {empresa.categorias.length > 0 && (
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Categorias atendidas</h4>
              <div className="flex flex-wrap gap-2">
                {empresa.categorias.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-2">Contato</h4>
            {contatoLiberado ? (
              <div className="flex flex-col gap-2 rounded-lg border border-ok bg-ok-soft p-3">
                <div className="text-[12.5px] font-bold text-ok">
                  {empresa.instagram && <div>Instagram: {empresa.instagram}</div>}
                  {empresa.telefone_contato && <div>Telefone: {empresa.telefone_contato}</div>}
                </div>
                {empresa.telefone_contato && (
                  <WhatsAppButton empresaId={empresa.usuario_id} href={buildWhatsAppLink(empresa.telefone_contato)} />
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border-strong bg-[#efece5] p-3.5 text-center text-[12px] text-muted">
                🔒 Instagram e telefone ficam disponíveis depois que uma empresa que você contatou manifesta interesse no seu
                pedido.
                <div className="mt-2">
                  <Link href="/publicar-pedido" className="font-bold text-accent-dark underline">
                    Publicar um pedido agora
                  </Link>
                </div>
              </div>
            )}
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted-2">
              Este perfil é de um prestador independente. GetFesta apenas facilita o contato e não participa da
              contratação.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-text">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-2">{label}</div>
    </div>
  );
}
