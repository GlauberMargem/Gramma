import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultUserData } from '../state/userData';
import { userStore } from '../state/userStore';
import { Menu } from './Menu';

function Where() {
  return <p data-testid="loc">{useLocation().pathname}</p>;
}

function renderMenu() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Menu', () => {
  beforeEach(() => {
    // reduced motion: navegação imediata, sem esperar o tween de saída
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    userStore.update(() => createDefaultUserData());
  });

  it('oculta o badge de ofensiva quando a sequência é 0', () => {
    renderMenu();
    expect(screen.queryByText(/Ofensiva atual/)).toBeNull();
  });

  it('mostra o badge quando current_streak > 0', () => {
    userStore.update((d) => ({ ...d, stats: { ...d.stats, current_streak: 3 } }));
    renderMenu();
    expect(screen.getByText('Ofensiva atual: 3 dia(s)')).toBeTruthy();
  });

  it('marca o modo salvo com is-active', () => {
    userStore.update((d) => ({ ...d, settings: { ...d.settings, study_type: 'syntax' } }));
    renderMenu();
    expect(screen.getByRole('button', { name: /Sintaxe/ }).classList.contains('is-active')).toBe(true);
    expect(screen.getByRole('button', { name: /Morfologia/ }).classList.contains('is-active')).toBe(false);
  });

  it('clicar em um modo persiste e navega para /modo', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Sinônimos/ }));
    expect(userStore.getSnapshot().settings.study_type).toBe('synonyms');
    expect(screen.getByTestId('loc').textContent).toBe('/modo');
  });

  it('atalho Como Jogar navega para /como-jogar', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Como Jogar/ }));
    expect(screen.getByTestId('loc').textContent).toBe('/como-jogar');
  });

  it('atalho Conquistas navega para /conquistas', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: /Conquistas/ }));
    expect(screen.getByTestId('loc').textContent).toBe('/conquistas');
  });
});
