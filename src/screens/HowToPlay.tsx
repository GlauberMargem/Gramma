import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';

const STEPS = [
  { icon: 'tune', name: 'Escolha seu modo', desc: 'Morfologia, Sintaxe ou Sinônimos — cada um testa uma habilidade diferente.' },
  {
    icon: 'today',
    name: 'Uma pergunta por dia',
    desc: 'Cada dia do calendário traz um desafio novo. Responda com atenção: só existe uma tentativa!',
  },
  {
    icon: 'military_tech',
    name: 'Pontuação',
    desc: 'Morfologia vale 100 pts, Sinônimos 150 pts e Sintaxe 200 pts. Errar não desconta pontos.',
  },
  {
    icon: 'local_fire_department',
    name: 'Bônus de sequência',
    desc: 'A cada 5 acertos seguidos no mesmo modo, você ganha +10% de bônus e a tela brilha.',
  },
  {
    icon: 'emoji_events',
    name: 'Conquistas',
    desc: 'Desbloqueie medalhas conforme evolui em cada modo e mantém sua ofensiva diária.',
  },
  {
    icon: 'calendar_month',
    name: 'Arquivo',
    desc: 'Jogue dias anteriores quando quiser em "Dias anteriores" — isso não altera sua ofensiva atual.',
  },
];

export function HowToPlay() {
  const go = useAnimatedNavigate();

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <h1 className="screen-title">
            <MaterialIcon name="help" />
            Como Jogar
          </h1>
          <IconButton icon="close" label="Fechar" onClick={() => go('/')} />
        </header>

        <div className="achievements-list">
          {STEPS.map((s) => (
            <div key={s.icon} className="achievement-card">
              <MaterialIcon name={s.icon} className="achievement-icon" />
              <span>
                <span className="achievement-name" style={{ display: 'block' }}>
                  {s.name}
                </span>
                <span className="achievement-desc">{s.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </ScreenTransition>
  );
}
