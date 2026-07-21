import type { AuthTokenPayload } from "../utils/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the auth middleware when a valid session cookie is present. */
      user?: AuthTokenPayload;
    }
  }
}

export {};
