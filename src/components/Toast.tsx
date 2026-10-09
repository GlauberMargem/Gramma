import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

/** Aviso não bloqueante (substitui `alert`); some sozinho. Reusa o estilo `.achievement-toast`. */
export function Toast({ message, onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onDismiss]);

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <span>{message}</span>
    </div>
  );
}
