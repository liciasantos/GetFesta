import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function Pagination({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={`${basePath}?page=${page - 1}`} className={buttonClass("secondary", "sm")}>
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[12px] font-semibold text-muted-2">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${basePath}?page=${page + 1}`} className={buttonClass("secondary", "sm")}>
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
