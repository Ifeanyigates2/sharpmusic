import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import type {
  LifestyleVideo,
  LifestyleVideoInput,
} from "@/lib/lifestyle-types";
import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { LifestyleVideoModel } from "@/models/LifestyleVideo";

type StoredLifestyleVideo = LifestyleVideo & {
  videoPublicId?: string;
  coverPublicId?: string;
};

function toVideo(doc: {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  coverImageUrl?: string;
  videoPublicId?: string;
  coverPublicId?: string;
  createdAt: string;
}): StoredLifestyleVideo {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || "",
    videoUrl: doc.videoUrl,
    coverImageUrl: doc.coverImageUrl || "",
    createdAt:
      typeof doc.createdAt === "string"
        ? doc.createdAt
        : new Date(doc.createdAt as Date).toISOString(),
    videoPublicId: doc.videoPublicId || "",
    coverPublicId: doc.coverPublicId || "",
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function listLifestyleVideos(): Promise<LifestyleVideo[]> {
  if (!isMongoConfigured()) return [];
  try {
    await connectMongo();
    const docs = await LifestyleVideoModel.find()
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => {
      const v = toVideo(doc as StoredLifestyleVideo);
      return {
        id: v.id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        coverImageUrl: v.coverImageUrl,
        createdAt: v.createdAt,
      };
    });
  } catch (error) {
    console.error("Failed to load lifestyle videos", error);
    return [];
  }
}

export async function getLifestyleVideoById(
  id: string,
): Promise<LifestyleVideo | undefined> {
  if (!isMongoConfigured()) return undefined;
  try {
    await connectMongo();
    const doc = await LifestyleVideoModel.findOne({ id }).lean();
    if (!doc) return undefined;
    const v = toVideo(doc as StoredLifestyleVideo);
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      videoUrl: v.videoUrl,
      coverImageUrl: v.coverImageUrl,
      createdAt: v.createdAt,
    };
  } catch (error) {
    console.error("Failed to load lifestyle video", error);
    return undefined;
  }
}

export async function createLifestyleVideo(
  input: LifestyleVideoInput,
  media: {
    videoUrl: string;
    videoPublicId?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
  },
): Promise<LifestyleVideo> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }
  if (!media.videoUrl.trim()) {
    throw new Error("Video URL is required");
  }

  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  const id = `life_${slugify(title)}_${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();
  const video: StoredLifestyleVideo = {
    id,
    title,
    description: input.description.trim(),
    videoUrl: media.videoUrl.trim(),
    coverImageUrl: media.coverImageUrl?.trim() || "",
    createdAt,
    videoPublicId: media.videoPublicId || "",
    coverPublicId: media.coverPublicId || "",
  };

  await connectMongo();
  await LifestyleVideoModel.create(video);

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl,
    coverImageUrl: video.coverImageUrl,
    createdAt: video.createdAt,
  };
}

export async function updateLifestyleVideo(
  id: string,
  input: LifestyleVideoInput,
  media?: {
    videoUrl?: string;
    videoPublicId?: string;
    coverImageUrl?: string;
    coverPublicId?: string;
    clearCover?: boolean;
  },
): Promise<LifestyleVideo> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  await connectMongo();
  const existingDoc = await LifestyleVideoModel.findOne({ id }).lean();
  if (!existingDoc) throw new Error("Lifestyle video not found");

  const existing = toVideo(existingDoc as StoredLifestyleVideo);
  let videoUrl = existing.videoUrl;
  let videoPublicId = existing.videoPublicId || "";
  let coverImageUrl = existing.coverImageUrl || "";
  let coverPublicId = existing.coverPublicId || "";

  if (media?.videoUrl) {
    if (videoPublicId) {
      await destroyCloudinaryAsset(videoPublicId, "video");
    }
    videoUrl = media.videoUrl;
    videoPublicId = media.videoPublicId || "";
  }

  if (media?.clearCover) {
    if (coverPublicId) {
      await destroyCloudinaryAsset(coverPublicId, "image");
    }
    coverImageUrl = "";
    coverPublicId = "";
  } else if (media?.coverImageUrl) {
    if (coverPublicId) {
      await destroyCloudinaryAsset(coverPublicId, "image");
    }
    coverImageUrl = media.coverImageUrl;
    coverPublicId = media.coverPublicId || "";
  }

  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  const next = {
    title,
    description: input.description.trim(),
    videoUrl,
    coverImageUrl,
    videoPublicId,
    coverPublicId,
  };

  await LifestyleVideoModel.updateOne({ id }, { $set: next });

  return {
    id,
    title: next.title,
    description: next.description,
    videoUrl: next.videoUrl,
    coverImageUrl: next.coverImageUrl,
    createdAt: existing.createdAt,
  };
}

export async function deleteLifestyleVideo(id: string): Promise<void> {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured");
  }

  await connectMongo();
  const existingDoc = await LifestyleVideoModel.findOne({ id }).lean();
  if (!existingDoc) throw new Error("Lifestyle video not found");

  const existing = toVideo(existingDoc as StoredLifestyleVideo);
  if (existing.videoPublicId) {
    await destroyCloudinaryAsset(existing.videoPublicId, "video");
  }
  if (existing.coverPublicId) {
    await destroyCloudinaryAsset(existing.coverPublicId, "image");
  }
  await LifestyleVideoModel.deleteOne({ id });
}
