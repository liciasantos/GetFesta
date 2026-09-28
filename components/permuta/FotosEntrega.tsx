"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resizeImageToDataUrl } from "@/lib/image-client";
import {
  adicionarFotoEntregaNaGaleria,
  avisarFotosEnviadas,
  enviarFotoEntrega,
  removerFotoEntrega,
} from "@/lib/actions/permuta";
import { buttonClass } from "@/components/ui";
import type { FotoEntrega } from "@/lib/data/permuta";

/** Fotos do evento de uma entrega.
 *  - quem RECEBEU o serviço envia fotos e autoriza (ou não) o uso no portfólio;
 *  - quem PRESTOU escolhe quais fotos autorizadas entram na própria galeria. */
export default function FotosEntrega({
  entregaId,
  modo,
  fotos,
  parceiroNome,
  limite,
  vagasGaleria,
}: {
  entregaId: string;
  modo: "enviar" | "receber";
  fotos: FotoEntrega[];
  parceiroNome: string;
  limite: number;
  vagasGaleria: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [autoriza, setAutoriza] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const restantes = Math.max(0, limite - fotos.length);

  function enviar(files: FileList | null) {
    if (!files) return;
    setErro(null);
    const imagens = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, restantes);
    if (imagens.length === 0) return;
    startTransition(async () => {
      let enviadas = 0;
      for (const file of imagens) {
        try {
          const r = await resizeImageToDataUrl(file, 640, 0.82);
          const res = await enviarFotoEntrega(entregaId, r.dataUrl, autoriza);
          if (res?.error) {
            setErro(res.error);
            break;
          }
          enviadas++;
        } catch {
          setErro("Não foi possível processar uma das imagens.");
          break;
        }
      }
      if (enviadas > 0) await avisarFotosEnviadas(entregaId, enviadas);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function acao(fn: () => Promise<{ error?: string } | undefined>) {
    setErro(null);
    startTransition(async () => {
      const r = await fn();
      if (r?.error) setErro(r.error);
      router.refresh();
    });
  }

  if (modo === "receber" && fotos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-bg p-3.5">
      <div className="text-[13px] font-bold">
        {modo === "enviar" ? "Fotos do evento" : `Fotos enviadas por ${parceiroNome}`}
      </div>
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="Foto do evento" className="aspect-square w-full rounded-md object-cover" />
              {modo === "enviar" ? (
                <div className="flex flex-col gap-0.5 text-[11px]">
                  <span className={f.autorizada_portfolio ? "text-ok" : "text-muted"}>
                    {f.galeria_foto_id ? "No portfólio deles" : f.autorizada_portfolio ? "Uso autorizado" : "Só registro"}
                  </span>
                  {!f.galeria_foto_id && (
                    <button type="button" disabled={pending} onClick={() => acao(() => removerFotoEntrega(f.id))} className="self-start font-bold text-danger-dark underline">
                      Remover
                    </button>
                  )}
                </div>
              ) : f.galeria_foto_id ? (
                <span className="text-[11px] font-bold text-ok">✓ Na sua galeria</span>
              ) : f.autorizada_portfolio ? (
                <button
                  type="button"
                  disabled={pending || vagasGaleria <= 0}
                  onClick={() => acao(() => adicionarFotoEntregaNaGaleria(f.id))}
                  className="self-start text-[11px] font-bold text-accent-dark underline disabled:text-muted disabled:no-underline"
                >
                  Adicionar ao portfólio
                </button>
              ) : (
                <span className="text-[11px] text-muted">Uso não autorizado</span>
              )}
            </div>
          ))}
        </div>
      )}

      {modo === "enviar" && restantes > 0 && (
        <>
          <p className="text-[12px] leading-relaxed text-muted">
            Envie até {limite} fotos do evento. Se autorizar, {parceiroNome} pode usá-las no portfólio — ótimo para quem
            fez o seu evento.
          </p>
          <label className="flex items-start gap-2 text-[12px] leading-relaxed">
            <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} className="mt-0.5" />
            <span>
              Autorizo {parceiroNome} a usar estas fotos no portfólio. Declaro ter autorização das pessoas que aparecem —
              e dos pais ou responsáveis, no caso de crianças e adolescentes (LGPD, art. 14).
            </span>
          </label>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
          <button type="button" disabled={pending} onClick={() => inputRef.current?.click()} className={`${buttonClass("secondary", "sm")} self-start`}>
            {pending ? "Enviando..." : "Adicionar fotos"}
          </button>
        </>
      )}
      {modo === "receber" && vagasGaleria <= 0 && fotos.some((f) => f.autorizada_portfolio && !f.galeria_foto_id) && (
        <p className="text-[12px] text-muted">Sua galeria está cheia (12 fotos). Remova alguma em Perfil da empresa para adicionar estas.</p>
      )}
      {erro && <p className="text-[12px] font-semibold text-danger-dark">{erro}</p>}
    </div>
  );
}
