import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { userStore } from '../state/userStore';
import { createDefaultUserData } from '../state/userData';
import { Accessibility } from './Accessibility';

function setIndex(i: number) {
  userStore.update((d) => ({ ...d, settings: { ...d.settings, font_scale_index: i } }));
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/acessibilidade']}>
      <Routes>
        <Route path="/" element={<p>menu</p>} />
        <Route path="/acessibilidade" element={<Accessibility />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Accessibility', () => {
  beforeEach(() => {
    userStore.update(() => createDefaultUserData());
  });

  it('mostra o rótulo Normal por padrão e muda com os botões', async () => {
    renderScreen();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar fonte' }));
    expect(screen.getByText('Grande')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir fonte' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir fonte' }));
    expect(screen.getByText('Pequena')).toBeInTheDocument();
  });

  it('desabilita diminuir no mínimo', () => {
    setIndex(0);
    renderScreen();
    expect(screen.getByRole('button', { name: 'Diminuir fonte' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Aumentar fonte' })).toBeEnabled();
  });

  it('desabilita aumentar no máximo', () => {
    setIndex(3);
    renderScreen();
    expect(screen.getByText('Extra Grande')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aumentar fonte' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Diminuir fonte' })).toBeEnabled();
  });

  it('fechar volta ao menu', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByText('menu')).toBeInTheDocument();
  });

  it('interruptor da fonte para dislexia liga, persiste e aplica no <html>', async () => {
    renderScreen();
    const toggle = screen.getByRole('switch', { name: 'Fonte para dislexia' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAccessibleDescription(/OpenDyslexic/);

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(userStore.getSnapshot().settings.dyslexia_font).toBe(true);

    await userEvent.click(toggle);
    expect(userStore.getSnapshot().settings.dyslexia_font).toBe(false);
  });

  it('interruptor de alto contraste liga e persiste', async () => {
    renderScreen();
    const toggle = screen.getByRole('switch', { name: 'Alto contraste' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(userStore.getSnapshot().settings.high_contrast).toBe(true);
  });
});
