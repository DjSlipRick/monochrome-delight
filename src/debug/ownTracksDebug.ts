import { fetchOwnTracks } from '../services/ownTracks';

(async () => {
  try {
    const tracks = await fetchOwnTracks();
    console.log('own tracks', tracks);
  } catch (err) {
    console.error('ownTracks error', err);
  }
})();
