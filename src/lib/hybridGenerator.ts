import type { UnifiedTrack } from '../models/unifiedTrack';
import { fetchOwnTracks } from '../services/ownTracks';

export type HybridOptions = {
  /** maximum number of tracks in the generated playlist */
  limit?: number;
  /** if true, prefer own tracks first */
  preferOwn?: boolean;
};

/**
 * Simple interleave strategy:
 * - fetch own tracks (mock)
 * - accept an array of external tracks (optional)
 * - produce a hybrid playlist by interleaving own and external tracks
 * - deduplicate by id and respect the requested limit
 */
export async function generateHybridPlaylist(
  externalTracks: UnifiedTrack[] = [],
  opts: HybridOptions = {}
): Promise<UnifiedTrack[]> {
  const { limit = 50, preferOwn = false } = opts;

  // fetch own tracks (mock)
  const own = await fetchOwnTracks();

  // quick dedupe helper preserving first occurrence
  const seen = new Set<string>();
  const pushIfNew = (out: UnifiedTrack[], t: UnifiedTrack) => {
    if (!t || !t.id) return;
    if (seen.has(t.id)) return;
    seen.add(t.id);
    out.push(t);
  };

  const result: UnifiedTrack[] = [];

  // If preferOwn, start with own array, else start with external
  const a = preferOwn ? own : externalTracks;
  const b = preferOwn ? externalTracks : own;

  // interleave
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen && result.length < limit; i++) {
    if (i < a.length) pushIfNew(result, a[i]);
    if (result.length >= limit) break;
    if (i < b.length) pushIfNew(result, b[i]);
  }

  // if still under limit, append remaining unique items from both lists
  if (result.length < limit) {
    for (const t of [...a, ...b]) {
      if (result.length >= limit) break;
      pushIfNew(result, t);
    }
  }

  return result.slice(0, limit);
}
