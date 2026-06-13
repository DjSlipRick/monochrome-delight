/**
 * src/lib/hybridGenerator.ts
 * Hybrid playlist generator using public MusicBrainz lookup and client-side audio analysis.
 * No paid services required.
 */

type Track = {
  id: string;
  title?: string;
  artist?: string;
  duration?: number;
  source?: string; // 'own' | 'deezer' | 'qobuz' | ...
  url?: string; // optional audio URL for own tracks
  bpm?: number;
  energy?: number; // 0..1
  genre?: string | null;
  [k: string]: any;
};

type Features = {
  bpm: number;
  energy: number;
  genre?: string | null;
  source?: string;
};

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

async function musicBrainzLookup(artist?: string, title?: string): Promise<Partial<Features> | null> {
  if (!artist && !title) return null;
  try {
    const qParts: string[] = [];
    if (title) qParts.push(`recording:"${encodeURIComponent(title)}"`);
    if (artist) qParts.push(`artist:"${encodeURIComponent(artist)}"`);
    const q = qParts.join(' AND ');
    const url = `https://musicbrainz.org/ws/2/recording/?query=${q}&fmt=json&limit=3`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.recordings || json.recordings.length === 0) return null;
    const rec = json.recordings[0];
    const genre = (rec['tags'] && rec['tags'][0] && rec['tags'][0].name) || null;
    return { genre };
  } catch (err) {
    console.warn('MusicBrainz lookup failed', err);
    return null;
  }
}

async function fetchAudioBuffer(url: string): Promise<AudioBuffer | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 44100 * 30, 44100);
    return await ctx.decodeAudioData(ab);
  } catch (err) {
    console.warn('fetchAudioBuffer failed', err);
    return null;
  }
}

function computeRMS(frame: Float32Array) {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

function estimateEnergyFromBuffer(buf: AudioBuffer) {
  const channel = buf.getChannelData(0);
  const frameSize = 1024;
  const energies: number[] = [];
  for (let i = 0; i < channel.length; i += frameSize) {
    const frame = channel.subarray(i, Math.min(i + frameSize, channel.length));
    energies.push(computeRMS(frame));
  }
  const max = Math.max(...energies, 1e-9);
  const norm = energies.map(e => e / max);
  const mean = norm.reduce((a, b) => a + b, 0) / norm.length;
  return clamp01(mean);
}

function autoCorrelationTempo(onsetEnv: Float32Array, sampleRate: number) {
  const n = onsetEnv.length;
  const ac = new Float32Array(n);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) sum += onsetEnv[i] * onsetEnv[i + lag];
    ac[lag] = sum;
  }
  const minBpm = 60, maxBpm = 180;
  const minLag = Math.floor((60 / maxBpm) * sampleRate);
  const maxLag = Math.ceil((60 / minBpm) * sampleRate);
  let bestLag = minLag;
  let bestVal = -Infinity;
  for (let lag = minLag; lag <= Math.min(maxLag, n - 1); lag++) {
    if (ac[lag] > bestVal) { bestVal = ac[lag]; bestLag = lag; }
  }
  const bpm = 60 * sampleRate / bestLag;
  if (!isFinite(bpm) || bpm <= 0) return null;
  return Math.round(bpm);
}

function buildOnsetEnvelope(buf: AudioBuffer) {
  const channel = buf.getChannelData(0);
  const frameSize = 1024;
  const hop = 512;
  const env: number[] = [];
  let prev = 0;
  for (let i = 0; i + frameSize <= channel.length; i += hop) {
    const frame = channel.subarray(i, i + frameSize);
    const rms = computeRMS(frame);
    env.push(Math.max(0, rms - prev));
    prev = rms;
  }
  return new Float32Array(env);
}

async function estimateBpmFromBuffer(buf: AudioBuffer) {
  try {
    const onset = buildOnsetEnvelope(buf);
    if (onset.length < 10) return null;
    const framesPerSec = buf.sampleRate / 512;
    const bpm = autoCorrelationTempo(onset, framesPerSec);
    return bpm;
  } catch (err) {
    console.warn('estimateBpmFromBuffer failed', err);
    return null;
  }
}

async function analyzeAudio(url: string): Promise<Partial<Features> | null> {
  const buf = await fetchAudioBuffer(url);
  if (!buf) return null;
  const energy = estimateEnergyFromBuffer(buf);
  const bpm = await estimateBpmFromBuffer(buf);
  return { bpm: bpm ?? undefined, energy: energy ?? undefined };
}

async function resolveFeatures(track: Track): Promise<Features> {
  const defaults: Features = { bpm: 120, energy: 0.5, genre: track.genre ?? null, source: track.source };
  if (typeof track.bpm === 'number' && typeof track.energy === 'number') {
    return { bpm: track.bpm, energy: track.energy, genre: track.genre ?? null, source: track.source };
  }
  const mb = await musicBrainzLookup(track.artist, track.title);
  if (mb && mb.genre && !track.genre) defaults.genre = mb.genre;
  if (track.url) {
    const a = await analyzeAudio(track.url);
    if (a) {
      if (a.bpm) defaults.bpm = a.bpm;
      if (typeof a.energy === 'number') defaults.energy = a.energy;
    }
  }
  return { bpm: Math.round(defaults.bpm), energy: clamp01(defaults.energy), genre: defaults.genre ?? null, source: track.source };
}

function normalizeFeatureValues(tracks: Features[]) {
  const bpms = tracks.map(t => t.bpm || 120);
  const energies = tracks.map(t => t.energy || 0.5);
  const minB = Math.min(...bpms), maxB = Math.max(...bpms);
  const minE = Math.min(...energies), maxE = Math.max(...energies);
  return tracks.map(t => ({
    bpm: (t.bpm - minB) / Math.max(1, (maxB - minB)),
    energy: (t.energy - minE) / Math.max(1e-6, (maxE - minE)),
    genre: t.genre ?? null,
    source: t.source
  }));
}

function similarityScore(a: {bpm:number, energy:number, genre?:string|null}, b: {bpm:number, energy:number, genre?:string|null}) {
  const wBpm = 0.6;
  const wEnergy = 0.3;
  const wGenre = 0.1;
  const db = Math.abs(a.bpm - b.bpm);
  const de = Math.abs(a.energy - b.energy);
  const genreMatch = (a.genre && b.genre && a.genre.toLowerCase() === b.genre.toLowerCase()) ? 1 : 0;
  const sim = (wBpm * (1 - db)) + (wEnergy * (1 - de)) + (wGenre * genreMatch);
  return sim;
}

export async function generateHybridPlaylist(allTracks: Track[], opts: { limit?: number; preferOwn?: boolean } = {}) {
  const limit = opts.limit ?? 50;
  const own = allTracks.filter(t => t.source === 'own');
  const ext = allTracks.filter(t => t.source !== 'own');

  if (own.length === 0) return [];

  const seed = own[Math.floor(Math.random() * own.length)];

  const candidates = allTracks.slice();
  const featuresMap = new Map<string, Features>();

  for (const t of candidates) {
    try {
      const f = await resolveFeatures(t);
      featuresMap.set(t.id, f);
    } catch (err) {
      console.warn('resolveFeatures error for', t.id, err);
      featuresMap.set(t.id, { bpm: 120, energy: 0.5, genre: t.genre ?? null, source: t.source });
    }
  }

  const featureList = Array.from(featuresMap.values());
  const normalized = normalizeFeatureValues(featureList);

  const idToNorm = new Map<string, {bpm:number, energy:number, genre?:string|null, source?:string}>();
  let idx = 0;
  for (const [id, f] of featuresMap.entries()) {
    const n = normalized[idx++];
    idToNorm.set(id, { bpm: n.bpm, energy: n.energy, genre: f.genre ?? null, source: f.source });
  }

  const seedNorm = idToNorm.get(seed.id)!;

  const scored = candidates.map(t => {
    const n = idToNorm.get(t.id)!;
    const sim = similarityScore(seedNorm, n);
    return { track: t, sim };
  });

  const scoredOwn = scored.filter(s => s.track.source === 'own').sort((a,b) => b.sim - a.sim);
  const scoredExt = scored.filter(s => s.track.source !== 'own').sort((a,b) => b.sim - a.sim);

  const ownCount = Math.ceil(limit * 0.75);
  const extCount = Math.max(0, limit - ownCount);

  const selected: Track[] = [];
  const artistCount = new Map<string, number>();

  function pushIfAllowed(t: Track) {
    const artist = (t.artist || 'unknown').toLowerCase();
    const cnt = artistCount.get(artist) || 0;
    if (cnt >= 2) return false;
    artistCount.set(artist, cnt + 1);
    selected.push(t);
    return true;
  }

  for (const s of scoredOwn) {
    if (selected.length >= ownCount) break;
    pushIfAllowed(s.track);
  }

  for (const s of scoredExt) {
    if (selected.length >= limit) break;
    pushIfAllowed(s.track);
  }

  if (selected.length < limit) {
    for (const s of scoredOwn) {
      if (selected.length >= limit) break;
      if (!selected.includes(s.track)) pushIfAllowed(s.track);
    }
  }
  if (selected.length < limit) {
    for (const s of scoredExt) {
      if (selected.length >= limit) break;
      if (!selected.includes(s.track)) pushIfAllowed(s.track);
    }
  }

  return selected.map(t => ({ ...t, _hybridSeedId: seed.id }));
}
