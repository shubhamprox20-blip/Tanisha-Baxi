import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { useStore } from "../../context/StoreContext";

type Mode = "login" | "register";

export function AuthModal() {
  const { authModalOpen, closeAuthModal, refreshAuth } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, string>>({});

  const set = (k: string) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      try {
        await api.post("/auth/login", { email: form.email ?? "", password: form.password ?? "" });
        await refreshAuth();
        showToast("Welcome Back!", "success");
        closeAuthModal();
      } catch (err) {
        showToast((err as Error).message, "error");
      }
      return;
    }

    // register
    const required = ["firstName", "lastName", "remail", "rpassword", "confirm", "phone", "house", "street", "city", "state", "pincode"];
    if (required.some((k) => !form[k])) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    if (form.rpassword !== form.confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }
    try {
      await api.post("/auth/register", {
        first_name: form.firstName, last_name: form.lastName, email: form.remail,
        password: form.rpassword, phone: form.phone, house: form.house, street: form.street,
        landmark: form.landmark ?? "", city: form.city, state: form.state, pincode: form.pincode,
      });
      await refreshAuth();
      showToast("Account Created Successfully!", "success");
      closeAuthModal();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return (
    <div id="authModal" className={`tb-modal${authModalOpen ? " open" : ""}`}>
      <div className="tb-modal-overlay" onClick={closeAuthModal} />
      <div className="tb-modal-content" style={{ width: "min(520px,95vw)" }}>
        <button className="tb-modal-close" onClick={closeAuthModal}>✕</button>

        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--bd)", paddingBottom: ".75rem" }}>
          <button className={`tb-modal-title${mode === "login" ? " active" : ""}`} onClick={() => { setMode("login"); setStep(1); }} type="button">Sign In</button>
          <button className={`tb-modal-title${mode === "register" ? " active" : ""}`} onClick={() => { setMode("register"); setStep(1); }} type="button">Sign Up</button>
        </div>

        <div className="tb-modal-body">
          <form onSubmit={handleSubmit}>
            {mode === "login" && (
              <div>
                <div className="m-group">
                  <label className="m-label">Email Address</label>
                  <input className="m-input" type="email" placeholder="name@example.com" value={form.email ?? ""} onChange={set("email")} />
                </div>
                <div className="m-group">
                  <label className="m-label">Password</label>
                  <input className="m-input" type="password" placeholder="••••••••" value={form.password ?? ""} onChange={set("password")} />
                </div>
                <div style={{ marginTop: 22 }}>
                  <button type="submit" className="bgold" style={{ width: "100%", justifyContent: "center" }}>Sign In</button>
                </div>
              </div>
            )}

            {mode === "register" && step === 1 && (
              <div>
                <div className="auth-row">
                  <div className="m-group auth-half">
                    <label className="m-label">First Name</label>
                    <input className="m-input" type="text" value={form.firstName ?? ""} onChange={set("firstName")} />
                  </div>
                  <div className="m-group auth-half">
                    <label className="m-label">Last Name</label>
                    <input className="m-input" type="text" value={form.lastName ?? ""} onChange={set("lastName")} />
                  </div>
                </div>
                <div className="m-group">
                  <label className="m-label">Email Address</label>
                  <input className="m-input" type="email" value={form.remail ?? ""} onChange={set("remail")} />
                </div>
                <div className="m-group">
                  <label className="m-label">Password</label>
                  <input className="m-input" type="password" value={form.rpassword ?? ""} onChange={set("rpassword")} />
                </div>
                <div className="m-group">
                  <label className="m-label">Confirm Password</label>
                  <input className="m-input" type="password" value={form.confirm ?? ""} onChange={set("confirm")} />
                </div>
                <button type="button" className="bgold" style={{ width: "100%", justifyContent: "center", marginTop: 20 }} onClick={() => setStep(2)}>Next →</button>
              </div>
            )}

            {mode === "register" && step === 2 && (
              <div>
                <div className="m-group">
                  <label className="m-label">Mobile Number</label>
                  <input className="m-input" type="tel" value={form.phone ?? ""} onChange={set("phone")} />
                </div>
                <div className="m-group">
                  <label className="m-label">House / Flat No.</label>
                  <input className="m-input" type="text" value={form.house ?? ""} onChange={set("house")} />
                </div>
                <div className="m-group">
                  <label className="m-label">Street / Area</label>
                  <input className="m-input" type="text" value={form.street ?? ""} onChange={set("street")} />
                </div>
                <div className="m-group">
                  <label className="m-label">Landmark</label>
                  <input className="m-input" type="text" value={form.landmark ?? ""} onChange={set("landmark")} />
                </div>
                <div className="auth-row">
                  <div className="m-group auth-half">
                    <label className="m-label">City</label>
                    <input className="m-input" type="text" value={form.city ?? ""} onChange={set("city")} />
                  </div>
                  <div className="m-group auth-half">
                    <label className="m-label">State</label>
                    <input className="m-input" type="text" value={form.state ?? ""} onChange={set("state")} />
                  </div>
                </div>
                <div className="m-group">
                  <label className="m-label">PIN Code</label>
                  <input className="m-input" type="text" value={form.pincode ?? ""} onChange={set("pincode")} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button type="button" className="bghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="bgold" style={{ flex: 1, justifyContent: "center" }}>Create Account</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
