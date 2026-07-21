import { useLayoutEffect } from "react";

/**
 * Injects a page's verbatim CSS (imported with Vite's `?inline`) into the
 * document head while the component is mounted, and removes it on unmount.
 * This keeps each ported page's styles byte-identical to the original HTML
 * while preventing class-name collisions between the storefront and admin
 * pages (only one page's CSS is ever live at a time).
 */
export function usePageStyle(css: string, id: string): void {
  useLayoutEffect(() => {
    const existing = document.getElementById(id);
    if (existing) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [css, id]);
}
