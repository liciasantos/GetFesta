import { Bone, CarregandoPagina } from "@/components/Skeleton";

export default function CarregandoBusca() {
  return (
    <CarregandoPagina className="mx-auto max-w-6xl px-6 py-8">
      <Bone className="h-8 w-72" />
      <Bone className="mt-5 h-14 w-full" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
            <Bone className="h-48 rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-1/2" />
              <Bone className="mt-2 h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </CarregandoPagina>
  );
}
