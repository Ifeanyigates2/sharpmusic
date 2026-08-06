export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPrice(cents: number, currency = "USD"): string {
  if (cents <= 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function coverGradient(hue: number): string {
  const h2 = (hue + 42) % 360;
  return `linear-gradient(145deg, hsl(${hue} 55% 28%) 0%, hsl(${h2} 48% 14%) 55%, hsl(${hue} 30% 8%) 100%)`;
}
