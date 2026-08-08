import { NextResponse } from "next/server";
import { getPlaylists } from "@/lib/playlists-server";
import {
  MAX_PLAYLIST_NAME,
  MAX_PLAYLIST_TRACKS,
  MAX_PLAYLISTS,
  playlistsCookieOptions,
  playlistsCookieValue,
  type Playlist,
} from "@/lib/playlists";
import { getTrackById } from "@/lib/store";

export const runtime = "nodejs";

function save(playlists: Playlist[]) {
  const res = NextResponse.json({ playlists });
  const opts = playlistsCookieOptions(playlistsCookieValue(playlists));
  res.cookies.set(opts.name, opts.value, opts);
  return res;
}

export async function GET() {
  return NextResponse.json({ playlists: await getPlaylists() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      trackId?: string;
    };
    const name = String(body.name || "").trim().slice(0, MAX_PLAYLIST_NAME);
    if (!name) {
      return NextResponse.json({ error: "Playlist name required" }, { status: 400 });
    }

    const playlists = await getPlaylists();
    if (playlists.length >= MAX_PLAYLISTS) {
      return NextResponse.json(
        { error: `You can have up to ${MAX_PLAYLISTS} playlists.` },
        { status: 400 },
      );
    }

    const trackIds: string[] = [];
    const trackId = String(body.trackId || "").trim();
    if (trackId) {
      const track = await getTrackById(trackId);
      if (!track) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 });
      }
      trackIds.push(trackId);
    }

    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      trackIds,
      updatedAt: new Date().toISOString(),
    };
    playlists.unshift(playlist);
    return save(playlists);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      playlistId?: string;
      name?: string;
      trackId?: string;
      action?: "add" | "remove" | "rename";
    };
    const playlistId = String(body.playlistId || "").trim();
    if (!playlistId) {
      return NextResponse.json({ error: "playlistId required" }, { status: 400 });
    }

    const playlists = await getPlaylists();
    const idx = playlists.findIndex((p) => p.id === playlistId);
    if (idx < 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = { ...playlists[idx] };
    const action = body.action || (body.name ? "rename" : "add");

    if (action === "rename") {
      const name = String(body.name || "").trim().slice(0, MAX_PLAYLIST_NAME);
      if (!name) {
        return NextResponse.json({ error: "Name required" }, { status: 400 });
      }
      playlist.name = name;
    } else {
      const trackId = String(body.trackId || "").trim();
      if (!trackId) {
        return NextResponse.json({ error: "trackId required" }, { status: 400 });
      }
      if (action === "add") {
        const track = await getTrackById(trackId);
        if (!track) {
          return NextResponse.json({ error: "Track not found" }, { status: 404 });
        }
        if (!playlist.trackIds.includes(trackId)) {
          if (playlist.trackIds.length >= MAX_PLAYLIST_TRACKS) {
            return NextResponse.json(
              { error: `Playlists can hold up to ${MAX_PLAYLIST_TRACKS} tracks.` },
              { status: 400 },
            );
          }
          playlist.trackIds = [trackId, ...playlist.trackIds];
        }
      } else if (action === "remove") {
        playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      }
    }

    playlist.updatedAt = new Date().toISOString();
    playlists[idx] = playlist;
    return save(playlists);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { playlistId?: string };
    const playlistId = String(body.playlistId || "").trim();
    if (!playlistId) {
      return NextResponse.json({ error: "playlistId required" }, { status: 400 });
    }
    const playlists = (await getPlaylists()).filter((p) => p.id !== playlistId);
    return save(playlists);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
