import { assetUrl } from "./api";

export interface ImageInfo {
  isUploaded: boolean;
  /** Resolved URL when uploaded. */
  url: string;
  /** CSS swatch class name when not an uploaded file (e.g. "cherry"). */
  cssClass: string;
}

/**
 * Mirrors the original storefront logic: a product `img` is either a
 * comma-separated list of uploaded image paths, or a colour swatch keyword
 * (e.g. "cherry", "gold2") that maps to a CSS-painted placeholder.
 */
export function getImageInfo(img: string): ImageInfo {
  const first = (img.split(",")[0] || "").trim();
  const isUploaded = first.includes(".") || first.startsWith("http") || first.startsWith("/");
  return {
    isUploaded,
    url: isUploaded ? assetUrl(first) : "",
    cssClass: isUploaded ? "" : first,
  };
}
