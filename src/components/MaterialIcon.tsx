export function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={className ? `material-symbols-outlined ${className}` : 'material-symbols-outlined'} aria-hidden="true">
      {name}
    </span>
  );
}
