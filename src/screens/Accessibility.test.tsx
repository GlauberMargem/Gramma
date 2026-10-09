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
});
