export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-extrabold">Privacidade</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: {new Date().toLocaleDateString("pt-BR")}.</p>

      <div className="mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-text">
        <section>
          <h2 className="mb-1.5 text-base font-bold">1. Quais dados coletamos</h2>
          <p>
            Coletamos os dados necessários para conectar clientes e fornecedores: nome, telefone, e-mail, cidade e
            bairro, além dos dados que a própria empresa ou profissional opta por publicar em seu perfil (fotos,
            descrição, categorias de atuação).
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">2. Dados sensíveis de profissionais</h2>
          <p>
            Perfis de profissionais de evento (ator/atriz, animador, entre outros) podem incluir dados como altura,
            peso e manequim, usados exclusivamente para caracterização de personagem. Esses dados só são exibidos
            para empresas autenticadas — nunca para o cliente final — e o profissional pode ocultar o perfil a
            qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">3. Liberação de contato</h2>
          <p>
            Telefone e Instagram de uma empresa só são exibidos ao cliente depois que essa empresa manifesta
            interesse em um pedido específico daquele cliente. Antes disso, essas informações permanecem ocultas.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">4. Compartilhamento com terceiros</h2>
          <p>
            Não vendemos dados pessoais a terceiros. Dados de contato são compartilhados apenas entre cliente e
            fornecedor, no momento e na medida necessária para viabilizar a contratação do serviço.
          </p>
        </section>

        <section>
          <h2 className="mb-1.5 text-base font-bold">5. Seus direitos</h2>
          <p>
            Você pode solicitar a atualização, exportação ou exclusão dos seus dados a qualquer momento, conforme a
            Lei Geral de Proteção de Dados (LGPD).
          </p>
        </section>
      </div>
    </div>
  );
}
