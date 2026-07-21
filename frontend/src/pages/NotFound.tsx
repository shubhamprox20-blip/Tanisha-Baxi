import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", fontFamily: "'Cormorant Garamond', serif", textAlign: "center", padding: "2rem" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 300 }}>Page not found</h1>
      <p style={{ opacity: 0.7 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ color: "#c9a84c" }}>← Return to the storefront</Link>
    </div>
  );
}
