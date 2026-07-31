import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/** Upload a file buffer to Cloudinary and return the secure CDN URL. */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  hero = false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = originalName.split(".").pop() ?? "jpg";

    const uploadStream = cloudinary.uploader.upload_stream(
      hero
        ? {
            folder: "tanesha-baxi",
            public_id: "hero",
            overwrite: true,
            invalidate: true,
            resource_type: "image",
            format: ext,
          }
        : {
            folder: "tanesha-baxi",
            resource_type: "image",
            format: ext,
            use_filename: false,
            unique_filename: true,
          },

      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Cloudinary upload failed"));

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}
