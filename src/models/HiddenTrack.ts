import { Schema, models, model, type Model } from "mongoose";

const HiddenTrackSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
  },
  { versionKey: false },
);

export const HiddenTrackModel: Model<{ id: string }> =
  (models.HiddenTrack as Model<{ id: string }>) ||
  model<{ id: string }>("HiddenTrack", HiddenTrackSchema);
