export async function getLastFmArtistBio(artist: string) {
  if (!process.env.LASTFM_API_KEY) {
    return "";
  }

  const params = new URLSearchParams({
    method: "artist.getinfo",
    artist,
    api_key: process.env.LASTFM_API_KEY,
    format: "json"
  });

  const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`, {
    next: { revalidate: 86_400 }
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as { artist?: { bio?: { summary?: string } } };
  return data.artist?.bio?.summary?.replace(/<[^>]+>/g, "") || "";
}
