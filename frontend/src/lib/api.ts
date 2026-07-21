const BASE = import.meta.env.VITE_API_BASE ?? "";

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: isForm ? undefined : { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, "Unexpected server response.");
  }

  if (!res.ok || body.status === "error") {
    throw new ApiError(res.status, body.message || "Request failed.");
  }
  return body;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    }),
  put: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  del: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Absolute URL for an uploaded image path returned by the API (e.g. /uploads/x). */
export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${BASE}${path}`;
  return path;
}
