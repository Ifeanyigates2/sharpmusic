export type SongRequestStatus =
  | "pending"
  | "reviewing"
  | "added"
  | "declined";

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  genre: string;
  link: string;
  notes: string;
  email: string;
  status: SongRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SongRequestInput {
  title: string;
  artist: string;
  genre?: string;
  link?: string;
  notes?: string;
  email?: string;
}

export const SONG_REQUEST_STATUSES: SongRequestStatus[] = [
  "pending",
  "reviewing",
  "added",
  "declined",
];
