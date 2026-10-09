import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { FONT_SCALES, useFontScale } from '../state/hooks';

export function Accessibility() {
  const go = useAnimatedNavigate();
  const { index, label, change } = useFontScale();

  return (
    <ScreenTransition className="game-container">
      <section className="screen-panel">
        <header className="header">
          <p className="screen-title">
            <MaterialIcon name="accessibility_new" />
            Acessibilidade
          </p>
          <IconButton icon="close" label="Fechar" onClick={() => go('/')} />
        </header>

        <div className="a11y-list">
          <div className="a11y-row">
            <span className="a11y-label">
              <MaterialIcon name="format_size" />
              <span>
                <span className="a11y-title">Tamanho da fonte</span>
                <span className="a11y-hint">Ajusta o tamanho de todo o texto do jogo</span>
              </span>
            </span>
            <span className="a11y-stepper">
              <IconButton icon="remove" label="Diminuir fonte" disabled={index <= 0} onClick={() => change(-1)} />
              <span className="a11y-value">{label}</span>
              <IconButton
                icon="add"
                label="Aumentar fonte"
                disabled={index >= FONT_SCALES.length - 1}
                onClick={() => change(1)}
              />
            </span>
          </div>
        </div>
      </section>
    </ScreenTransition>
  );
}
