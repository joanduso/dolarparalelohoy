export function AdSlot({ label }: { label: string }) {
  return (
    <div className="card flex items-center justify-center text-xs text-ink/50 h-[120px]">
      Espacio publicitario reservado · {label}
    </div>
  );
}
