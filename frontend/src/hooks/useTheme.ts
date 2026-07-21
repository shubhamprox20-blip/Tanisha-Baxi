import { useCallback } from "react";

/** Toggle between light/dark themes, mirroring the original vanilla behavior. */
export function useThemeToggle(): () => void {
  return useCallback(() => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }, []);
}
