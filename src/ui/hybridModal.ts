import { generateHybridPlaylist } from '../lib/hybridGenerator';

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

export async function showHybridModal(opts: { limit?: number; preferOwn?: boolean } = {}) {
  let modal = document.getElementById('hybrid-modal') as HTMLDivElement | null;
  if (!modal) {
    modal = createModal();
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
  modal.innerHTML = 'Generating…';
  try {
    const playlist = await generateHybridPlaylist([], opts);
    renderList(modal, playlist);
  } catch (err) {
    modal.innerHTML = 'Error generating playlist — check console';
    console.error('hybrid modal error', err);
  }
}
