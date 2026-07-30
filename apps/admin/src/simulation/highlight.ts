const HIGHLIGHT_CLASS = 'sim-highlight';

export function highlightElement(el: Element | null | undefined, durationMs = 9000) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.classList.add(HIGHLIGHT_CLASS);
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => el.classList.remove(HIGHLIGHT_CLASS), durationMs);
}

export function highlightSelector(selector: string, durationMs = 9000) {
  highlightElement(document.querySelector(selector), durationMs);
}

export async function smoothScrollPage(steps = 4, stepMs = 450) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;
  for (let i = 1; i <= steps; i++) {
    window.scrollTo({ top: (max * i) / steps, behavior: 'smooth' });
    await new Promise((r) => window.setTimeout(r, stepMs));
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
