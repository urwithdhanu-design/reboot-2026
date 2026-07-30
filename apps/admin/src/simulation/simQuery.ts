export function getSimAction(search: string): string | null {
  return new URLSearchParams(search).get('sim');
}

export function getSimParam(search: string, key: string): string | null {
  return new URLSearchParams(search).get(key);
}
