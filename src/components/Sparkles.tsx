import { useState } from 'react';

const ICONS = ['auto_awesome', 'star', 'stars'];

interface Sparkle {
  icon: string;
  left: number;
  top: number;
  delay: number;
}

interface SparklesProps {
  count?: number;
  /** Injetável para teste; padrão Math.random. */
  rng?: () => number;
}

/** Chuva de ícones da tela de resultado (paridade com `spawnSparkles`). */
export function Sparkles({ count = 16, rng = Math.random }: SparklesProps) {
  // Sorteio só na criação: re-renders não podem mudar posições/atrasos
  const [items] = useState<Sparkle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      icon: ICONS[i % ICONS.length],
      left: rng() * 100,
      top: rng() * 100,
      delay: rng() * 0.4,
    })),
  );

  return (
    <div className="sparkles" aria-hidden="true">
      {items.map((s, i) => (
        <span
          key={i}
          className="material-symbols-outlined sparkle"
          aria-hidden="true"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
        >
          {s.icon}
        </span>
      ))}
    </div>
  );
}
