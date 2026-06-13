import { generateHybridPlaylist } from '../lib/hybridGenerator';
import { fetchOwnTracks } from '../services/ownTracks';

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

async function getAllTracksFromApp(): Promise<Track[]> {
  try {
    // 1) primary: use service that holds own tracks
    try {
      const own = await fetchOwnTracks();
      if (Array.isArray(own) && own.length > 0) {
        console.debug('[hybridModal] fetched own tracks via fetchOwnTracks()', own.length);
        // ensure source field exists
        return own.map((t: any) => ({ ...t, source: t.source || 'own' }));
      }
      console.debug('[hybridModal] fetchOwnTracks returned empty or non-array');
    } catch (e) {
      console.debug('[hybridModal] fetchOwnTracks failed', e);
    }

    // 2) try common dev helper
    if ((window as any).__ALL_TRACKS__ && Array.isArray((window as any).__ALL_TRACKS__)) {
      console.debug('[hybridModal] found tracks in window.__ALL_TRACKS__', (window as any).__ALL_TRACKS__.length);
      return (window as any).__ALL_TRACKS__;
    }

    // 3) try /api/tracks fallback
    try {
      const resp = await fetch('/api/tracks');
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          console.debug('[hybridModal] loaded tracks from /api/tracks', json.length);
          return json;
        }
      } else {
        console.debug('[hybridModal] /api/tracks returned non-ok', resp.status);
      }
    } catch (e) {
      console.debug('[hybridModal] /api/tracks fetch failed', e);
    }

    // 4) heuristic scan of window globals
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
  console.debug('[hybridModal] no tracks found in app globals or API');
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
    const allTracks = await getAllTracksFromApp();
    console.debug('[hybridModal] allTracks length', allTracks.length);

    const playlist = await generateHybridPlaylist(allTracks, opts);
    renderList(modal, playlist);
  } catch (err) {
    modal.innerHTML = 'Error generating playlist — check console';
    console.error('hybrid modal error', err);
  }
}
