export default function AceiteLgpdImagensCheckbox() {
  return (
    <label className="flex items-start gap-2 text-[11.5px] text-muted">
      <input type="checkbox" name="aceitouLgpdImagens" required className="mt-0.5" />
      <span>
        Declaro que possuo autorização específica dos pais ou responsáveis legais para publicar qualquer imagem que
        identifique o rosto de criança ou adolescente no meu perfil da GetFesta, conforme exigido pela Lei Geral de
        Proteção de Dados (LGPD, art. 14), e que sou o único responsável por essa autorização e pelo uso da imagem.
      </span>
    </label>
  );
}
