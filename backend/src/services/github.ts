
import { randomUUID } from "node:crypto";

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_IMAGE_REPO;
const token = process.env.GITHUB_TOKEN;

export async function uploadToGitHub(
  buffer: Buffer,
  originalName: string,
  hero = false,
): Promise<string> {
  if (!owner || !repo || !token) {
    throw new Error("GitHub image upload environment variables are missing.");
  }

  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";

  const allowedTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
  };

  if (!allowedTypes[ext]) {
    throw new Error(
      "Unsupported image format. Use JPG, PNG, WebP, GIF, or AVIF.",
    );
  }

  const folder = hero ? "hero" : "products";
  const fileName = `${randomUUID()}.${ext}`;
  const path = `${folder}/${fileName}`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${path}`,
        content: buffer.toString("base64"),
      }),
    },
  );

  const result = await response.json() as {
    message?: string;
    content?: {
      download_url?: string | null;
    } | null;
  };

  if (!response.ok) {
    throw new Error(
      `GitHub image upload failed (${response.status}): ${
        result.message || "Unknown GitHub API error"
      }`,
    );
  }

  const imageUrl = result.content?.download_url;

  if (!imageUrl) {
    throw new Error("GitHub uploaded the image but returned no download URL.");
  }

  return imageUrl;
}
