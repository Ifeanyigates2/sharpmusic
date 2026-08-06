import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const TrackSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    genre: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true, default: "Worldwide" },
    durationSec: { type: Number, required: true, default: 180 },
    pricing: { type: String, enum: ["free", "paid"], required: true },
    priceCents: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "USD" },
    audioUrl: { type: String, required: true },
    coverImageUrl: { type: String, default: "" },
    coverHue: { type: Number, required: true, default: 0 },
    downloads: { type: Number, required: true, default: 0 },
    description: { type: String, required: true, default: "" },
    license: { type: String, required: true, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

export type TrackDocument = InferSchemaType<typeof TrackSchema>;

export const TrackModel: Model<TrackDocument> =
  (models.Track as Model<TrackDocument>) ||
  model<TrackDocument>("Track", TrackSchema);
