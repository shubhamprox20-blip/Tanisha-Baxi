import rateLimit from "express-rate-limit";

const jsonMessage = (message: string) => ({ status: "error", message });

/** Tight limit on auth endpoints to blunt credential-stuffing / brute force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many attempts. Please try again in a few minutes."),
});

/** Limit on order/payment creation to prevent abuse. */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please slow down."),
});

/** Broad limit applied to the whole API as a safety net. */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage("Too many requests. Please slow down."),
});
