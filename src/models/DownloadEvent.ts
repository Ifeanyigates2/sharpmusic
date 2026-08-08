import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const DownloadEventSchema = new Schema(
  {
    trackId: { type: String, required: true, index: true },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { versionKey: false },
);

DownloadEventSchema.index({ createdAt: -1, trackId: 1 });

export type DownloadEventDocument = InferSchemaType<typeof DownloadEventSchema>;

export const DownloadEventModel: Model<DownloadEventDocument> =
  (models.DownloadEvent as Model<DownloadEventDocument>) ||
  model<DownloadEventDocument>("DownloadEvent", DownloadEventSchema);
