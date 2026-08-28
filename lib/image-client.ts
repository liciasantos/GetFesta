// Helpers de imagem client-side (canvas) - so importar de componentes "use client".

export type ResizedImage = {
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
};

/** Base64 de uma data URI tem ~33% de overhead sobre os bytes reais - usamos
 * o tamanho da própria string como estimativa (suficiente pra exibir "~XX KB"
 * pro usuário, não precisa ser exato ao byte). */
function estimateKbFromDataUrl(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = base64.length * 0.75;
  return Math.round(bytes / 1024);
}

/** Mesma ideia do resizeImageToDataUrl, mas pra imagens landscape largas
 * (banners full-bleed) em vez de quadradas - centro-corta pra caber na
 * proporcao alvo (largura x altura) em vez de forcar 1:1. */
export function resizeImageToDataUrlWide(
  file: File,
  targetWidth = 1600,
  targetHeight = 600,
  quality = 0.8
): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível processar a imagem"));
        return;
      }
      const targetRatio = targetWidth / targetHeight;
      const srcRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ dataUrl, width: targetWidth, height: targetHeight, sizeKb: estimateKbFromDataUrl(dataUrl) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler essa imagem"));
    };
    img.src = objectUrl;
  });
}

export function resizeImageToDataUrl(file: File, outputSize = 320, quality = 0.82): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível processar a imagem"));
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, outputSize, outputSize);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ dataUrl, width: outputSize, height: outputSize, sizeKb: estimateKbFromDataUrl(dataUrl) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler essa imagem"));
    };
    img.src = objectUrl;
  });
}
