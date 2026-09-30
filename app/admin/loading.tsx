import { Bone, CarregandoPagina } from "@/components/Skeleton";

export default function CarregandoAdmin() {
  return (
    <CarregandoPagina className="mx-auto max-w-4xl px-6 py-10">
      <Bone className="h-7 w-60" />
      <Bone className="mt-2 h-4 w-80" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-9 w-28" />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-24" />
        ))}
      </div>
    </CarregandoPagina>
  );
}
