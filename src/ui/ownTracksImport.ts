import { addOwnTrack } from '../services/ownTracks';

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const header = lines.shift()?.split(/\t|,/)?.map(h => h.trim().toLowerCase()) || [];
  return lines.map(line => {
    const cols = line.split(/\t|,/).map(c => c.trim());
    const obj: any = {};
    header.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

export function mountOwnTracksImport() {
  if (document.getElementById('own-import')) return;
  const root = document.createElement('div');
  root.id = 'own-import';
  root.style.position = 'fixed';
  root.style.left = '16px';
  root.style.top = '80px';
  root.style.width = '420px';
  root.style.background = '#fff';
  root.style.padding = '12px';
  root.style.borderRadius = '8px';
  root.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
  root.innerHTML = `
    <div style="font-weight:600;margin-bottom:8px">Import Own Tracks (CSV)</div>
    <textarea id="own-csv" placeholder="Paste CSV here" style="width:100%;height:140px"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button id="own-parse" style="background:#0b74de;color:#fff;padding:6px 10px;border-radius:6px;border:none;cursor:pointer">Parse & Preview</button>
      <button id="own-clear" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;cursor:pointer">Clear</button>
    </div>
    <div id="own-preview" style="margin-top:10px;max-height:220px;overflow:auto"></div>
  `;
  document.body.appendChild(root);

  const ta = root.querySelector('#own-csv') as HTMLTextAreaElement;
  const preview = root.querySelector('#own-preview') as HTMLDivElement;
  const parseBtn = root.querySelector('#own-parse') as HTMLButtonElement;
  const clearBtn = root.querySelector('#own-clear') as HTMLButtonElement;

  parseBtn.addEventListener('click', async () => {
    const txt = ta.value;
    if (!txt) { preview.innerHTML = '<i>No CSV pasted</i>'; return; }
    const rows = parseCsv(txt);
    preview.innerHTML = `<div style="font-size:13px;margin-bottom:6px">Found ${rows.length} rows</div>`;
    const ol = document.createElement('ol');
    rows.slice(0,200).forEach(r => {
      const li = document.createElement('li');
      const url = r['src'] || r['url'] || r['gbucloud'] || r['file'] || r['link'] || r['preview'] || r['file-url'] || r['file_url'] || r['file url'];
      const artist = r['artist'] || r['performer'] || r['uitvoerende'] || '';
      const title = r['title'] || r['naam'] || '';
      li.textContent = `${title} — ${artist} (${url ? 'has url' : 'no url'})`;
      ol.appendChild(li);
    });
    preview.appendChild(ol);

    if (!confirm(`Import ${rows.length} tracks into Own Tracks?`)) return;

    for (const r of rows) {
      const url = r['src'] || r['url'] || r['gbucloud'] || r['file'] || r['link'] || r['preview'];
      const artist = r['artist'] || r['performer'] || r['uitvoerende'] || 'Unknown';
      const title = r['title'] || r['naam'] || 'Untitled';
      const cover = r['cover'] || r['cover_id'] || r['albumcover'] || r['album_cover'] || '';
      await addOwnTrack({ title, artist, source: 'own', url, cover });
    }
    alert('Import finished');
  });

  clearBtn.addEventListener('click', () => {
    ta.value = '';
    preview.innerHTML = '';
  });
}
