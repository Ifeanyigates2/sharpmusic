import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const SongRequestSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    genre: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "reviewing", "added", "declined"],
      required: true,
      default: "pending",
      index: true,
    },
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

export type SongRequestDocument = InferSchemaType<typeof SongRequestSchema>;

export const SongRequestModel: Model<SongRequestDocument> =
  (models.SongRequest as Model<SongRequestDocument>) ||
  model<SongRequestDocument>("SongRequest", SongRequestSchema);
