import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import profileCss from "../styles/profile.css?inline";
import { usePageStyle } from "../hooks/usePageStyle";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { showToast } from "../lib/toast";

interface ProfileData {
  first_name: string; last_name: string; email: string; phone: string;
  house: string; street: string; landmark: string; city: string; state: string;
  pincode: string; country: string; created_at?: string;
  orders?: number; wishlist?: number;
}

const EMPTY: ProfileData = {
  first_name: "", last_name: "", email: "", phone: "", house: "", street: "",
  landmark: "", city: "", state: "", pincode: "", country: "India",
};

export function Profile() {
  usePageStyle(profileCss, "tb-profile-style");
  const { user, loading: authLoading, refresh } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<ProfileData>(EMPTY);
  const [pw, setPw] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    api
      .get<ProfileData>("/profile")
      .then((r) => setData({ ...EMPTY, ...(r.data as ProfileData) }))
      .catch(() => showToast("Could not load profile.", "error"));
  }, [user, authLoading, navigate]);

  const field = (k: keyof ProfileData) => (e: { target: { value: string } }) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      await api.post("/profile/update", {
        first_name: data.first_name, last_name: data.last_name, email: data.email, phone: data.phone,
        house: data.house, street: data.street, landmark: data.landmark, city: data.city,
        state: data.state, pincode: data.pincode, country: data.country,
        new_password: pw.new_password, confirm_password: pw.confirm_password,
      });
      showToast("Profile Updated", "success");
      setPw({ old_password: "", new_password: "", confirm_password: "" });
      await refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  const joinDate = data.created_at ? new Date(data.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "--";

  return (
    <div className="profile-wrapper">
      <div className="profile-header">
        <div className="profile-title">My Profile</div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <img id="profileImage" src="/assets/founder.png" className="avatar" alt="Profile" />
          <div className="avatar-upload">
            <input type="file" id="profilePic" onChange={() => showToast("Photo upload coming soon.")} />
            <label htmlFor="profilePic">Change Photo</label>
          </div>
          <div className="name">{data.first_name || data.last_name ? `${data.first_name} ${data.last_name}`.trim() : "Loading..."}</div>
          <div className="email">{data.email || "Loading..."}</div>
          <div className="stats">
            <div className="stat"><span>Orders</span><b>{data.orders ?? 0}</b></div>
            <div className="stat"><span>Wishlist</span><b>{data.wishlist ?? 0}</b></div>
            <div className="stat"><span>Joined</span><b>{joinDate}</b></div>
          </div>
        </div>

        <div className="profile-card">
          <div className="section">
            <h2>Personal Information</h2>
            <div className="form-grid">
              <div className="input"><label>First Name</label><input value={data.first_name} onChange={field("first_name")} /></div>
              <div className="input"><label>Last Name</label><input value={data.last_name} onChange={field("last_name")} /></div>
              <div className="input"><label>Email</label><input value={data.email} onChange={field("email")} /></div>
              <div className="input"><label>Phone</label><input value={data.phone} onChange={field("phone")} /></div>
            </div>
          </div>

          <div className="section">
            <h2>Address</h2>
            <div className="form-grid">
              <div className="input"><label>House</label><input value={data.house} onChange={field("house")} /></div>
              <div className="input"><label>Street</label><input value={data.street} onChange={field("street")} /></div>
              <div className="input full"><label>Landmark</label><input value={data.landmark} onChange={field("landmark")} /></div>
              <div className="input"><label>City</label><input value={data.city} onChange={field("city")} /></div>
              <div className="input"><label>State</label><input value={data.state} onChange={field("state")} /></div>
              <div className="input"><label>Pincode</label><input value={data.pincode} onChange={field("pincode")} /></div>
              <div className="input"><label>Country</label><input value={data.country} onChange={field("country")} /></div>
            </div>
          </div>

          <div className="section">
            <h2>Security</h2>
            <div className="form-grid">
              <div className="input full"><label>Current Password</label><input type="password" value={pw.old_password} onChange={(e) => setPw((p) => ({ ...p, old_password: e.target.value }))} /></div>
              <div className="input"><label>New Password</label><input type="password" value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} /></div>
              <div className="input"><label>Confirm Password</label><input type="password" value={pw.confirm_password} onChange={(e) => setPw((p) => ({ ...p, confirm_password: e.target.value }))} /></div>
            </div>
            <button className="save-btn" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
