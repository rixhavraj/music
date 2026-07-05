export async function getCoverArtUrl(releaseId?: string) {
  if (!releaseId) {
    return null;
  }

  return `https://coverartarchive.org/release/${releaseId}/front-500`;
}
