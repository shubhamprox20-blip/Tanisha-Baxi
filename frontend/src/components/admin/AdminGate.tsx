import { useState, type FormEvent, type ReactNode } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

/**
 * Gates admin pages behind an authenticated admin. Replaces the old
 * localStorage "X-Admin-Password" gate with real role-based auth: the same
 * login endpoint issues a session cookie, and only role === "admin" passes.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  if (loading) {
    return <div style={{ padding: "5rem", textAlign: "center", color: "var(--mu)", fontStyle: "italic" }}>Authenticating…</div>;
  }

  if (user?.role === "admin") {
    return <>{children}</>;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await api.post<{ role: string }>("/auth/login", { email, password });
      const role = (r as { user?: { role?: string } }).user?.role;
      if (role !== "admin") {
        setError("This account does not have administrator access.");
        await api.post("/auth/logout").catch(() => undefined);
        return;
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Authentication failed.");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg)", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "var(--sf)", border: "1px solid var(--bd)", padding: "3rem", borderRadius: 12, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "var(--sh)" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: "2rem", fontWeight: 300, marginBottom: "0.5rem" }}>Tanesha Baxi Operations</h2>
        <p style={{ color: "var(--mu)", fontSize: "0.85rem", marginBottom: "2rem" }}>Haute Couture Administration Gate</p>
        <form onSubmit={handleLogin}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", textAlign: "left" }}>
            <div>
              <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--mu)", display: "block", marginBottom: "0.4rem" }}>Admin Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@taneshabaxi.com" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--sf2)", color: "var(--tx)", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--mu)", display: "block", marginBottom: "0.4rem" }}>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 8, border: "1px solid var(--bd)", background: "var(--sf2)", color: "var(--tx)", outline: "none" }} />
            </div>
            {error && <div style={{ color: "var(--cherry)", fontSize: "0.8rem" }}>{error}</div>}
            <button type="submit" style={{ background: "var(--gold)", color: "#1b130e", padding: "0.9rem 1.6rem", borderRadius: 20, fontWeight: 500, border: "none", cursor: "pointer", width: "100%" }}>Authenticate</button>
          </div>
        </form>
      </div>
    </div>
  );
}
