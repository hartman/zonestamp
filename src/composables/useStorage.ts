export function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

export function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
}
