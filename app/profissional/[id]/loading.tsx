import { Bone, CarregandoPagina } from "@/components/Skeleton";

/** Mesmo esqueleto serve pro perfil da empresa e do profissional. */
export default function CarregandoPerfil() {
  return (
    <CarregandoPagina>
      <Bone className="h-44 w-full rounded-none sm:hidden" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="-mt-12 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:items-center">
          <Bone className="h-24 w-24 rounded-full ring-4 ring-surface" />
          <div className="flex w-full flex-col items-center gap-2 sm:items-start">
            <Bone className="h-7 w-64" />
            <Bone className="h-4 w-40" />
          </div>
        </div>
        <Bone className="mt-8 h-4 w-full max-w-2xl" />
        <Bone className="mt-2 h-4 w-5/6 max-w-xl" />
        <div className="mt-8 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bone key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </CarregandoPagina>
  );
}
