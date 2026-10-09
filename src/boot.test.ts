import { resolveBoot } from './boot';

describe('resolveBoot', () => {
  it('?day=5 vai ao jogo do dia e limpa a query', () => {
    expect(resolveBoot('?day=5', false)).toEqual({ route: '/jogo/5', clearQuery: true });
  });

  it('?day=5 ignora a intro já vista', () => {
    expect(resolveBoot('?day=5', true)).toEqual({ route: '/jogo/5', clearQuery: true });
  });

  it('?day=0 é inválido e cai na intro', () => {
    expect(resolveBoot('?day=0', false)).toEqual({ route: '/intro', clearQuery: false });
  });

  it('?day=abc é inválido e cai na intro', () => {
    expect(resolveBoot('?day=abc', false)).toEqual({ route: '/intro', clearQuery: false });
  });

  it('sem query e intro não vista vai a /intro', () => {
    expect(resolveBoot('', false)).toEqual({ route: '/intro', clearQuery: false });
  });

  it('sem query e intro vista não redireciona', () => {
    expect(resolveBoot('', true)).toEqual({ route: null, clearQuery: false });
  });
});
