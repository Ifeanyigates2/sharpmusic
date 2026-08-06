import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export function createUploadSignature(folder = "sharpmusic/audio") {
  const api = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    resource_type: "video",
  };
  const signature = api.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
    resourceType: params.resource_type,
  };
}

export async function uploadAudioToCloudinary(
  file: File,
  publicId?: string,
): Promise<{ url: string; durationSec: number; publicId: string }> {
  const api = getCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{
    secure_url: string;
    duration?: number;
    public_id: string;
  }>((resolve, reject) => {
    const stream = api.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "sharpmusic/audio",
        public_id: publicId,
        overwrite: false,
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploaded as {
          secure_url: string;
          duration?: number;
          public_id: string;
        });
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    durationSec: Math.round(result.duration || 180),
    publicId: result.public_id,
  };
}
