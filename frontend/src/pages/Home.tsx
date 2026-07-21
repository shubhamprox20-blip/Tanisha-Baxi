import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import homeCss from "../styles/home.css?inline";
import { usePageStyle } from "../hooks/usePageStyle";
import { useStorefrontEffects } from "../hooks/useStorefrontEffects";
import { useThemeToggle } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { getImageInfo } from "../lib/productImage";
import { showToast } from "../lib/toast";
import { api } from "../lib/api";
import { AuthModal } from "../components/storefront/AuthModal";
import { Drawers } from "../components/storefront/Drawers";
import { SupportModals, type ModalName } from "../components/storefront/SupportModals";

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "cherry", label: "Tops" },
  { key: "sage", label: "Bottoms" },
  { key: "dust", label: "Add Ons" },
];

export function Home() {
  usePageStyle(homeCss, "tb-home-style");
  const { user, logout } = useAuth();
  const store = useStore();
  const toggleTheme = useThemeToggle();
  useStorefrontEffects(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [activeFilter, setActiveFilter] = useState("featured");

  // Close the user dropdown on any outside click.
  useEffect(() => {
    const handler = () => setUserDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  function handleUserNav(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { store.openAuthModal(); return; }
    setUserDropdown((v) => !v);
  }

  async function handleLogout() {
    await logout();
    setUserDropdown(false);
    showToast("Logged out successfully", "success");
  }

  async function submitNewsletter(e: FormEvent) {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const input = f.elements.namedItem("newsEmail") as HTMLInputElement;
    try {
      const r = await api.post<never>("/newsletter", { email: input.value });
      showToast(r.message || "Subscribed");
      input.value = "";
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const visibleProducts = store.products.filter((p) =>
    activeFilter === "all" ? true : p.filters.toLowerCase().includes(activeFilter),
  );

  return (
    <>
      {/* INTRO */}
      <div id="intro" role="dialog" aria-label="Tanesha Baxi intro">
        <div id="ibg" />
        <div id="ic">
          <img id="mono" src="/assets/TB-01.png" alt="Tanesha Baxi Photo Logo" />
          <div id="isub">"meet your finest self"</div>
        </div>
        <div id="iline" />
      </div>

      {/* NAV */}
      <header id="header">
        <a href="#" aria-label="Home" className="nbrand-wrap">
          <img id="logoImg" className="nbrand-img" src="/assets/TB-04.png" alt="Tanesha Baxi" />
          <span className="nbrand-text">TANESHA BAXI</span>
        </a>
        <div className="nact">
          <a href="#shop" className="npill"><span>Shop</span></a>
          <a href="#founder" className="npill"><span>Founder</span></a>
          <a href="#support" className="npill"><span>Support</span></a>
          <button className="npill" onClick={() => { setCartOpen(false); setFavsOpen(true); }} aria-label="View Favourites">
            <span>♡ Favourites (<span>{store.favCount}</span>)</span>
          </button>
          <button className="npill" onClick={() => { setFavsOpen(false); setCartOpen(true); }} aria-label="View Cart">
            <span>🛒 Cart (<span>{store.cartCount}</span>)</span>
          </button>
          <div id="userMenu">
            <button className="npill" onClick={handleUserNav}>
              <span>👤</span>
              <span id="userNavText">{user ? user.first_name || "Account" : "Sign In"}</span>
              <span id="userArrow" style={{ display: user ? "inline" : "none" }}>▼</span>
            </button>
            <div id="userDropdown" className={userDropdown ? "open" : ""}>
              <Link to="/profile">👤 My Profile</Link>
              <Link to="/profile">📦 My Orders</Link>
              <hr />
              <a href="#" onClick={(e) => { e.preventDefault(); void handleLogout(); }}>🚪 Logout</a>
            </div>
          </div>
          <button className="ibtn" onClick={toggleTheme} aria-label="Toggle theme">◐</button>
          <button className="ibtn" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
        </div>
      </header>

      {/* MENU OVERLAY */}
      <div id="moverlay" className={menuOpen ? "open" : ""} aria-hidden={!menuOpen}>
        <button id="closeMenu" aria-label="Close Menu" onClick={() => setMenuOpen(false)}>&times;</button>
        <div className="mcl">
          <div className="mi" style={{ borderBottom: "none", marginBottom: 0 }}>
            <span className="mi-t" style={{ pointerEvents: "none" }}>The Collection</span><span className="mi-num" style={{ top: "30%" }}>01</span>
          </div>
          <div className="sub-banners">
            {FILTERS.map((f) => (
              <a key={f.key} className="sb-link" href="#shop" onClick={() => { setActiveFilter(f.key); setMenuOpen(false); }}>{f.label}</a>
            ))}
          </div>
          <a className="mi" href="#founder" onClick={() => setMenuOpen(false)}>
            <span className="mi-t">The Founder</span><span className="mi-s">Vision · Philosophy</span><span className="mi-num">02</span>
          </a>
          <a className="mi" href="#support" onClick={() => setMenuOpen(false)}>
            <span className="mi-t">Support</span><span className="mi-s">Client Care · Orders</span><span className="mi-num">03</span>
          </a>
        </div>
        <div className="mcr">
          <div className="mpcard">
            <div className="mpinner" id="mpinner" />
            <div className="mplabel">The Collection<span className="mpsub" id="mpsub">Cherry Red · SS 2026</span></div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main id="main">
        {/* HERO */}
        <section id="hero">
          <div className="hero-img-wrap">
            <img src="/assets/hero_cherry_gown.png" alt="Tanesha Baxi SS 2026 Collection" className="hero-img" />
          </div>
          <div className="hi">
            <div className="kicker">Demi Couture · Finewear By Tanesha Baxi</div>
            <h1 className="htitle">
              <span className="hw"><span className="hwi" style={{ animationDelay: "0.3s" }}>BECOMING</span></span>
              <br />
              <span className="hw"><span className="hwi" style={{ animationDelay: "0.5s" }}><em>a better you</em></span></span>
              <br />
              <span className="hw"><span className="hwi" style={{ animationDelay: "0.7s", fontSize: "0.5em" }}>Drop 1</span></span>
            </h1>
            <p className="hcopy">This collection is not about beginning a new journey but becoming a better version of yourself. The collection consists of diverse pieces for everyone focusing on the idea of being a little bit of everything rather than confining to one style.</p>
            <div className="hact">
              <a className="bgold" href="#shop">Open collection →</a>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="mqwrap" aria-hidden="true">
          <div className="mqtrack">
            {Array.from({ length: 3 }).flatMap((_, i) => [
              <span className="mqi" key={`a${i}`}>Demi Couture</span>, <span className="mqd" key={`ad${i}`}>✦</span>,
              <span className="mqi" key={`b${i}`}>Diverse Silhouettes</span>, <span className="mqd" key={`bd${i}`}>✦</span>,
              <span className="mqi" key={`c${i}`}>Detailed Craftsmanship</span>, <span className="mqd" key={`cd${i}`}>✦</span>,
              <span className="mqi" key={`d${i}`}>Tanesha Baxi</span>, <span className="mqd" key={`dd${i}`}>✦</span>,
              <span className="mqi" key={`e${i}`}>Made to Order</span>, <span className="mqd" key={`ed${i}`}>✦</span>,
            ])}
          </div>
        </div>

        <div className="gold-div" />

        {/* SHOP */}
        <section className="sec" id="shop">
          <div className="wrap">
            <div className="shead reveal">
              <div>
                <p className="ey">Main Collection</p>
                <h2 className="stitle">The Collection</h2>
              </div>
            </div>
            <div className="p-filters reveal" style={{ transitionDelay: ".1s" }}>
              {FILTERS.map((f) => (
                <button key={f.key} className={`pf-btn${activeFilter === f.key ? " active" : ""}`} onClick={() => setActiveFilter(f.key)}>{f.label}</button>
              ))}
            </div>

            <div className="pgrid" id="pgrid">
              {store.productsError ? (
                <p style={{ gridColumn: "1/-1", textAlign: "center", color: "#ff5555", padding: "4rem 0" }}>
                  Backend API connection failed.<br />Ensure the backend server is running.
                </p>
              ) : visibleProducts.length === 0 ? (
                <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--mu)", padding: "5rem 0", fontStyle: "italic" }}>
                  Connecting to secure inventory database...
                </p>
              ) : (
                visibleProducts.map((p, idx) => {
                  const info = getImageInfo(p.img);
                  const isFav = store.favoriteIds.has(p.id);
                  return (
                    <article className="pc reveal vis" data-c={p.filters.toLowerCase()} key={p.id} style={{ transitionDelay: `${0.05 * idx}s` }}>
                      <Link to={`/product?id=${p.id}`} className={`pm ${info.cssClass}`}
                        style={info.isUploaded ? { backgroundImage: `url('${info.url}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                        {info.isUploaded
                          ? <img src={info.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} className="pmfill" />
                          : <><div className="pmfill" /><div className="pfig" /></>}
                        <button className={`fav-toggle-btn${isFav ? " active" : ""}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); store.toggleFavorite(p.id); }}>{isFav ? "♥" : "♡"}</button>
                        <div className="pm-overlay"><span className="pm-overlay-text">View details →</span></div>
                      </Link>
                      <div className="pi">
                        <div className="pmeta">{p.meta}</div>
                        <h3 className="pname"><Link to={`/product?id=${p.id}`}>{p.name}</Link></h3>
                        <p className="pdesc">{p.description}</p>
                        <div className="prow">
                          <span className="pprice">₹{p.price.toLocaleString("en-IN")}</span>
                          <button className="pbtn" onClick={(e) => { e.preventDefault(); store.addToCart(p.id); }}><span>Add to Cart</span></button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <div className="gold-div" />

        {/* STATS BAR */}
        <section className="sec" style={{ padding: "0 0 2rem" }}>
          <div className="wrap">
            <div className="statsbar reveal">
              <div className="stat"><div className="stat-num">11</div><div className="stat-label">Signature colours</div></div>
              <div className="stat"><div className="stat-num">4</div><div className="stat-label">Signature Fabrics</div></div>
              <div className="stat"><div className="stat-num">MTO</div><div className="stat-label">Made to order</div></div>
              <div className="stat"><div className="stat-num">∞</div><div className="stat-label">Custom sizing</div></div>
            </div>
          </div>
        </section>

        <div className="gold-div" />

        {/* FOUNDER */}
        <section className="sec" id="founder">
          <div className="wrap artistic-split">
            <div className="brand-side reveal-left">
              <p className="ey">The Heritage</p>
              <h3>About the Brand</h3>
              <p>Tanesha Baxi is a demi-couture womenswear brand built on the idea of being a little bit of everything. In a world that constantly asks you to define your style, to fit into one box, to choose one version of yourself, what do you choose?<br /><br />
                Truth be, you were never meant to be just one thing. You are shaped by everything you've seen, everyone you've met, every place you've been, every story you've loved. You are an amalgamation of all of these experiences. We respect individuality and refuse to confine you to a single style. The brand focuses on creating value-for-money pieces using quality materials, couture-level finishings, and customized fits.<br /><br />
                We work with the natural structure of a woman's body: hips, waist, shoulders, height, and proportions. The aim is not to shrink, hide, or correct the body but to frame it in a way that makes it look its best. A woman can and should want to improve herself, feel healthy, or change her body but the clothes will always respect the body she has today</p>
              <p>We build our pieces with longevity and keeping in mind the diverse needs of todays clients. <br />We make a little bit of everything!! </p>
              <p>Tanesha Baxi is not one identity. It is fluid. It is layered. It is human. We are a little bit of everything.</p>
              <div className="brand-img-block">
                <img src="/assets/brand_heritage.png" alt="Tanesha Baxi Brand Heritage" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </div>
            <div className="founder-side reveal-right">
              <div className="fimg">
                <img src="/assets/founder.png" alt="Tanesha Baxi" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div className="fglow" />
              </div>
              <div className="fcopy">
                <p className="ey">The Founder · Designer</p>
                <h3>Tanesha Baxi</h3>
                <p>I'm Tanesha, fashion designer, the founder and someone who's always believed that fashion is much more than clothing.</p>
                <blockquote className="fquote">"Fashion is not about clothing.<br />It is about the woman wearing it."</blockquote>
                <button className="bgold" style={{ display: "inline-flex", marginTop: ".8rem" }} onClick={() => setModal("story")}>Read the full story →</button>
              </div>
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="newsstrip reveal">
              <div className="newstext">
                <h3>Join the inner circle.</h3>
                <p>Early collection and catalogue access, invites to events, and studio updates.</p>
              </div>
              <form className="newsform" onSubmit={submitNewsletter}>
                <input className="newinput" type="email" name="newsEmail" placeholder="Your email address" required />
                <button className="bgold" type="submit">Subscribe</button>
              </form>
            </div>
          </div>
        </section>

        {/* SUPPORT */}
        <section className="sec" id="support">
          <div className="wrap">
            <div className="shead reveal">
              <div>
                <p className="ey">Client Care</p>
                <h2 className="stitle">Support</h2>
              </div>
            </div>
            <div className="sgrid">
              <article className="scard reveal" style={{ transitionDelay: ".05s", cursor: "pointer" }} onClick={() => setModal("appointment")}>
                <div className="contact-head">
                  <div className="sico">✉</div>
                  <div className="contact-info">
                    <div className="contact-phone">+91 9183268890</div>
                    <div className="contact-email">admin@taneshabaxi.com</div>
                  </div>
                </div>
                <h4>Contact Us</h4>
                <p>Request a private studio consultation, fitting appointment, or custom couture enquiry.</p>
              </article>
              <article className="scard reveal" style={{ transitionDelay: ".1s", cursor: "pointer" }} onClick={() => setModal("order")}>
                <div className="sico">↗</div>
                <h4>Bookings</h4>
                <p>Check the realtime dispatch updates, tailored schedule, and production status of your couture piece.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="fbar" />
          <div className="ftr">
            <a href="#" aria-label="Home"><img id="footerLogo" className="fbrand-img" src="/assets/TB-02.png" alt="Tanesha Baxi" /></a>
            <nav className="flinks">
              <a href="#shop" className="flink">Collection</a>
              <a href="#founder" className="flink">Founder</a>
              <a href="#support" className="flink">Support</a>
            </nav>
            <div className="fcopy2">© 2026 Tanesha Baxi. All rights reserved.</div>
          </div>
        </div>
      </footer>

      <Drawers cartOpen={cartOpen} favsOpen={favsOpen} onClose={() => { setCartOpen(false); setFavsOpen(false); }} />
      <AuthModal />
      <SupportModals active={modal} onClose={() => setModal(null)} />
    </>
  );
}
