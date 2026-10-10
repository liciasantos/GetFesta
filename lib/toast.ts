/** Aviso rápido de confirmação ("Candidatura enviada", "Foto adicionada"...).
 * Sem biblioteca: cria o contêiner na primeira chamada e anima só com
 * transição CSS (classe .toast em app/globals.css). Só pra client components.
 * No celular fica acima da barra de ícones fixa quando ela existe. */

type Tipo = "sucesso" | "erro";

const DURACAO_MS = 3200;

function conteiner(): HTMLElement {
  let el = document.getElementById("toasts");
  if (el) return el;
  el = document.createElement("div");
  el.id = "toasts";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  const temBarra = !!document.querySelector("[data-barra-inferior]") && window.innerWidth < 640;
  el.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + ${
    temBarra ? 84 : 20
  }px);z-index:70;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;width:max-content;max-width:calc(100vw - 32px)`;
  document.body.appendChild(el);
  return el;
}

export function toast(mensagem: string, tipo: Tipo = "sucesso") {
  if (typeof document === "undefined") return;
  const item = document.createElement("div");
  item.className = "toast";
  item.style.cssText = `pointer-events:auto;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;font-size:13.5px;font-weight:700;box-shadow:0 10px 30px -10px rgba(31,41,51,.35);background:${
    tipo === "erro" ? "#a3262a" : "#1f2933"
  };color:#fff`;
  const icone = tipo === "erro" ? '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4M12 17h.01"/>' : '<path d="M5 12.5 10 17l9-10"/>';
  item.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icone}</svg>`;
  const texto = document.createElement("span");
  texto.textContent = mensagem;
  item.appendChild(texto);
  conteiner().appendChild(item);
  // dois frames: o navegador precisa pintar o estado inicial antes da transição
  requestAnimationFrame(() => requestAnimationFrame(() => item.setAttribute("data-visivel", "")));
  window.setTimeout(() => {
    item.removeAttribute("data-visivel");
    item.addEventListener("transitionend", () => item.remove(), { once: true });
    window.setTimeout(() => item.remove(), 600); // garantia se a transição não disparar
  }, DURACAO_MS);
}
