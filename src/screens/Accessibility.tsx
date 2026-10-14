import { useId } from 'react';
import { IconButton } from '../components/IconButton';
import { MaterialIcon } from '../components/MaterialIcon';
import { ScreenTransition } from '../components/ScreenTransition';
import { useAnimatedNavigate } from '../hooks/useAnimatedNavigate';
import { FONT_SCALES, useDyslexiaFont, useFontScale, useHighContrast } from '../state/hooks';

interface SwitchRowProps {
  icon: string;
  title: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}

function SwitchRow({ icon, title, hint, checked, onToggle }: SwitchRowProps) {
  const id = useId();
  return (
    <div className="a11y-row">
      <span className="a11y-label">
        <MaterialIcon name={icon} />
        <span>
          <span id={`${id}-title`} className="a11y-title">
            {title}
          </span>
          <span id={`${id}-hint`} className="a11y-hint">
            {hint}
          </span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        className="a11y-switch"
        onClick={onToggle}
      />
    </div>
  );
}

export function Accessibility() {
  const go = useAnimatedNavigate();
  const { index, label, change } = useFontScale();
  const dyslexia = useDyslexiaFont();
  const contrast = useHighContrast();

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

          <SwitchRow
            icon="text_fields"
            title="Fonte para dislexia"
            hint="Usa a fonte OpenDyslexic, com mais espaço entre letras e linhas"
            checked={dyslexia.enabled}
            onToggle={dyslexia.toggle}
          />

          <SwitchRow
            icon="contrast"
            title="Alto contraste"
            hint="Texto branco sobre fundo preto e destaques em amarelo; substitui o tema claro/escuro"
            checked={contrast.enabled}
            onToggle={contrast.toggle}
          />
        </div>
      </section>
    </ScreenTransition>
  );
}
