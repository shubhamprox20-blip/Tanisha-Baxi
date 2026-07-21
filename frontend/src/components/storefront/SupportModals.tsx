import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";

export type ModalName = "story" | "appointment" | "order" | null;

interface Props {
  active: ModalName;
  onClose: () => void;
}

interface TrackResult {
  status: string;
  product_name?: string;
  amount?: number;
  ordered_at?: string;
}

export function SupportModals({ active, onClose }: Props) {
  const [tracking, setTracking] = useState<{ show: boolean; ok: boolean; result?: TrackResult; error?: string }>({ show: false, ok: false });

  async function submitBooking(e: FormEvent) {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const data = {
      client_name: (f.elements.namedItem("bookName") as HTMLInputElement).value,
      consultation_type: (f.elements.namedItem("bookType") as HTMLSelectElement).value,
      appointment_date: (f.elements.namedItem("bookDate") as HTMLInputElement).value,
    };
    try {
      await api.post("/appointments/create", data);
      showToast("Consultation requested successfully!");
      f.reset();
      onClose();
    } catch (err) {
      showToast((err as Error).message || "Failed to book appointment", "error");
    }
  }

  async function submitTracking(e: FormEvent) {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const order_id = (f.elements.namedItem("trackOrderId") as HTMLInputElement).value;
    const email = (f.elements.namedItem("trackEmail") as HTMLInputElement).value;
    try {
      const r = await api.post<TrackResult>("/orders/track", { order_id, email });
      setTracking({ show: true, ok: true, result: r.data as TrackResult });
    } catch (err) {
      setTracking({ show: true, ok: false, error: (err as Error).message });
    }
  }

  return (
    <>
      {/* STORY MODAL */}
      <div className={`tb-modal${active === "story" ? " open" : ""}`}>
        <div className="tb-modal-overlay" onClick={onClose} />
        <div className="tb-modal-content">
          <button className="tb-modal-close" onClick={onClose}>✕</button>
          <h3 className="tb-modal-title">Our Heritage</h3>
          <div className="tb-modal-body">
            <p style={{ marginBottom: "1rem" }}>I'm Tanesha, fashion designer, the founder and someone who's always believed that fashion is much more than clothing. I've always been drawn to art in every form dance, painting, theatre, storytelling and I think fashion is simply another way of expressing what's already within us.</p>
            <p style={{ marginBottom: "1rem" }}>I'm a graduate of NIFT, where I specialized in Fashion Design and Couture. Over the years, I've worked across design and styling with multiple brands such as Sahil Kochhar, ACQUIRE, AMRTA, and I was also a finalist for the LIVA Miss Diva Fashion Designer 2024. Every experience has shaped the way I think about fashion, but more importantly, it's strengthened what I've always believed.</p>
            <p>I love femininity, I love sensuality, and I love creating clothes that make women feel comfortable, confident, and completely themselves. If my work can help someone express who they are a little more honestly, then I've done what I came here to do.</p>
          </div>
        </div>
      </div>

      {/* APPOINTMENT MODAL */}
      <div className={`tb-modal${active === "appointment" ? " open" : ""}`}>
        <div className="tb-modal-overlay" onClick={onClose} />
        <div className="tb-modal-content">
          <button className="tb-modal-close" onClick={onClose}>✕</button>
          <h3 className="tb-modal-title">Studio Consultation</h3>
          <div className="tb-modal-body">
            <p>Contact us for a custom design enquiry, size queries or any help!</p>
            <form className="m-form" onSubmit={submitBooking}>
              <div className="m-group">
                <label className="m-label">Name</label>
                <input className="m-input" type="text" name="bookName" placeholder="Your name" required />
              </div>
              <div className="m-group">
                <label className="m-label">Consultation Type</label>
                <select className="m-select" name="bookType" required defaultValue="Bridal Fitting">
                  <option value="Bridal Fitting">Special Designing</option>
                  <option value="Couture Commission">Couture fittings</option>
                  <option value="cantfind">can't find my size</option>
                  <option value="customiz">customizations</option>
                  <option value="Styling-call">Styling call</option>
                </select>
              </div>
              <div className="m-group">
                <label className="m-label">Preferred Date & Time</label>
                <input className="m-input" type="datetime-local" name="bookDate" required />
              </div>
              <button className="bgold" type="submit" style={{ marginTop: "0.5rem", justifyContent: "center" }}>Book Consultation</button>
            </form>
          </div>
        </div>
      </div>

      {/* ORDER TRACKING MODAL */}
      <div className={`tb-modal${active === "order" ? " open" : ""}`}>
        <div className="tb-modal-overlay" onClick={onClose} />
        <div className="tb-modal-content">
          <button className="tb-modal-close" onClick={onClose}>✕</button>
          <h3 className="tb-modal-title">Track Couture Piece</h3>
          <div className="tb-modal-body">
            <p>Enter your order credentials to retrieve realtime status updates from our design studio.</p>
            <form className="m-form" onSubmit={submitTracking}>
              <div className="m-group">
                <label className="m-label">Order ID</label>
                <input className="m-input" type="text" name="trackOrderId" placeholder="e.g. TXN-1001" required />
              </div>
              <div className="m-group">
                <label className="m-label">Associated Email</label>
                <input className="m-input" type="email" name="trackEmail" placeholder="client@example.com" required />
              </div>
              <button className="bgold" type="submit" style={{ marginTop: "0.5rem", justifyContent: "center" }}>Retrieve Status</button>
            </form>
            {tracking.show && (
              <div style={{ marginTop: "1.5rem", padding: "1.2rem", background: "var(--sf2)", border: "1px solid var(--bd)", borderRadius: "var(--r-md)" }}>
                {tracking.ok && tracking.result ? (
                  <>
                    <h4 style={{ fontFamily: "var(--fd)", fontSize: "1.1rem", marginBottom: "0.4rem", color: "var(--tx)" }}>Order Found</h4>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}><strong>Piece:</strong> {tracking.result.product_name}</p>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}><strong>Amount:</strong> ₹{Math.round((tracking.result.amount ?? 0) / 100).toLocaleString("en-IN")}</p>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}><strong>Status:</strong> <span style={{ color: "var(--gold)", fontWeight: 600 }}>{tracking.result.status}</span></p>
                  </>
                ) : (
                  <p style={{ color: "var(--cherry)", fontSize: "0.85rem" }}>{tracking.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
