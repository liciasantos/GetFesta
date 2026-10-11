import { Bone, CarregandoPagina } from "@/components/Skeleton";

export default function CarregandoAreaCliente() {
  return (
    <CarregandoPagina className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
      <div className="flex flex-col gap-4">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-64" />
        <Bone className="h-56 rounded-2xl" />
        <Bone className="h-4 w-40" />
        <Bone className="h-36 rounded-2xl" />
      </div>
      <div className="mt-6 hidden flex-col gap-4 lg:mt-0 lg:flex">
        <Bone className="h-44 rounded-2xl" />
        <Bone className="h-36 rounded-2xl" />
      </div>
    </CarregandoPagina>
  );
}
