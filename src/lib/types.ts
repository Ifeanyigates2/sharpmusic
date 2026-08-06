export type Pricing = "free" | "paid";

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  region: string;
  country: string;
  durationSec: number;
  pricing: Pricing;
  priceCents: number;
  currency: string;
  audioUrl: string;
  coverImageUrl?: string;
  coverHue: number;
  downloads: number;
  description: string;
  license: string;
  createdAt: string;
}

export interface TrackInput {
  title: string;
  artist: string;
  genre: string;
  region: string;
  country: string;
  pricing: Pricing;
  priceCents: number;
  description: string;
  license: string;
}

export const GENRES = [
  "Afrobeats",
  "Electronic",
  "Hip-Hop",
  "Jazz",
  "Latin",
  "Indie",
  "Ambient",
  "Folk",
  "R&B",
  "World",
] as const;

export const REGIONS = [
  "Africa",
  "Asia",
  "Europe",
  "Latin America",
  "Middle East",
  "North America",
  "Oceania",
] as const;
