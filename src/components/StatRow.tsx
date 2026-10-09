export function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-row">
      <span className="label">{label}</span>
      <span>{value}</span>
    </div>
  );
}
