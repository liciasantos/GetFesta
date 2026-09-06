export function StatRing({
  value,
  label,
  percent,
  color,
}: {
  value: string;
  label: string;
  percent: number;
  color: string;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[68px] w-[68px]">
        <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
          <circle cx="34" cy="34" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4.5" />
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-extrabold text-text">
          {value}
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-2">{label}</span>
    </div>
  );
}
