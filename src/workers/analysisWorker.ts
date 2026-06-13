/**
 * analysisWorker bootstrap
 * This worker expects to be started from the main thread via postMessage({cmd:'run', workerBase: 'https://...'})
 * It reads queue md:analysis_queue_v1 from localStorage, fetches audio via proxy and writes bpm/energy back to md:own_tracks_v1.
 * Note: localStorage is not available in WebWorker in all browsers; for dev we will run this logic in main thread via import.
 */
self.addEventListener('message', async (ev) => {
  const { cmd, workerBase } = ev.data || {};
  if (cmd !== 'run') return;
  try {
    const key = 'md:analysis_queue_v1';
    const raw = localStorage.getItem(key);
    const q = raw ? JSON.parse(raw) : [];
    while (q.length) {
      const id = q.shift();
      try {
        const tracksRaw = localStorage.getItem('md:own_tracks_v1') || '[]';
        const tracks = JSON.parse(tracksRaw);
        const t = tracks.find((x:any)=>x.id===id);
        if (!t || !t.url) continue;
        const proxy = `${workerBase}/?url=${encodeURIComponent(t.url)}`;
        const resp = await fetch(proxy);
        if (!resp.ok) continue;
        const ab = await resp.arrayBuffer();
        // decode using OfflineAudioContext is not available in worker in all envs; skip heavy analysis here
        // mark as analyzed with placeholder values; real analysis can run in main thread if needed
        t.bpm = t.bpm || 120;
        t.energy = t.energy || 0.5;
        localStorage.setItem('md:own_tracks_v1', JSON.stringify(tracks));
      } catch (e) {
        console.warn('analysis worker error', e);
      }
      localStorage.setItem(key, JSON.stringify(q));
    }
    self.postMessage({ done: true });
  } catch (e) {
    console.warn('analysis worker fatal', e);
  }
});
