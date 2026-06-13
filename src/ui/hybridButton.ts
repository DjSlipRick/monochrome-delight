import { generateHybridPlaylist } from '../lib/hybridGenerator';

type Opts = { limit?: number; preferOwn?: boolean };

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'hybrid-overlay';
  overlay.style.position = 'fixed';
  overlay.style.right = '16px';
  overlay.style.bottom = '80px';
  overlay.style.padding = '8px 12px';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  overlay.style.color = '#fff';
  overlay.style.borderRadius = '8px';
  overlay.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'none';
  overlay.style.fontSize = '13px';
  return overlay;
}

function createButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = 'hybrid-gen-btn';
  btn.textContent = 'Generate Hybrid';
  btn.style.position = 'fixed';
  btn.style.right = '16px';
  btn.style.bottom = '16px';
  btn.style.padding = '10px 14px';
  btn.style.background = '#0b74de';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '999px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 6px 18px rgba(11,116,222,0.18)';
  btn.style.zIndex = '99999';
  btn.style.fontFamily = 'inherit';
  btn.style.fontSize = '14px';
  return btn;
}

async function onClick(overlay: HTMLDivElement, opts: Opts = {}) {
  try {
    overlay.style.display = 'block';
    overlay.textContent = 'Generating…';
    const hybrid = await generateHybridPlaylist([], opts);
    console.log('hybrid playlist', hybrid);
    overlay.textContent = `Hybrid playlist generated — ${hybrid.length} tracks`;
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 3500);
  } catch (err) {
    console.error('hybrid generator error', err);
    overlay.style.display = 'block';
    overlay.textContent = 'hybrid generator error — see console';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 3500);
  }
}

export function mountHybridButton() {
  if (document.getElementById('hybrid-gen-btn')) return;
  const btn = createButton();
  const overlay = createOverlay();
  document.body.appendChild(overlay);
  document.body.appendChild(btn);
  btn.addEventListener('click', () => onClick(overlay, { limit: 50, preferOwn: false }));
}
