export type TrackSource = 'qobuz' | 'deezer' | 'amazon' | 'local' | 'own' | 'unknown';

export interface UnifiedTrack {
  id: string;                 // unieke id binnen de app, bijv. "qobuz:12345" of "own:abcd"
  title: string;
  artist: string;
  duration: number;           // seconden
  source: TrackSource;
  streamUrl: string;         // directe stream URL of jouw worker proxy URL
  artworkUrl?: string;
  bpm?: number;
  genre?: string;
  energy?: number;           // 0..1
  addedAt?: string;          // ISO timestamp
  metadata?: Record<string, any>; // extensible bag for provider specific fields
}
