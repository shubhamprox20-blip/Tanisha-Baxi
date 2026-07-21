/** Dynamically load the Razorpay Checkout script once. */
let loading: Promise<boolean> | null = null;

export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return loading;
}

export interface RazorpayOrderInfo {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
}
