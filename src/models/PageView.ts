import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const PageViewSchema = new Schema(
  {
    visitorId: { type: String, required: true, index: true },
    path: { type: String, required: true, default: "/" },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { versionKey: false },
);

PageViewSchema.index({ createdAt: 1, visitorId: 1 });

export type PageViewDocument = InferSchemaType<typeof PageViewSchema>;

export const PageViewModel: Model<PageViewDocument> =
  (models.PageView as Model<PageViewDocument>) ||
  model<PageViewDocument>("PageView", PageViewSchema);
