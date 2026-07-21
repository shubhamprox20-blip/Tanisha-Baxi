import { useEffect, useState, type FormEvent } from "react";
import inventoryCss from "../../styles/inventory.css?inline";
import { usePageStyle } from "../../hooks/usePageStyle";
import { api, assetUrl } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { AdminGate } from "../../components/admin/AdminGate";
import { AdminNav } from "../../components/admin/AdminNav";

interface Product {
  id: number; name: string; meta: string; description: string;
  price: number; filters: string; img: string; stock: number;
}

const SWATCHES = [
  { value: "gold2", label: "Gold (gold2)" },
  { value: "cherry", label: "Cherry (cherry)" },
  { value: "sage", label: "Sage (sage)" },
  { value: "dust", label: "Dust (dust)" },
  { value: "dark", label: "Midnight Black (dark)" },
  { value: "ivory", label: "Ivory White (ivory)" },
];

const EMPTY = { name: "", meta: "", price: "", filters: "", img: "gold2", stock: "10", description: "" };

function InventoryInner() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY });
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    try {
      const r = await api.get<Product[]>("/products");
      setProducts((r.data as Product[]) ?? []);
    } catch { setError(true); }
  }
  useEffect(() => { void load(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setUploaded([]);
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setEditingId(p.id);
    const first = (p.img.split(",")[0] || "").trim();
    const isUploaded = first.includes(".") || first.startsWith("http") || first.startsWith("/");
    setForm({
      name: p.name, meta: p.meta, price: String(p.price), filters: p.filters,
      img: isUploaded ? "gold2" : p.img, stock: String(p.stock), description: p.description,
    });
    setUploaded(isUploaded ? p.img.split(",").map((s) => s.trim()).filter(Boolean) : []);
    setModalOpen(true);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await api.post<never>("/upload", fd);
        urls.push((r as unknown as { url: string }).url);
      }
      setUploaded((prev) => [...prev, ...urls]);
    } catch (err) {
      showToast((err as Error).message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const img = uploaded.length > 0 ? uploaded.join(",") : form.img;
    const payload = {
      name: form.name, meta: form.meta, description: form.description,
      price: Number(form.price), filters: form.filters, img, stock: Number(form.stock || "0"),
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showToast("Product updated successfully");
      } else {
        await api.post("/products", payload);
        showToast("Product added successfully");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this piece permanently?")) return;
    try {
      await api.del(`/products/${id}`);
      showToast("Product deleted successfully");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (error) return <div className="wrap"><div id="loader"><span style={{ color: "red" }}>Backend Connection Refused.</span> Ensure the API server is active.</div></div>;
  if (!products) return <div className="wrap"><div id="loader">Fetching Master Inventory...</div></div>;

  return (
    <div className="wrap">
      <div id="dcontent">
        <div className="sec-head">
          <div>Catalogue Master Data</div>
          <button className="btn-add" onClick={openAdd}>+ Add New Piece</button>
        </div>

        <div className="tbl-w">
          <table>
            <thead>
              <tr><th>ID</th><th>Garment Name</th><th>Category Meta</th><th>Display Price</th><th>Stock</th><th>Engine Filters</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--mu)" }}>{p.id}</td>
                  <td style={{ fontFamily: "var(--fd)" }}>{p.name}</td>
                  <td style={{ color: "var(--mu)", fontSize: "0.85rem" }}>{p.meta}</td>
                  <td>₹{p.price.toLocaleString("en-IN")}</td>
                  <td>{p.stock}</td>
                  <td style={{ color: "var(--mu)", fontSize: "0.8rem" }}>{p.filters}</td>
                  <td>
                    <button className="btn-submit" style={{ padding: "0.4rem 0.9rem", marginRight: "0.5rem" }} onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-cancel" style={{ padding: "0.4rem 0.9rem" }} onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`tb-modal${modalOpen ? " open" : ""}`}>
        <div className="tb-modal-overlay" onClick={() => setModalOpen(false)} />
        <div className="tb-modal-box">
          <button className="tb-modal-close" aria-label="Close modal" onClick={() => setModalOpen(false)}>&times;</button>
          <h2 className="tb-modal-title">{editingId ? "Edit Haute Couture Piece" : "Add New Haute Couture Piece"}</h2>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Garment Name</label>
              <input type="text" required value={form.name} onChange={set("name")} placeholder="e.g. The Monogram Drape" />
            </div>
            <div className="form-group">
              <label>Category / Meta</label>
              <input type="text" required value={form.meta} onChange={set("meta")} placeholder="e.g. SARI · GOLD EMBROIDERY" />
            </div>
            <div className="form-group">
              <label>Display Price (INR)</label>
              <input type="number" required min="0" value={form.price} onChange={set("price")} placeholder="e.g. 135000" />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input type="number" required min="0" value={form.stock} onChange={set("stock")} placeholder="e.g. 10" />
            </div>
            <div className="form-group">
              <label>Engine Filters (comma separated)</label>
              <input type="text" required value={form.filters} onChange={set("filters")} placeholder="e.g. all, gold, saris" />
            </div>
            <div className="form-group">
              <label>Swatch Color CSS Class / Background</label>
              <select value={form.img} onChange={set("img")} disabled={uploaded.length > 0}>
                {SWATCHES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Or Upload Product Images (multi-select supported)</label>
              <input type="file" accept="image/*" multiple onChange={onFiles} />
              {uploading && <div style={{ fontSize: "0.8rem", color: "var(--mu)", marginTop: "0.4rem" }}>Uploading…</div>}
            </div>
            {uploaded.length > 0 && (
              <div className="form-group">
                <label>Uploaded Images (in order)</label>
                <div className="image-preview-container">
                  {uploaded.map((u, i) => (
                    <div key={i} style={{ position: "relative", display: "inline-block", marginRight: "0.5rem" }}>
                      <img src={assetUrl(u)} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bd)" }} />
                      <button type="button" onClick={() => setUploaded((p) => p.filter((_, idx) => idx !== i))}
                        style={{ position: "absolute", top: -6, right: -6, background: "var(--cherry)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Piece Description</label>
              <textarea rows={3} required value={form.description} onChange={set("description")} placeholder="Describe the intricate craftsmanship, texture, drape..." />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
              <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-submit">{editingId ? "Save Changes" : "Submit Piece"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Inventory() {
  usePageStyle(inventoryCss, "tb-inventory-style");
  return (
    <AdminGate>
      <AdminNav active="inventory" />
      <InventoryInner />
    </AdminGate>
  );
}
