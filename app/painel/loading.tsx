import { Bone, CarregandoPagina } from "@/components/Skeleton";

export default function CarregandoPainel() {
  return (
    <CarregandoPagina className="mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
      <div className="flex flex-col gap-5">
        <Bone className="h-7 w-56" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-20" />
          ))}
        </div>
        <Bone className="h-4 w-40" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-16" />
          ))}
        </div>
      </div>
      <div className="mt-6 hidden flex-col gap-4 lg:mt-0 lg:flex">
        <Bone className="h-32" />
        <Bone className="h-40" />
      </div>
    </CarregandoPagina>
  );
}
