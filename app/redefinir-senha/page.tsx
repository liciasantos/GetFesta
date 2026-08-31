import Link from "next/link";
import RedefinirSenhaForm from "./RedefinirSenhaForm";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-center text-xl font-extrabold">Redefinir senha</h1>

      {sp.token ? (
        <>
          <p className="mt-1 text-center text-[12.5px] text-muted">Escolha sua nova senha.</p>
          <div className="mt-5 rounded-xl border border-border bg-surface p-5">
            <RedefinirSenhaForm token={sp.token} />
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-3 text-center text-[13px] text-danger-dark">
          Link inválido.{" "}
          <Link href="/esqueci-senha" className="font-bold underline">
            Solicite um novo
          </Link>
          .
        </p>
      )}
    </div>
  );
}
