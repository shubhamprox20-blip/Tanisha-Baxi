/**
 * Toast notification — ported verbatim from the original scriptforyou.js so the
 * look and animation are identical. Creates a fixed container lazily and uses
 * the existing CSS variables (--sf, --bd, --tx, --gold, --cherry).
 */
export function showToast(message: string, type: "success" | "error" = "success"): void {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText =
      "position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;flex-direction:column;gap:0.75rem;pointer-events:none;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.cssText =
    "background:var(--sf);border:1px solid var(--bd);color:var(--tx);padding:1rem 1.5rem;border-radius:var(--r-md);font-size:0.875rem;box-shadow:var(--sh);transform:translateY(20px);opacity:0;transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1);display:flex;align-items:center;gap:0.75rem;pointer-events:auto;min-width:280px;border-left:4px solid var(--gold);";
  if (type === "error") {
    toast.style.borderLeftColor = "var(--cherry)";
  }

  const icon = document.createElement("span");
  icon.textContent = type === "success" ? "✓" : "⚠️";
  icon.style.color = type === "success" ? "var(--gold)" : "var(--cherry)";
  icon.style.fontWeight = "bold";

  const text = document.createElement("span");
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.transform = "translateY(-20px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
