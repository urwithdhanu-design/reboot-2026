export function getSimAction(search: string): string | null {
  return new URLSearchParams(search).get('sim');
}

export function getSimParam(search: string, key: string): string | null {
  return new URLSearchParams(search).get(key);
}

export function stripSimParams(pathname: string, search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const keys = [...params.keys()];
  for (const key of keys) {
    if (key === 'sim' || key.startsWith('sim')) {
      params.delete(key);
    }
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
