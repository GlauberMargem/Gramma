import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TopBar } from './TopBar';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
    </MemoryRouter>,
  );
}

describe('TopBar', () => {
  it('aparece em / com botões rotulados', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Alternar tema claro/escuro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acessibilidade' })).toBeInTheDocument();
  });

  it('não aparece fora de /', () => {
    const { container } = renderAt('/modo');
    expect(container).toBeEmptyDOMElement();
  });

  it('alterna o tema e o ícone', async () => {
    renderAt('/');
    const btn = screen.getByRole('button', { name: 'Alternar tema claro/escuro' });
    const before = btn.textContent;
    await userEvent.click(btn);
    expect(btn.textContent).not.toBe(before);
    expect(['light_mode', 'dark_mode']).toContain(btn.textContent);
  });
});
