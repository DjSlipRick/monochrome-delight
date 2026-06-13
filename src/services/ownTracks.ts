import type { UnifiedTrack } from '../models/unifiedTrack';

export async function fetchOwnTracks(): Promise<UnifiedTrack[]> {
  // Mock dataset; later replace with real cloud API
  return [
    {
      id: 'own:1',
      title: 'Own Track 1',
      artist: 'Slip',
      duration: 210,
      source: 'own',
      streamUrl: '/local/own-1.mp3',
      artworkUrl: '/local/own-1.jpg',
      bpm: 120,
      genre: 'house',
      energy: 0.8,
      addedAt: new Date().toISOString(),
      metadata: { note: 'mock track 1' }
    },
    {
      id: 'own:2',
      title: 'Own Track 2',
      artist: 'Slip',
      duration: 185,
      source: 'own',
      streamUrl: '/local/own-2.mp3',
      artworkUrl: '/local/own-2.jpg',
      bpm: 128,
      genre: 'techno',
      energy: 0.9,
      addedAt: new Date().toISOString(),
      metadata: { note: 'mock track 2' }
    }
  ];
}
