# sharpmusic.com

A worldwide music download webapp — browse a free library, buy paid tracks, and download music. Built with Next.js for Vercel.

## Features

- **Browse & search** by genre, region, and free/paid
- **Stream previews** with a global audio player
- **Download MP3s** (free instantly; paid after demo checkout)
- **Admin-only uploads** (audio on Cloudinary, accounts/tracks in MongoDB)
- **Marketplace stub** ready to swap for Stripe

## Quick start

```bash
cp .env.example .env.local
# set MONGODB_URI, SESSION_SECRET, ADMIN_*, CLOUDINARY_*
npm install
npm run seed:admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin upload: [http://localhost:3000/admin](http://localhost:3000/admin)

## MongoDB admin accounts

1. Set `MONGODB_URI` and `SESSION_SECRET` in `.env.local`.
2. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then run `npm run seed:admin`.
3. Sign in at `/admin`.

Only signed-in admins can upload.

## Cloudinary audio storage

Uploads go directly to Cloudinary (up to **100MB** per file). Metadata is saved in MongoDB.

Required env vars:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import in [Vercel](https://vercel.com/new).
3. Add domain `sharpmusic.com`.
4. Set MongoDB, session, admin, and Cloudinary env vars.
5. Deploy.

## Stack

- Next.js 16 + TypeScript + Tailwind CSS 4
- MongoDB for admin accounts + track metadata
- Cloudinary for audio storage/delivery
