// Tiny Web Audio synth: no audio files needed, so it works offline and in the single-file preview build.
export type SoundName = 'click' | 'primary' | 'danger' | 'nav' | 'success' | 'error';

const STORAGE_KEY = 'saristore:sound';
let ctx: AudioContext | null = null;
let enabled = readEnabled();
const listeners = new Set<(on: boolean) => void>();

function readEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC: typeof AudioContext | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Tone { freq: number; to?: number; start?: number; dur: number; type?: OscillatorType; gain?: number }

function play(tones: Tone[]) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (const t of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const s = now + (t.start ?? 0);
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, s);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, s + t.dur);
    const peak = t.gain ?? 0.08;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(peak, s + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, s + t.dur);
    osc.connect(g).connect(c.destination);
    osc.start(s);
    osc.stop(s + t.dur + 0.02);
  }
}

const SOUNDS: Record<SoundName, Tone[]> = {
  click: [{ freq: 700, to: 420, dur: 0.06, type: 'triangle', gain: 0.07 }],
  nav: [{ freq: 520, to: 380, dur: 0.05, type: 'sine', gain: 0.06 }],
  primary: [{ freq: 660, to: 880, dur: 0.07, type: 'triangle', gain: 0.08 }],
  danger: [{ freq: 300, to: 160, dur: 0.1, type: 'square', gain: 0.04 }],
  success: [
    { freq: 784, dur: 0.12, type: 'sine', gain: 0.08 },
    { freq: 1047, start: 0.09, dur: 0.18, type: 'sine', gain: 0.08 },
  ],
  error: [
    { freq: 220, dur: 0.14, type: 'sawtooth', gain: 0.045 },
    { freq: 165, start: 0.11, dur: 0.2, type: 'sawtooth', gain: 0.045 },
  ],
};

export function playSound(name: SoundName = 'click') {
  if (!enabled) return;
  try { play(SOUNDS[name]); } catch { /* audio is a nicety; never break the UI */ }
}

export const isSoundOn = () => enabled;

export function setSoundOn(on: boolean) {
  enabled = on;
  try { localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
  listeners.forEach((fn) => fn(on));
  if (on) playSound('click');
}

export function subscribeSound(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

const INTERACTIVE = 'button, a[href], [role="button"], [role="tab"], select, summary, input[type="checkbox"], input[type="radio"], input[type="file"], input[type="date"], label[for]';

function pickSound(el: HTMLElement): SoundName {
  if (el.closest('.btn-primary')) return 'primary';
  if (el.closest('.btn-danger') || el.closest('.text-danger, [aria-label="Delete"]')) return 'danger';
  if (el.closest('nav, a[href]')) return 'nav';
  return 'click';
}

/** One delegated listener gives every button, link and select in the app a click sound. */
export function installClickSounds(): () => void {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest<HTMLElement>(INTERACTIVE);
    if (!el) return;
    if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.dataset.silent !== undefined) return;
    playSound(pickSound(el));
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
