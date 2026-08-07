import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const NewsPostSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    artistName: { type: String, required: true, trim: true, index: true },
    artistKey: { type: String, required: true, index: true },
    platform: {
      type: String,
      enum: ["instagram", "facebook", "threads", "twitter"],
      required: true,
      index: true,
    },
    externalId: { type: String, required: true },
    text: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    permalink: { type: String, required: true },
    authorHandle: { type: String, default: "" },
    postedAt: { type: String, required: true, index: true },
    fetchedAt: { type: String, required: true },
  },
  { versionKey: false },
);

NewsPostSchema.index({ platform: 1, externalId: 1 }, { unique: true });

export type NewsPostDocument = InferSchemaType<typeof NewsPostSchema>;

export const NewsPostModel: Model<NewsPostDocument> =
  (models.NewsPost as Model<NewsPostDocument>) ||
  model<NewsPostDocument>("NewsPost", NewsPostSchema);
