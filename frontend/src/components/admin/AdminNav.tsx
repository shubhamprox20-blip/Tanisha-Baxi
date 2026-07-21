import { Link } from "react-router-dom";
import { useThemeToggle } from "../../hooks/useTheme";

type Active = "dashboard" | "inventory" | "clients";

/** Shared admin top nav, matching the original Operations Hub markup. */
export function AdminNav({ active }: { active: Active }) {
  const toggleTheme = useThemeToggle();
  return (
    <nav className="nav">
      <div className="brand">Tanesha Baxi <span>Operations Hub</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <div className="nv-links">
          <Link to="/">← Return to Storefront</Link>
          <Link to="/admin" className={active === "dashboard" ? "active" : ""}>Dashboard</Link>
          <Link to="/inventory" className={active === "inventory" ? "active" : ""}>Inventory</Link>
          <Link to="/clients" className={active === "clients" ? "active" : ""}>Clients</Link>
        </div>
        <button className="ibtn" onClick={toggleTheme} aria-label="Toggle theme">◐</button>
      </div>
    </nav>
  );
}
