import { generateHybridPlaylist } from '../lib/hybridGenerator';

type Track = { id: string; title?: string; artist?: string; source?: string; url?: string; [k:string]: any };

function createModal(): HTMLDivElement {
  const modal = document.createElement('div');
  modal.id = 'hybrid-modal';
  modal.style.position = 'fixed';
  modal.style.left = '50%';
  modal.style.top = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.minWidth = '320px';
  modal.style.maxWidth = '90vw';
  modal.style.maxHeight = '70vh';
  modal.style.overflow = 'auto';
  modal.style.background = '#fff';
  modal.style.color = '#111';
  modal.style.borderRadius = '10px';
  modal.style.boxShadow = '0 10px 40px rgba(0,0,0,0.35)';
  modal.style.padding = '12px';
  modal.style.zIndex = '100000';
  modal.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial';
  modal.style.display = 'none';
  return modal;
}

function renderList(container: HTMLElement, tracks: any[]) {
  container.innerHTML = '';
  const title = document.createElement('div');
  title.textContent = `Hybrid playlist — ${tracks.length} tracks`;
  title.style.fontWeight = '600';
  title.style.marginBottom = '8px';
  container.appendChild(title);

  const list = document.createElement('ol');
  list.style.paddingLeft = '18px';
  list.style.margin = '0';
  tracks.forEach(t => {
    const li = document.createElement('li');
    li.style.marginBottom = '6px';
    li.textContent = `${t.title || 'Untitled'} — ${t.artist || 'Unknown'} (${t.source || 'unknown'})`;
    list.appendChild(li);
  });
  container.appendChild(list);

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.style.marginTop = '10px';
  close.style.padding = '6px 10px';
  close.style.border = 'none';
  close.style.background = '#0b74de';
  close.style.color = '#fff';
  close.style.borderRadius = '6px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => (container.style.display = 'none'));
  container.appendChild(close);
}

/**
 * Probeer de tracklijst uit meerdere plekken te halen.
 * - window.__ALL_TRACKS__ (dev helper)
 * - window.app?.state?.tracks of window.app?.tracks
 * - window.store?.tracks
 * - window.__STORE__ (varianten)
 * Als niets gevonden wordt, return [].
 */
async function getAllTracksFromApp(): Promise<Track[]> {
  try {
    // common dev helper
    if ((window as any).__ALL_TRACKS__ && Array.isArray((window as any).__ALL_TRACKS__)) {
      console.debug('[hybridModal] found tracks in window.__ALL_TRACKS__', (window as any).__ALL_TRACKS__.length);
      return (window as any).__ALL_TRACKS__;
    }

    // try common app namespaces
    const candidates = [
      (window as any).app?.state?.tracks,
      (window as any).app?.tracks,
      (window as any).store?.tracks,
      (window as any).__STORE__?.tracks,
      (window as any).__TRACKS__,
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) {
        console.debug('[hybridModal] found tracks in candidate', c.length);
        return c;
      }
    }

    // try to find a global variable that looks like tracks (best-effort)
    for (const k of Object.keys(window as any)) {
      try {
        const v = (window as any)[k];
        if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && ('id' in v[0] || 'title' in v[0])) {
          console.debug('[hybridModal] heuristically found tracks in window.' + k, v.length);
          return v;
        }
      } catch (e) { /* ignore */ }
    }
  } catch (err) {
    console.warn('[hybridModal] getAllTracksFromApp error', err);
  }
  console.debug('[hybridModal] no tracks found in app globals');
  return [];
}

export async function showHybridModal(opts: { limit?: number; preferOwn?: boolean } = {}) {
  let modal = document.getElementById('hybrid-modal') as HTMLDivElement | null;
  if (!modal) {
    modal = createModal();
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
  modal.innerHTML = 'Generating…';
  try {
    // haal tracks uit de app (niet meer hardcoded [])
    const allTracks = await getAllTracksFromApp();
    console.debug('[hybridModal] allTracks length', allTracks.length);

    // fallback: als app geen tracks exposeert, probeer een fetch naar een mogelijke API endpoint
    let tracksToUse = allTracks;
    if (tracksToUse.length === 0) {
      try {
        const resp = await fetch('/api/tracks');
        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json)) {
            tracksToUse = json;
            console.debug('[hybridModal] loaded tracks from /api/tracks', tracksToUse.length);
          }
        }
      } catch (e) {
        console.debug('[hybridModal] /api/tracks fetch failed', e);
      }
    }

    const playlist = await generateHybridPlaylist(tracksToUse, opts);
    renderList(modal, playlist);
  } catch (err) {
    modal.innerHTML = 'Error generating playlist — check console';
    console.error('hybrid modal error', err);
  }
}
