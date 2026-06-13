/**
 * src/ui/hybridSettings.ts
 * Small settings panel for hybrid generator (limit, preferOwn).
 */
type Settings = { limit: number; preferOwn: boolean };

const STORAGE_KEY = 'hybrid:settings';

function defaultSettings(): Settings {
  return { limit: 50, preferOwn: false };
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return JSON.parse(raw) as Settings;
  } catch {
    return defaultSettings();
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function mountHybridSettings(triggerEl?: HTMLElement) {
  if (document.getElementById('hybrid-settings')) return;
  const settings = loadSettings();

  const panel = document.createElement('div');
  panel.id = 'hybrid-settings';
  panel.style.position = 'fixed';
  panel.style.right = '16px';
  panel.style.bottom = '80px';
  panel.style.width = '260px';
  panel.style.background = '#fff';
  panel.style.color = '#111';
  panel.style.borderRadius = '10px';
  panel.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
  panel.style.padding = '12px';
  panel.style.zIndex = '100000';
  panel.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial';

  const title = document.createElement('div');
  title.textContent = 'Hybrid settings';
  title.style.fontWeight = '600';
  title.style.marginBottom = '8px';
  panel.appendChild(title);

  // limit input
  const limitRow = document.createElement('div');
  limitRow.style.display = 'flex';
  limitRow.style.alignItems = 'center';
  limitRow.style.justifyContent = 'space-between';
  limitRow.style.marginBottom = '8px';
  const limitLabel = document.createElement('label');
  limitLabel.textContent = 'Limit';
  const limitInput = document.createElement('input');
  limitInput.type = 'number';
  limitInput.min = '1';
  limitInput.max = '500';
  limitInput.value = String(settings.limit);
  limitInput.style.width = '80px';
  limitRow.appendChild(limitLabel);
  limitRow.appendChild(limitInput);
  panel.appendChild(limitRow);

  // preferOwn checkbox
  const prefRow = document.createElement('div');
  prefRow.style.display = 'flex';
  prefRow.style.alignItems = 'center';
  prefRow.style.justifyContent = 'space-between';
  prefRow.style.marginBottom = '10px';
  const prefLabel = document.createElement('label');
  prefLabel.textContent = 'Prefer own tracks';
  const prefInput = document.createElement('input');
  prefInput.type = 'checkbox';
  prefInput.checked = settings.preferOwn;
  prefRow.appendChild(prefLabel);
  prefRow.appendChild(prefInput);
  panel.appendChild(prefRow);

  // buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.justifyContent = 'flex-end';
  btnRow.style.gap = '8px';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.style.background = '#0b74de';
  saveBtn.style.color = '#fff';
  saveBtn.style.border = 'none';
  saveBtn.style.padding = '6px 10px';
  saveBtn.style.borderRadius = '6px';
  saveBtn.style.cursor = 'pointer';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.background = '#eee';
  closeBtn.style.border = 'none';
  closeBtn.style.padding = '6px 10px';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.cursor = 'pointer';

  btnRow.appendChild(closeBtn);
  btnRow.appendChild(saveBtn);
  panel.appendChild(btnRow);

  saveBtn.addEventListener('click', () => {
    const s: Settings = {
      limit: Math.max(1, Math.min(500, Number(limitInput.value) || 50)),
      preferOwn: prefInput.checked,
    };
    saveSettings(s);
    panel.style.display = 'none';
    // optional visual feedback
    const overlay = document.getElementById('hybrid-overlay') as HTMLDivElement | null;
    if (overlay) {
      overlay.style.display = 'block';
      overlay.textContent = `Settings saved — limit ${s.limit}, preferOwn ${s.preferOwn}`;
      setTimeout(() => (overlay.style.display = 'none'), 2000);
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.style.display = 'none';
  });

  document.body.appendChild(panel);
  panel.style.display = 'block';
  // optionally focus first input
  limitInput.focus();
}

export function getHybridSettings() {
  try {
    return JSON.parse(localStorage.getItem('hybrid:settings') || '{}');
  } catch {
    return { limit: 50, preferOwn: false };
  }
}
