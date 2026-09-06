"use client";

import { useRef, type ReactNode } from "react";
import AvatarUpload, { type AvatarUploadHandle } from "@/components/AvatarUpload";
import type { UploadResult } from "@/lib/actions/perfil";
import { useProfissionalTab } from "@/components/ProfissionalTabs";
import { buttonClass } from "@/components/ui";

/** Cabeçalho mobile do catálogo do profissional - troca de visual conforme a
 * aba ativa: na aba Perfil vira um herói escuro com avatar sobreposto (igual
 * ao print de referência); nas outras abas fica um cabeçalho simples com o
 * mesmo título e um atalho pra "Alterar o Plano". Só existe no mobile
 * (sm:hidden) - o desktop continua usando o título simples de sempre. */
export default function PerfilProfissionalMobileHeader({
  nome,
  fotoPerfilUrl,
  disponibilidadeLabel,
  aviso,
  atualizarFoto,
}: {
  nome: string;
  fotoPerfilUrl: string | null;
  disponibilidadeLabel: string;
  aviso: ReactNode | null;
  atualizarFoto: (dataUrl: string) => Promise<UploadResult>;
}) {
  const { tab, setTab } = useProfissionalTab();
  const avatarRef = useRef<AvatarUploadHandle>(null);

  function irParaPlano() {
    setTab("perfil");
    requestAnimationFrame(() => {
      document.getElementById("plano-upsell")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (tab === "perfil") {
    return (
      <div className="-mx-6 -mt-10 sm:hidden">
        <div className="bg-text px-6 pb-20 pt-6 text-left text-white">
          <h1 className="text-lg font-extrabold">Meu catálogo profissional</h1>
          <p className="mt-1 text-[12.5px] text-white/70">
            Seu perfil não aparece para clientes finais — só empresas autenticadas na GetFesta podem ver e te contatar.
          </p>
        </div>
        <div className="bg-surface px-6 pb-5 text-center">
          <div className="relative -mt-[65px]">
            <AvatarUpload ref={avatarRef} initialUrl={fotoPerfilUrl} name={nome} action={atualizarFoto} size={110} variant="compact" />
          </div>
          <h2 className="mt-3 text-lg font-extrabold">{nome}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">{disponibilidadeLabel}</p>

          <div className="mt-4 flex items-center justify-start gap-2.5">
            <button type="button" onClick={() => avatarRef.current?.openPicker()} className={buttonClass("primary", "sm")}>
              Trocar foto
            </button>
            <button type="button" onClick={irParaPlano} className={buttonClass("secondary", "sm")}>
              Alterar o Plano
            </button>
          </div>

          {aviso && <div className="mt-4 text-left">{aviso}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 px-6 pb-5 pt-6 sm:hidden">
      <h1 className="text-lg font-extrabold">Meu catálogo profissional</h1>
      <p className="mt-1 text-[12.5px] text-muted">
        Seu perfil não aparece para clientes finais — só empresas autenticadas na GetFesta podem ver e te contatar.
      </p>
      <button type="button" onClick={irParaPlano} className={`${buttonClass("primary", "sm")} mt-4`}>
        Alterar o Plano
      </button>
      {aviso && <div className="mt-4">{aviso}</div>}
    </div>
  );
}
