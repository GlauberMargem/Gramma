import { render, screen } from '@testing-library/react';
import App from './App';

describe('smoke', () => {
  it('renderiza o App', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'GRAMMA' })).toBeInTheDocument();
  });
});
