import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const LifestyleVideoSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    videoUrl: { type: String, required: true },
    coverImageUrl: { type: String, default: "" },
    videoPublicId: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },
    createdAt: { type: String, required: true, index: true },
  },
  { versionKey: false },
);

export type LifestyleVideoDocument = InferSchemaType<typeof LifestyleVideoSchema>;

export const LifestyleVideoModel: Model<LifestyleVideoDocument> =
  (models.LifestyleVideo as Model<LifestyleVideoDocument>) ||
  model<LifestyleVideoDocument>("LifestyleVideo", LifestyleVideoSchema);
