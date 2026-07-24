import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import productCss from "../styles/product.css?inline";
import { usePageStyle } from "../hooks/usePageStyle";
import { useThemeToggle } from "../hooks/useTheme";
import { api } from "../lib/api";
import { assetUrl } from "../lib/api";
import { useStore, type Product as ProductType } from "../context/StoreContext";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function Product() {
  usePageStyle(productCss, "tb-product-style");
  const [params] = useSearchParams();
  const pid = params.get("id");
  const toggleTheme = useThemeToggle();
  const store = useStore();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error" | "none">("loading");
  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState("XS");
  const [helpOpen, setHelpOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!pid) { setState("none"); return; }
    api
      .get<ProductType>(`/products/${pid}`)
      .then((r) => { setProduct(r.data as ProductType); setState("ready"); })
      .catch((e) => setState((e as { status?: number }).status === 404 ? "notfound" : "error"));
  }, [pid]);

  const images = useMemo(() => {
    if (!product) return [];
    const first = (product.img.split(",")[0] || "").trim();
    const isUploaded = first.includes(".") || first.startsWith("http") || first.startsWith("/");
    return isUploaded ? product.img.split(",").map((s) => assetUrl(s.trim())).filter(Boolean) : [];
  }, [product]);

  const boxClass = product && images.length === 0 ? product.img : "";
  const navLogo = document.documentElement.getAttribute("data-theme") === "dark" ? "/assets/TB-04.png" : "/assets/TB-05.png";
  void themeVersion; // navLogo recomputes when themeVersion changes

  function onToggleTheme() {
    toggleTheme();
    setThemeVersion((v) => v + 1);
  }

  function contactWhatsApp() {
    const name = product?.name ?? "this product";
    const message = `Hi Tanesha Baxi,\n\nI'm interested in "${name}".\n\nI have a few questions regarding:\n\n• Size Recommendation\n• Fabric Details\n• Availability\n• Delivery Time\n\nCould you please assist me? 😊`;
    window.open("https://wa.me/9183268890?text=" + encodeURIComponent(message), "_blank");
  }

  return (
    <>
      <header id="header">
  <Link to="/" aria-label="Home" className="nbrand-wrap">
    <img
      id="navLogo"
      className="nbrand-img"
      src={navLogo}
      alt="Tanesha Baxi"
    />
    <span className="nbrand-text">TANESHA BAXI</span>
  </Link>

  <div
    className="nact"
    style={{ display: "flex", alignItems: "center", gap: "12px" }}
  >
    <Link to="/" className="npill">
      <span>Back to Collection</span>
    </Link>

    <button
  className="cart-btn"
  aria-label="Shopping Cart"
  onClick={() => navigate("/?openCart=1")}
>
  🛒
  {store.cartCount > 0 && (
    <span className="cart-badge">
      {store.cartCount}
    </span>
  )}
</button>
    <button
      className="ibtn"
      onClick={onToggleTheme}
      aria-label="Toggle theme"
    >
      ◐
    </button>
  </div>
</header>

      <div id="product-root">
        {state === "loading" && <div className="loader">Loading piece details...</div>}
        {state === "none" && <div className="loader">No piece selected.</div>}
        {state === "notfound" && <div className="loader">Piece not found.</div>}
        {state === "error" && <div className="loader">Backend connection error. Please ensure the server is running.</div>}
        {state === "ready" && product && (
          <div className="p-container">
            <div className="p-image-side">
              <div className={`p-image-box ${boxClass}`}>
                {images.length > 0 ? (
                  <>
                    <img
  id="main-product-image"
  src={images[imgIndex]}
  alt={product.name}
  onClick={() => {
    setZoom(1);
    setImageViewerOpen(true);
  }}
  style={{ cursor: "zoom-in" }}
/>
                    {images.length > 1 && (
                      <>
                        <button className="p-nav-btn p-nav-prev" onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)} aria-label="Previous image">‹</button>
                        <button className="p-nav-btn p-nav-next" onClick={() => setImgIndex((i) => (i + 1) % images.length)} aria-label="Next image">›</button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-fig" />
                )}
              </div>
              {images.length > 1 && (
                <div className="p-dots">
                  {images.map((_, idx) => (
                    <span key={idx} className={`p-dot ${idx === imgIndex ? "active" : ""}`} onClick={() => setImgIndex(idx)} />
                  ))}
                </div>
              )}
            </div>
            <div className="p-info-side">
              <div className="p-meta">{product.meta}</div>
              <h1 className="p-title">{product.name}</h1>
              <p className="p-desc">{product.description.split("\n").map((line, i) => (
                <span key={i}>{line}{i < product.description.split("\n").length - 1 && <br />}</span>
              ))}</p>

              <div className="p-size-header">
                <div className="p-size-title">SELECT SIZE</div>
                <a href="#" className="size-guide" onClick={(e) => { e.preventDefault(); setSizeChartOpen(true); }}>Open Size Chart</a>
              </div>
              <br />
              <div className="p-sizes">
                {SIZES.map((s) => (
                  <button key={s} type="button" className={`size-btn${size === s ? " active" : ""}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>

              <div className="p-price">₹{product.price.toLocaleString("en-IN")}</div>

              <div className="p-actions">
                <button className="bgold" onClick={() => store.checkout(product.id)}>Buy Now</button>
                <button className="bsec" onClick={() => store.addToCart(product.id)}>Add to Cart</button>
                <a href="#" className="bsec" onClick={(e) => { e.preventDefault(); setHelpOpen(true); }}>Consult Studio</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <div id="helpDialog" className="help-overlay" style={{ display: helpOpen ? "flex" : "none" }} onClick={(e) => { if (e.target === e.currentTarget) setHelpOpen(false); }}>
        <div className="help-box">
          <button className="help-close" onClick={() => setHelpOpen(false)}>✕</button>
          <div className="help-title">Need Assistance?</div>
          <div className="help-subtitle">We're here to help you before placing your order.</div>
          <div className="help-list">
            <div className="help-item">✔ Size Recommendation</div>
            <div className="help-item">✔ Fabric Details</div>
            <div className="help-item">✔ Shipping Queries</div>
            <div className="help-item">✔ Custom Orders</div>
          </div>
          <button className="wa-chat-btn" onClick={contactWhatsApp}>💬 Chat on WhatsApp</button>
        </div>
      </div>

      {/* Size Chart Popup */}
      <div id="sizeChartModal" className="size-chart-modal" style={{ display: sizeChartOpen ? "flex" : "none" }} onClick={(e) => { if (e.target === e.currentTarget) setSizeChartOpen(false); }}>
        <div className="size-chart-content">
          <button className="size-chart-close" onClick={() => setSizeChartOpen(false)}>✕</button>
          <img src="/assets/sizechart.png" alt="Size Chart" />
        </div>
      </div>
      {imageViewerOpen && (
  <div
    className="image-viewer"
    onClick={() => setImageViewerOpen(false)}
  >
    <button
      className="viewer-close"
      onClick={() => setImageViewerOpen(false)}
    >
      ✕
    </button>

    <img
      src={images[imgIndex]}
      alt={product?.name ?? ""}
      className="viewer-image"
      style={{
        transform: `scale(${zoom})`,
      }}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => {
        e.preventDefault();

        if (e.deltaY < 0)
          setZoom((z) => Math.min(z + 0.2, 5));
        else
          setZoom((z) => Math.max(z - 0.2, 1));
      }}
    />
  </div>
)}
    </>
  );
}
