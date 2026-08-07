import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const ArtistProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true, unique: true, index: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    threads: { type: String, default: "", trim: true },
    twitter: { type: String, default: "", trim: true },
    lastSyncedAt: { type: String, default: "" },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

export type ArtistProfileDocument = InferSchemaType<typeof ArtistProfileSchema>;

export const ArtistProfileModel: Model<ArtistProfileDocument> =
  (models.ArtistProfile as Model<ArtistProfileDocument>) ||
  model<ArtistProfileDocument>("ArtistProfile", ArtistProfileSchema);
