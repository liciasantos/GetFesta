// Helper client-side pra ler um PDF como data URI - so importar de
// componentes "use client". Sem redimensionamento (nao faz sentido pra PDF),
// so leitura + nome original do arquivo.

export type LoadedPdf = { dataUrl: string; nome: string; sizeKb: number };

export function fileToDataUrl(file: File): Promise<LoadedPdf> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Não foi possível ler esse arquivo"));
        return;
      }
      resolve({ dataUrl, nome: file.name, sizeKb: Math.round(file.size / 1024) });
    };
    reader.onerror = () => reject(new Error("Não foi possível ler esse arquivo"));
    reader.readAsDataURL(file);
  });
}
