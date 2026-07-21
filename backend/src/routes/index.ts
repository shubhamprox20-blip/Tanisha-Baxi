import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { authLimiter, paymentLimiter } from "../middleware/rateLimit.js";
import { uploadImage } from "../middleware/upload.js";
import * as auth from "../controllers/auth.controller.js";
import * as user from "../controllers/user.controller.js";
import * as products from "../controllers/products.controller.js";
import * as cart from "../controllers/cart.controller.js";
import * as favorites from "../controllers/favorites.controller.js";
import * as misc from "../controllers/misc.controller.js";
import * as admin from "../controllers/admin.controller.js";
import * as orders from "../controllers/orders.controller.js";
import * as schema from "../validation/schemas.js";

export const router = Router();

// Every route can read the current user (best-effort) for role-aware behavior.
router.use(attachUser);

router.get("/health", (_req, res) => res.json({ status: "success", message: "ok" }));

// ── Auth ──────────────────────────────────────────────────────────────────
router.post("/auth/register", authLimiter, validateBody(schema.registerSchema), asyncHandler(auth.register));
router.post("/auth/login", authLimiter, validateBody(schema.loginSchema), asyncHandler(auth.login));
router.post("/auth/logout", auth.logout);
router.get("/me", auth.me);

// ── Profile ────────────────────────────────────────────────────────────────
router.get("/profile", requireAuth, asyncHandler(user.getProfile));
router.post("/profile/update", requireAuth, validateBody(schema.profileUpdateSchema), asyncHandler(user.updateProfile));

// ── Products (public reads; admin-gated writes) ─────────────────────────────
router.get("/products", asyncHandler(products.listProducts));
router.get("/products/:id", asyncHandler(products.getProduct));
router.post("/products", requireAdmin, validateBody(schema.productSchema), asyncHandler(products.createProduct));
router.put("/products/:id", requireAdmin, validateBody(schema.productSchema), asyncHandler(products.updateProduct));
router.delete("/products/:id", requireAdmin, asyncHandler(products.deleteProduct));

// ── Cart (auth) ─────────────────────────────────────────────────────────────
router.get("/cart", requireAuth, asyncHandler(cart.getCart));
router.post("/cart/add", requireAuth, validateBody(schema.cartItemSchema), asyncHandler(cart.addToCart));
router.post("/cart/remove", requireAuth, validateBody(schema.favoriteSchema), asyncHandler(cart.removeFromCart));

// ── Favorites (auth) ────────────────────────────────────────────────────────
router.get("/favorites", requireAuth, asyncHandler(favorites.getFavorites));
router.post("/favorites/toggle", requireAuth, validateBody(schema.favoriteSchema), asyncHandler(favorites.toggleFavorite));

// ── Orders & payments ───────────────────────────────────────────────────────
router.post("/orders", requireAuth, paymentLimiter, validateBody(schema.createOrderSchema), asyncHandler(orders.createOrder));
router.get("/orders/mine", requireAuth, asyncHandler(orders.listMyOrders));
router.post("/orders/track", validateBody(schema.orderTrackSchema), asyncHandler(misc.trackOrder));
router.post("/payments/verify", requireAuth, paymentLimiter, validateBody(schema.verifyPaymentSchema), asyncHandler(orders.verifyPayment));

// ── Misc ────────────────────────────────────────────────────────────────────
router.post("/appointments/create", validateBody(schema.appointmentSchema), asyncHandler(misc.createAppointment));
router.post("/newsletter", validateBody(schema.newsletterSchema), asyncHandler(misc.subscribeNewsletter));
router.post("/upload", requireAdmin, uploadImage.single("file"), asyncHandler(misc.uploadFile));

// ── Admin ─────────────────────────────────────────────────────────────────
router.get("/admin/dashboard", requireAdmin, asyncHandler(admin.getDashboard));
router.get("/admin/clients", requireAdmin, asyncHandler(admin.getClients));
router.get("/admin/users", requireAdmin, asyncHandler(admin.getUsers));
