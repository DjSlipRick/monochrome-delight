export type Track = {
  id: string;
  title?: string;
  artist?: string;
  duration?: number;
  source?: string;
  url?: string;
  cover?: string;
  bpm?: number;
  energy?: number;
  [k: string]: any;
};

const STORAGE_KEY = 'md:own_tracks_v1';

function uid(prefix = 'own') {
  return `${prefix}:${Math.random().toString(36).slice(2,9)}`;
}

export async function fetchOwnTracks(): Promise<Track[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Track[];
    return parsed.map(t => ({ ...t, source: t.source || 'own' }));
  } catch (e) {
    console.warn('fetchOwnTracks error', e);
    return [];
  }
}

export async function addOwnTrack(track: Partial<Track>): Promise<Track> {
  const list = await fetchOwnTracks();
  const t: Track = {
    id: track.id || uid(),
    title: track.title || 'Untitled',
    artist: track.artist || 'Unknown',
    duration: track.duration || 0,
    source: 'own',
    url: track.url,
    cover: track.cover,
    bpm: track.bpm,
    energy: track.energy,
    ...track
  };
  list.push(t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return t;
}

export async function addOwnTracksBulk(tracks: Partial<Track>[]) {
  for (const t of tracks) await addOwnTrack(t);
}

export async function clearOwnTracks(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}

export async function seedOwnTracksIfEmpty() {
  const existing = await fetchOwnTracks();
  if (existing.length > 0) return;
  const sample = [
    { id: uid('own'), title: 'Own Track 1', artist: 'Slip', duration: 210, source: 'own' },
    { id: uid('own'), title: 'Own Track 2', artist: 'Slip', duration: 185, source: 'own' }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
}
