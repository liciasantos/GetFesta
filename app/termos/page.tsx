export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-extrabold">Termos de uso</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: {new Date().toLocaleDateString("pt-BR")}.</p>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-text">
        <section>
          <h2 className="mb-1.5 text-base font-bold">1. O que é a GetFesta</h2>
          <p>
            A GetFesta é uma plataforma de conexão entre clientes que buscam serviços para festas e eventos e
            empresas fornecedoras independentes (buffets, casas de festa, decoração, animação e demais categorias
            listadas na plataforma).
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">2. A GetFesta não é parte na contratação</h2>
          <p>
            <b>A GetFesta apenas facilita o contato entre clientes e fornecedores.</b> A GetFesta não é empregadora,
            contratante, intermediária financeira nem parte no contrato de prestação de serviço eventualmente
            firmado entre cliente e fornecedor, e não garante a qualidade, a pontualidade ou o cumprimento do
            serviço contratado. Cada empresa e profissional listado é um prestador independente, responsável pelos
            próprios serviços, obrigações fiscais e trabalhistas.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">3. Publicação de pedidos</h2>
          <p>
            Clientes podem publicar pedidos de serviço sem necessidade de cadastro. Dados de contato (telefone/e-mail)
            não podem ser incluídos em descrições ou mensagens antes da liberação de contato pela plataforma — esse
            tipo de conteúdo pode ser removido ou mascarado automaticamente.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">4. Cadastro de empresas e profissionais</h2>
          <p>
            O cadastro de empresas exige CNPJ ativo. A GetFesta pode validar automaticamente a situação cadastral do
            CNPJ informado. Perfis de fornecedores criados a partir de dados públicos (cadastro assistido) são
            sinalizados como não confirmados até que a empresa reivindique o próprio perfil.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">5. Planos e cobrança</h2>
          <p>
            Alguns recursos para fornecedores são pagos por assinatura mensal ou anual, conforme o plano escolhido no
            cadastro. Períodos promocionais de acesso gratuito, quando oferecidos, têm data de início e término
            informadas no momento da adesão.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">6. Contato</h2>
          <p>Dúvidas sobre estes termos podem ser enviadas através dos canais de contato disponíveis no site.</p>
        </section>
      </div>
    </div>
  );
}
