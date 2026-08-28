export default function GoogleAuthButton({ tipo, label }: { tipo: "cliente" | "profissional"; label: string }) {
  return (
    <>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <a
        href={`/api/auth/google?tipo=${tipo}`}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border-strong bg-surface py-2.5 text-[13px] font-bold text-text hover:bg-surface-alt"
      >
        <GoogleIcon />
        {label}
      </a>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.7 0-12.1-5.4-12.1-12.1S17.3 11.3 24 11.3c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.2 29.2 4.4 24 4.4 12.9 4.4 4 13.3 4 24.4S12.9 44.4 24 44.4c11.1 0 21.5-8.1 21.5-20.4 0-1.4-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.6l6 4.4C13.9 15.1 18.5 12.3 24 12.3c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.2 29.2 4.4 24 4.4c-7.5 0-14 4.3-17.7 10.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.4c5.1 0 9.7-1.7 13.3-4.7l-6.1-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6 4.7C10 40 16.5 44.4 24 44.4z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.1 5.2C40.6 35.8 44 30.6 44 24.4c0-1.4-.1-2.4-.4-3.9z"
      />
    </svg>
  );
}
