import { useStore } from "../../context/StoreContext";
import { getImageInfo } from "../../lib/productImage";

interface DrawersProps {
  cartOpen: boolean;
  favsOpen: boolean;
  onClose: () => void;
}

/** Cart + favourites slide-out drawers, ported from the original markup. */
export function Drawers({ cartOpen, favsOpen, onClose }: DrawersProps) {
  const { cart, favorites, removeFromCart, toggleFavorite, addToCart, checkout } = useStore();

  const subtotal = cart.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const overlayOpen = cartOpen || favsOpen;

  return (
    <>
      <div className={`tb-drawer-overlay${overlayOpen ? " open" : ""}`} onClick={onClose} />

      {/* CART DRAWER */}
      <div className={`tb-drawer${cartOpen ? " open" : ""}`} id="cartDrawer">
        <div className="tb-drawer-header">
          <h3 className="tb-drawer-title">Shopping Cart</h3>
          <button className="tb-drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="tb-drawer-body">
          {cart.length === 0 ? (
            <div className="drawer-empty-state">Your cart is empty.</div>
          ) : (
            cart.map((item) => {
              const info = getImageInfo(item.img);
              return (
                <div className="drawer-item" key={item.id}>
                  <div className={`drawer-item-img ${info.cssClass}`}
                    style={info.isUploaded ? { backgroundImage: `url('${info.url}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    {info.isUploaded
                      ? <img src={info.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div className="pmfill" style={{ position: "absolute", inset: 0 }} />}
                  </div>
                  <div className="drawer-item-details">
                    <h4 className="drawer-item-name">{item.name}</h4>
                    <div className="drawer-item-price">{(item.quantity || 1)} × ₹{item.price.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="drawer-item-actions">
                    <span className="drawer-item-remove" onClick={() => removeFromCart(item.id)}>Remove</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div className="drawer-footer" style={{ display: "block" }}>
            <div className="drawer-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <button className="bgold drawer-checkout-btn" onClick={() => checkout()}><span>Proceed to Checkout</span></button>
          </div>
        )}
      </div>

      {/* FAVOURITES DRAWER */}
      <div className={`tb-drawer${favsOpen ? " open" : ""}`} id="favsDrawer">
        <div className="tb-drawer-header">
          <h3 className="tb-drawer-title">Your Favourites</h3>
          <button className="tb-drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="tb-drawer-body">
          {favorites.length === 0 ? (
            <div className="drawer-empty-state">Your favourites list is empty.</div>
          ) : (
            favorites.map((p) => {
              const info = getImageInfo(p.img);
              return (
                <div className="drawer-item" key={p.id}>
                  <div className={`drawer-item-img ${info.cssClass}`}
                    style={info.isUploaded ? { backgroundImage: `url('${info.url}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    {info.isUploaded
                      ? <img src={info.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div className="pmfill" style={{ position: "absolute", inset: 0 }} />}
                  </div>
                  <div className="drawer-item-details">
                    <h4 className="drawer-item-name">{p.name}</h4>
                    <div className="drawer-item-price">₹{p.price.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="drawer-item-actions">
                    <span className="drawer-item-remove" onClick={() => toggleFavorite(p.id)}>Remove</span>
                    <span className="drawer-item-remove" style={{ color: "var(--gold)" }} onClick={() => addToCart(p.id)}>Add to Cart</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
