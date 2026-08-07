/** Same-origin progressive stream URL for a catalog track. */
export function trackStreamUrl(id: string) {
  return `/api/stream/${encodeURIComponent(id)}`;
}
