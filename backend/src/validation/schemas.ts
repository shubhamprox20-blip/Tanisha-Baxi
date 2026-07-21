import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const registerSchema = z.object({
  first_name: trimmed(80),
  last_name: trimmed(80),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: trimmed(30),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  house: trimmed(120),
  street: trimmed(190),
  landmark: z.string().trim().max(190).optional().default(""),
  city: trimmed(120),
  state: trimmed(120),
  pincode: trimmed(20),
  country: z.string().trim().max(80).optional().default("India"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  first_name: trimmed(80),
  last_name: trimmed(80),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: trimmed(30),
  house: trimmed(120),
  street: trimmed(190),
  landmark: z.string().trim().max(190).optional().default(""),
  city: trimmed(120),
  state: trimmed(120),
  pincode: trimmed(20),
  country: z.string().trim().max(80).optional().default("India"),
  new_password: z.string().min(8).max(128).optional().or(z.literal("")),
  confirm_password: z.string().optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: trimmed(190),
  meta: trimmed(190),
  description: trimmed(4000),
  price: z.coerce.number().int().nonnegative(),
  filters: z.string().trim().min(1).max(190).transform((s) => s.toLowerCase()),
  img: trimmed(4000),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
});

export const cartItemSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(99).optional(),
});

export const favoriteSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});

export const appointmentSchema = z.object({
  client_name: trimmed(190),
  consultation_type: trimmed(120),
  appointment_date: trimmed(60),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
});

export const orderTrackSchema = z.object({
  order_id: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
});

export const createOrderSchema = z.object({
  // Optional: order a single product directly ("Buy now"); otherwise the whole cart.
  product_id: z.coerce.number().int().positive().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});
