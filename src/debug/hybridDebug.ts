import { generateHybridPlaylist } from '../lib/hybridGenerator';
import type { UnifiedTrack } from '../models/unifiedTrack';

const external: UnifiedTrack[] = [
  { id: 'ext:1', title: 'Ext 1', artist: 'Artist A', duration: 200, source: 'deezer', streamUrl: '', artworkUrl: '', bpm: 0, genre: '', energy: 0, addedAt: new Date().toISOString(), metadata: {} },
  { id: 'ext:2', title: 'Ext 2', artist: 'Artist B', duration: 240, source: 'qobuz', streamUrl: '', artworkUrl: '', bpm: 0, genre: '', energy: 0, addedAt: new Date().toISOString(), metadata: {} }
];

(async () => {
  try {
    const hybrid = await generateHybridPlaylist(external, { limit: 10, preferOwn: false });
    console.log('hybrid playlist', hybrid);
  } catch (err) {
    console.error('hybrid error', err);
  }
})();
