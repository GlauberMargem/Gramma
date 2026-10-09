import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserStore, USER_DATA_KEY } from './userStore';

describe('userStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('getSnapshot devolve a mesma referência até um update', () => {
    const store = createUserStore();
    const a = store.getSnapshot();
    expect(store.getSnapshot()).toBe(a);
    store.update((d) => ({ ...d, stats: { ...d.stats, games_played: 1 } }));
    const b = store.getSnapshot();
    expect(b).not.toBe(a);
    expect(store.getSnapshot()).toBe(b);
  });

  it('update persiste em gramma_user_data e notifica assinantes', () => {
    const store = createUserStore();
    const cb = vi.fn();
    const unsub = store.subscribe(cb);
    store.update((d) => ({ ...d, stats: { ...d.stats, games_played: 7 } }));
    expect(cb).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(localStorage.getItem(USER_DATA_KEY) ?? '{}') as {
      stats: { games_played: number };
    };
    expect(saved.stats.games_played).toBe(7);
    unsub();
    store.update((d) => d);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('lê dados já salvos', () => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({ uuid: 'abc' }));
    expect(createUserStore().getSnapshot().uuid).toBe('abc');
  });

  it('setItem lançando erro não quebra e o estado em memória segue válido', () => {
    const store = createUserStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cb = vi.fn();
    store.subscribe(cb);
    expect(() =>
      store.update((d) => ({ ...d, stats: { ...d.stats, games_played: 3 } })),
    ).not.toThrow();
    expect(store.getSnapshot().stats.games_played).toBe(3);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('getItem lançando erro cai nos defaults', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('negado');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(createUserStore().getSnapshot().stats.games_played).toBe(0);
  });

  it('evento storage de outra aba invalida o cache e notifica', () => {
    const store = createUserStore();
    const cb = vi.fn();
    store.subscribe(cb);
    const before = store.getSnapshot();
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({ uuid: 'outra-aba' }));
    window.dispatchEvent(new StorageEvent('storage', { key: USER_DATA_KEY }));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot().uuid).toBe('outra-aba');
  });

  it('ignora storage de outras chaves', () => {
    const store = createUserStore();
    const cb = vi.fn();
    store.subscribe(cb);
    window.dispatchEvent(new StorageEvent('storage', { key: 'outra' }));
    expect(cb).not.toHaveBeenCalled();
  });
});
