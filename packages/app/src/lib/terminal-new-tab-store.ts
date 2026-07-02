
export const TERMINAL_NEW_TAB_BARE_KEY = 'ok-terminal-new-tab-bare-v1';

export interface NewTabStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readPreferBareTerminal(storage?: NewTabStorage): boolean {
  try {
    const s = storage ?? localStorage;
    return s.getItem(TERMINAL_NEW_TAB_BARE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePreferBareTerminal(bare: boolean, storage?: NewTabStorage): void {
  try {
    const s = storage ?? localStorage;
    if (bare) s.setItem(TERMINAL_NEW_TAB_BARE_KEY, '1');
    else s.removeItem(TERMINAL_NEW_TAB_BARE_KEY);
  } catch {
  }
}

export function getInitialPreferBareTerminal(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return readPreferBareTerminal();
  } catch {
    return false;
  }
}
