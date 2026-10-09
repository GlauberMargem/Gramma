export const INTRO_SESSION_KEY = 'gramma_intro_seen';

export interface BootDecision {
  /** Rota inicial a forçar; `null` mantém o hash atual. */
  route: string | null;
  /** Se a query (`?day=N`) deve ser removida da URL. */
  clearQuery: boolean;
}

function getRequestedDay(search: string): number | null {
  const day = parseInt(new URLSearchParams(search).get('day') ?? '', 10);
  return Number.isInteger(day) && day > 0 ? day : null;
}

export function resolveBoot(search: string, introSeen: boolean): BootDecision {
  const day = getRequestedDay(search);
  if (day !== null) return { route: `/jogo/${day}`, clearQuery: true };
  return { route: introSeen ? null : '/intro', clearQuery: false };
}

export function readIntroSeen(): boolean {
  try {
    return Boolean(sessionStorage.getItem(INTRO_SESSION_KEY));
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, '1');
  } catch {
    // Sem sessionStorage a intro pode reaparecer na próxima carga; inofensivo.
  }
}

export function applyBoot(): void {
  const { route, clearQuery } = resolveBoot(window.location.search, readIntroSeen());
  if (clearQuery) {
    history.replaceState(null, '', window.location.pathname + `#${route}`);
  } else if (route) {
    window.location.hash = route;
  }
}
