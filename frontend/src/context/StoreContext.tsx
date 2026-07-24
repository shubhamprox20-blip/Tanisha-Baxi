import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { api } from "../lib/api";
import { showToast } from "../lib/toast";
import { loadRazorpayCheckout, type RazorpayOrderInfo } from "../lib/razorpay";
import { useAuth } from "./AuthContext";

export interface Product {
  id: number;
  name: string;
  meta: string;
  description: string;
  price: number;
  filters: string;
  img: string;
  stock: number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  img: string;
  quantity: number;
}

interface StoreContextValue {
  products: Product[];
  productsError: boolean;
  cart: CartItem[];
  favorites: Product[];
  favoriteIds: Set<number>;
  cartCount: number;
  favCount: number;
  addToCart: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  toggleFavorite: (productId: number) => void;
  /** Start Razorpay checkout. Pass a productId for "Buy now"; omit for the cart. */
  checkout: (productId?: number) => void;
  refreshCart: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  // Auth modal control shared across the storefront.
  authModalOpen: boolean;
  openAuthModal: (afterLogin?: () => void) => void;
  closeAuthModal: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, refresh: refreshAuth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const afterLoginRef = useRef<(() => void) | null>(null);

  // ── Products (public) ──────────────────────────────────────────────────
  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then((r) => setProducts((r.data as Product[]) ?? []))
      .catch(() => setProductsError(true));
  }, []);

  // ── Cart & favorites follow the auth state ─────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!user) { setCart([]); return; }
    try {
      const r = await api.get<CartItem[]>("/cart");
      setCart((r.data as CartItem[]) ?? []);
    } catch { setCart([]); }
  }, [user]);

  const refreshFavorites = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    try {
      const r = await api.get<Product[]>("/favorites");
      setFavorites((r.data as Product[]) ?? []);
    } catch { setFavorites([]); }
  }, [user]);

  useEffect(() => { void refreshCart(); void refreshFavorites(); }, [refreshCart, refreshFavorites]);

  // ── Auth modal ──────────────────────────────────────────────────────────
  const openAuthModal = useCallback((afterLogin?: () => void) => {
    afterLoginRef.current = afterLogin ?? null;
    setAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => {
    afterLoginRef.current = null;
    setAuthModalOpen(false);
  }, []);

  const requireLogin = useCallback((action: () => void): boolean => {
    if (user) { action(); return true; }
    showToast("Please Sign In or Sign Up to continue.", "error");
    openAuthModal(action);
    return false;
  }, [user, openAuthModal]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addToCart = useCallback((productId: number) => {
  if (!user) {
    window.location.href = "/?openCart=1";
    return;
  }

  (async () => {
    try {
      await api.post("/cart/add", { product_id: productId });
      showToast("Added to cart.", "success");
      await refreshCart();
    } catch (e) {
      showToast((e as Error).message, "error");
    }
  })();
}, [user, refreshCart]);

  const removeFromCart = useCallback(async (productId: number) => {
    try {
      await api.post("/cart/remove", { product_id: productId });
      await refreshCart();
    } catch (e) { showToast((e as Error).message, "error"); }
  }, [refreshCart]);

  const toggleFavorite = useCallback((productId: number) => {
    requireLogin(async () => {
      try {
        const r = await api.post<{ action: string }>("/favorites/toggle", { product_id: productId });
        const product = products.find((p) => p.id === productId);
        const name = product?.name ?? "Item";
        showToast(
          (r as any).action === "added" ? `Added ${name} to Favourites.` : `Removed ${name} from Favourites.`,
          (r as any).action === "added" ? "success" : "success",
        );
        await refreshFavorites();
      } catch (e) { showToast((e as Error).message, "error"); }
    });
  }, [requireLogin, refreshFavorites, products]);

  // ── Checkout (Razorpay) ────────────────────────────────────────────────
  const checkout = useCallback((productId?: number) => {
    requireLogin(async () => {
      if (!productId && cart.length === 0) return;
      showToast("Initializing secure checkout...", "success");
      try {
        const ok = await loadRazorpayCheckout();
        if (!ok) { showToast("Could not load payment gateway.", "error"); return; }

        const order = (await api.post<RazorpayOrderInfo>("/orders", productId ? { product_id: productId } : undefined)) as unknown as RazorpayOrderInfo;
        const rzp = new (window as any).Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "Tanesha Baxi",
          description: order.name,
          order_id: order.order_id,
          prefill: { email: user?.email },
          theme: { color: "#d8b55b" },
          handler: async (resp: any) => {
            try {
              await api.post("/payments/verify", {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              showToast("Payment successful! Your order is confirmed.", "success");
              await refreshCart();
            } catch (e) {
              showToast((e as Error).message || "Payment verification failed.", "error");
            }
          },
          modal: { ondismiss: () => showToast("Checkout cancelled.", "error") },
        });
        rzp.open();
      } catch (e) {
        showToast((e as Error).message || "Checkout failed.", "error");
      }
    });
  }, [requireLogin, cart, user, refreshCart]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + (i.quantity || 1), 0), [cart]);

  // When a login completes while a pending action is queued, run it.
  useEffect(() => {
    if (user && afterLoginRef.current) {
      const fn = afterLoginRef.current;
      afterLoginRef.current = null;
      fn();
    }
  }, [user]);

  const value: StoreContextValue = {
    products, productsError, cart, favorites, favoriteIds,
    cartCount, favCount: favorites.length,
    addToCart, removeFromCart, toggleFavorite, checkout,
    refreshCart, refreshFavorites,
    authModalOpen, openAuthModal, closeAuthModal,
  };

  // Expose refreshAuth for the auth modal's success handler.
  (value as any).refreshAuth = refreshAuth;

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue & { refreshAuth: () => Promise<void> } {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx as StoreContextValue & { refreshAuth: () => Promise<void> };
}
