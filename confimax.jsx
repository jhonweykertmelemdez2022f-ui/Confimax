import { useState, useEffect, useRef, useCallback } from "react";

/* ─── GSAP via CDN (loaded in useEffect) ─── */
const loadGSAP = () =>
  new Promise((res) => {
    if (window.gsap) return res(window.gsap);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.onload = () => res(window.gsap);
    document.head.appendChild(s);
  });

/* ─── THEME ─── */
const themes = {
  dark: {
    bg: "#0a0a0f",
    surface: "#12121a",
    card: "#1a1a26",
    border: "#2a2a3a",
    text: "#f0f0ff",
    muted: "#8888aa",
    accent: "#6c63ff",
    accentSoft: "#6c63ff22",
    accent2: "#ff6b9d",
    accent3: "#00d4aa",
    gradient: "linear-gradient(135deg,#6c63ff,#ff6b9d)",
  },
  light: {
    bg: "#f5f5ff",
    surface: "#ffffff",
    card: "#fafafe",
    border: "#e0e0f0",
    text: "#0a0a1f",
    muted: "#6666aa",
    accent: "#5548e0",
    accentSoft: "#5548e015",
    accent2: "#e84d8a",
    accent3: "#00b894",
    gradient: "linear-gradient(135deg,#5548e0,#e84d8a)",
  },
};

/* ─── FAKE DATA ─── */
const products = [
  { id: 1, name: "AirMax Pro X", price: 129.99, cat: "Calzado", stars: 4.8, reviews: 2341, badge: "Nuevo", img: "👟" },
  { id: 2, name: "UltraFit Jacket", price: 89.99, cat: "Ropa", stars: 4.6, reviews: 1872, badge: "Oferta", img: "🧥" },
  { id: 3, name: "SmartWatch Elite", price: 249.99, cat: "Tech", stars: 4.9, reviews: 4021, badge: "Top", img: "⌚" },
  { id: 4, name: "Pro Headphones Z7", price: 179.99, cat: "Tech", stars: 4.7, reviews: 3100, badge: null, img: "🎧" },
  { id: 5, name: "SportBag Ultra", price: 59.99, cat: "Accesorios", stars: 4.5, reviews: 987, badge: "Oferta", img: "🎒" },
  { id: 6, name: "Running Shorts", price: 34.99, cat: "Ropa", stars: 4.4, reviews: 754, badge: null, img: "🩳" },
];

const stats = [
  { label: "Productos", value: "12K+", icon: "📦" },
  { label: "Clientes", value: "850K+", icon: "👥" },
  { label: "Países", value: "45+", icon: "🌍" },
  { label: "Satisfacción", value: "98%", icon: "⭐" },
];

const orders = [
  { id: "#CF-001", product: "AirMax Pro X", date: "12 May 2026", status: "Entregado", amount: "$129.99" },
  { id: "#CF-002", product: "SmartWatch Elite", date: "10 May 2026", status: "En camino", amount: "$249.99" },
  { id: "#CF-003", product: "UltraFit Jacket", date: "08 May 2026", status: "Procesando", amount: "$89.99" },
  { id: "#CF-004", product: "Pro Headphones Z7", date: "05 May 2026", status: "Entregado", amount: "$179.99" },
];

/* ════════════════════════════════════════════
   GLOBAL STYLES  
════════════════════════════════════════════ */
function GlobalStyles({ t }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;transition:background .3s,color .3s,border-color .3s}
      body{font-family:'DM Sans',sans-serif;background:${t.bg};color:${t.text};min-height:100vh;overflow-x:hidden}
      h1,h2,h3,h4{font-family:'Syne',sans-serif}
      ::-webkit-scrollbar{width:6px}
      ::-webkit-scrollbar-track{background:${t.surface}}
      ::-webkit-scrollbar-thumb{background:${t.accent};border-radius:3px}
      .btn-primary{
        background:${t.gradient};color:#fff;border:none;padding:12px 28px;
        border-radius:50px;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;
        cursor:pointer;letter-spacing:.5px;position:relative;overflow:hidden;
        transition:transform .2s,box-shadow .2s;
      }
      .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px ${t.accent}55}
      .btn-secondary{
        background:transparent;color:${t.accent};border:2px solid ${t.accent};
        padding:11px 26px;border-radius:50px;font-family:'Syne',sans-serif;
        font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;
      }
      .btn-secondary:hover{background:${t.accentSoft};transform:translateY(-2px)}
      .card{
        background:${t.card};border:1px solid ${t.border};border-radius:20px;
        transition:transform .25s,box-shadow .25s,border-color .25s;
      }
      .card:hover{transform:translateY(-6px);border-color:${t.accent}66;box-shadow:0 20px 50px ${t.accent}22}
      .input-field{
        width:100%;background:${t.surface};border:1.5px solid ${t.border};color:${t.text};
        padding:14px 18px;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;
        outline:none;transition:border-color .2s,box-shadow .2s;
      }
      .input-field:focus{border-color:${t.accent};box-shadow:0 0 0 4px ${t.accentSoft}}
      .badge{
        display:inline-block;padding:4px 12px;border-radius:50px;
        font-size:11px;font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.5px;
      }
      .badge-new{background:${t.accent}33;color:${t.accent}}
      .badge-sale{background:${t.accent2}33;color:${t.accent2}}
      .badge-top{background:${t.accent3}33;color:${t.accent3}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes slideIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    `}</style>
  );
}

/* ════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════ */
function Navbar({ page, setPage, theme, setTheme, cart, user, setUser, t }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef();

  useEffect(() => {
    loadGSAP().then((gsap) => {
      if (ref.current)
        gsap.from(ref.current, { y: -60, opacity: 0, duration: 0.7, ease: "power3.out" });
    });
  }, []);

  const navLinks = [
    { id: "index", label: "Inicio" },
    { id: "shop", label: "Tienda" },
    { id: "dashboard", label: "Dashboard" },
  ];

  return (
    <nav
      ref={ref}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: t.surface + "ee", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${t.border}`,
        padding: "0 32px", height: 70,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <button onClick={() => setPage("index")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: t.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800,
        }}>C</div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: t.text }}>
          Confi<span style={{ color: t.accent }}>max</span>
        </span>
      </button>

      {/* Links desktop */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {navLinks.map((l) => (
          <button key={l.id} onClick={() => setPage(l.id)} style={{
            background: page === l.id ? t.accentSoft : "none",
            color: page === l.id ? t.accent : t.muted,
            border: "none", padding: "8px 18px", borderRadius: 50,
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
            cursor: "pointer", transition: "all .2s",
          }}>{l.label}</button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Theme toggle */}
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
          background: t.card, border: `1px solid ${t.border}`,
          width: 40, height: 40, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18,
        }}>{theme === "dark" ? "☀️" : "🌙"}</button>

        {/* Cart */}
        <button onClick={() => setPage("shop")} style={{
          background: t.card, border: `1px solid ${t.border}`,
          width: 40, height: 40, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18, position: "relative",
        }}>
          🛒
          {cart > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: t.accent2, color: "#fff",
              width: 18, height: 18, borderRadius: "50%",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{cart}</span>
          )}
        </button>

        {/* Auth */}
        {user ? (
          <button onClick={() => { setUser(null); setPage("index"); }} className="btn-secondary" style={{ padding: "8px 18px" }}>Salir</button>
        ) : (
          <button onClick={() => setPage("login")} className="btn-primary" style={{ padding: "8px 20px" }}>Ingresar</button>
        )}
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════
   INDEX PAGE
════════════════════════════════════════════ */
function IndexPage({ setPage, t }) {
  const heroRef = useRef();
  const statsRef = useRef();
  const productsRef = useRef();

  useEffect(() => {
    loadGSAP().then((gsap) => {
      gsap.from(".hero-title span", {
        y: 80, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power4.out", delay: 0.2,
      });
      gsap.from(".hero-sub", { opacity: 0, y: 30, duration: 0.7, delay: 0.7 });
      gsap.from(".hero-btns", { opacity: 0, y: 20, duration: 0.6, delay: 0.9 });
      gsap.from(".hero-img", { opacity: 0, x: 80, duration: 1, delay: 0.4, ease: "power3.out" });
      gsap.from(".stat-card", {
        opacity: 0, y: 40, stagger: 0.12, duration: 0.7, ease: "power3.out", delay: 1.1,
      });
      gsap.from(".feat-card", {
        opacity: 0, y: 50, stagger: 0.1, duration: 0.7, ease: "back.out(1.2)", delay: 0.3,
      });
    });
  }, []);

  const features = [
    { icon: "🚀", title: "Envío Express", desc: "Entrega en 24h a todo el país con seguimiento en tiempo real." },
    { icon: "🔒", title: "Pago Seguro", desc: "Encriptación SSL de grado bancario en todas tus transacciones." },
    { icon: "↩️", title: "Devoluciones", desc: "30 días para devolver sin preguntas. Sin letra pequeña." },
    { icon: "🎁", title: "Recompensas", desc: "Gana puntos en cada compra y canjéalos por descuentos exclusivos." },
  ];

  return (
    <div style={{ paddingTop: 70 }}>
      {/* HERO */}
      <section style={{
        minHeight: "90vh", display: "flex", alignItems: "center",
        padding: "60px 5% 40px",
        background: `radial-gradient(ellipse 80% 60% at 50% -10%,${t.accent}18,transparent)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Floating orbs */}
        {[
          { size: 300, top: "10%", left: "-5%", color: t.accent },
          { size: 200, bottom: "5%", right: "10%", color: t.accent2 },
          { size: 150, top: "40%", right: "30%", color: t.accent3 },
        ].map((o, i) => (
          <div key={i} style={{
            position: "absolute", width: o.size, height: o.size, borderRadius: "50%",
            background: o.color + "0a", border: `1px solid ${o.color}22`,
            top: o.top, bottom: o.bottom, left: o.left, right: o.right,
            animation: `float ${4 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}

        <div style={{ flex: 1, maxWidth: 620, zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: t.accentSoft, border: `1px solid ${t.accent}44`,
            borderRadius: 50, padding: "6px 16px", marginBottom: 28,
            fontSize: 13, fontWeight: 600, color: t.accent,
          }}>
            ✨ La nueva era del ecommerce
          </div>
          <h1 className="hero-title" style={{ fontSize: "clamp(42px,6vw,76px)", lineHeight: 1.05, marginBottom: 24, overflow: "hidden" }}>
            {["Compra.", " Vive.", " Disfruta."].map((w, i) => (
              <span key={i} style={{
                display: "inline-block",
                background: i === 1 ? t.gradient : "none",
                WebkitBackgroundClip: i === 1 ? "text" : "unset",
                WebkitTextFillColor: i === 1 ? "transparent" : t.text,
                marginRight: 8,
              }}>{w}</span>
            ))}
          </h1>
          <p className="hero-sub" style={{ fontSize: 18, color: t.muted, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Más de 12,000 productos seleccionados para ti. Moda, tecnología y estilo en un solo lugar con la mejor experiencia de compra.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setPage("shop")}>Explorar Tienda →</button>
            <button className="btn-secondary" onClick={() => setPage("register")}>Crear Cuenta</button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="hero-img" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1 }}>
          <div style={{ position: "relative", width: 340, height: 340 }}>
            <div style={{
              width: 280, height: 280, borderRadius: "50%",
              background: t.gradient + "22", border: `2px solid ${t.accent}33`,
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              animation: "float 4s ease-in-out infinite",
            }}>
              <div style={{
                width: 200, height: 200, borderRadius: "50%",
                background: t.gradient + "44", border: `2px solid ${t.accent}55`,
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
              }}>
                <div style={{ fontSize: 80, textAlign: "center", lineHeight: "200px" }}>🛍️</div>
              </div>
            </div>
            {/* floating products */}
            {[
              { emoji: "👟", x: -60, y: 20, delay: "0s" },
              { emoji: "⌚", x: 80, y: -50, delay: "1s" },
              { emoji: "🎧", x: 90, y: 100, delay: "2s" },
            ].map((item, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                transform: `translate(calc(-50% + ${item.x}px),calc(-50% + ${item.y}px))`,
                width: 56, height: 56, borderRadius: 16,
                background: t.card, border: `1px solid ${t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, boxShadow: `0 8px 25px ${t.accent}22`,
                animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
                animationDelay: item.delay,
              }}>{item.emoji}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "60px 5%", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 20 }}>
        {stats.map((s) => (
          <div key={s.label} className="card stat-card" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Syne',sans-serif", background: t.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</div>
            <div style={{ color: t.muted, fontSize: 14, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ padding: "40px 5% 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div>
            <p style={{ color: t.accent, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Destacados</p>
            <h2 style={{ fontSize: 38, fontWeight: 800 }}>Más Vendidos</h2>
          </div>
          <button className="btn-secondary" onClick={() => setPage("shop")}>Ver todo</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 24 }}>
          {products.map((p) => (
            <ProductCard key={p.id} p={p} t={t} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "60px 5% 100px", background: `linear-gradient(180deg,transparent,${t.surface})` }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>¿Por qué Confimax?</h2>
          <p style={{ color: t.muted, fontSize: 16 }}>Todo lo que necesitas para comprar con confianza</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 24 }}>
          {features.map((f) => (
            <div key={f.title} className="card feat-card" style={{ padding: "36px 28px", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, background: t.accentSoft,
                margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
              <p style={{ color: t.muted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Product Card Component ─── */
function ProductCard({ p, t, onAdd }) {
  const badgeClass = p.badge === "Nuevo" ? "badge-new" : p.badge === "Oferta" ? "badge-sale" : "badge-top";
  return (
    <div className="card" style={{ padding: 20, position: "relative", overflow: "hidden", cursor: "pointer" }}>
      {p.badge && <span className={`badge ${badgeClass}`} style={{ marginBottom: 12, display: "inline-block" }}>{p.badge}</span>}
      <div style={{
        height: 140, borderRadius: 14, background: t.accentSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 64, marginBottom: 18,
        transition: "transform .3s",
      }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >{p.img}</div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{p.cat}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <span style={{ color: "#fbbf24", fontSize: 13 }}>{"★".repeat(Math.floor(p.stars))}</span>
        <span style={{ fontSize: 13, color: t.muted }}>{p.stars} ({p.reviews.toLocaleString()})</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: t.accent }}>${p.price}</span>
        <button className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => onAdd && onAdd(p)}>
          + Agregar
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SHOP PAGE
════════════════════════════════════════════ */
function ShopPage({ t, cart, setCart }) {
  const [filter, setFilter] = useState("Todo");
  const [added, setAdded] = useState(null);
  const categories = ["Todo", "Tech", "Calzado", "Ropa", "Accesorios"];
  const filtered = filter === "Todo" ? products : products.filter((p) => p.cat === filter);

  const handleAdd = (p) => {
    setCart((c) => c + 1);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  };

  useEffect(() => {
    loadGSAP().then((gsap) => {
      gsap.from(".shop-title", { opacity: 0, y: 30, duration: 0.7 });
      gsap.from(".shop-filter", { opacity: 0, y: 20, duration: 0.6, delay: 0.2 });
    });
  }, []);

  return (
    <div style={{ paddingTop: 100, padding: "100px 5% 80px" }}>
      <div className="shop-title" style={{ marginBottom: 12 }}>
        <p style={{ color: t.accent, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Catálogo</p>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>Nuestra Tienda</h1>
        <p style={{ color: t.muted, fontSize: 16 }}>Descubre los mejores productos seleccionados para ti</p>
      </div>

      {/* Filters */}
      <div className="shop-filter" style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "32px 0" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{
            background: filter === c ? t.gradient : t.card,
            color: filter === c ? "#fff" : t.muted,
            border: `1px solid ${filter === c ? "transparent" : t.border}`,
            padding: "10px 22px", borderRadius: 50,
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
            cursor: "pointer", transition: "all .2s",
          }}>{c}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 24 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ position: "relative" }}>
            {added === p.id && (
              <div style={{
                position: "absolute", top: 10, right: 10, zIndex: 10,
                background: t.accent3, color: "#fff",
                borderRadius: 50, padding: "6px 14px", fontSize: 13,
                fontWeight: 700, animation: "slideIn .3s ease",
              }}>✓ Agregado</div>
            )}
            <ProductCard p={p} t={t} onAdd={handleAdd} />
          </div>
        ))}
      </div>

      {/* Cart bar */}
      {cart > 0 && (
        <div style={{
          position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
          background: t.gradient, color: "#fff", padding: "16px 36px",
          borderRadius: 60, fontFamily: "'Syne',sans-serif", fontWeight: 700,
          fontSize: 16, boxShadow: `0 8px 40px ${t.accent}66`,
          display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
          zIndex: 999,
        }}>
          🛒 {cart} artículo{cart > 1 ? "s" : ""} en tu carrito
          <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 50, padding: "4px 14px", fontSize: 14 }}>
            ${(cart * 89.99).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   LOGIN PAGE
════════════════════════════════════════════ */
function LoginPage({ setPage, setUser, t }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef();

  useEffect(() => {
    loadGSAP().then((gsap) => {
      gsap.from(ref.current, { opacity: 0, y: 50, duration: 0.8, ease: "power3.out" });
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !pass) return setErr("Completa todos los campos");
    setLoading(true); setErr("");
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setUser({ name: "Usuario", email });
    setPage("dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 20px",
      background: `radial-gradient(ellipse 80% 80% at 50% 50%,${t.accent}12,transparent)`,
    }}>
      <div ref={ref} className="card" style={{ width: "100%", maxWidth: 440, padding: "48px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, background: t.gradient,
            margin: "0 auto 16px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28,
          }}>🔑</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Bienvenido</h1>
          <p style={{ color: t.muted, fontSize: 15 }}>Inicia sesión en tu cuenta Confimax</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: t.muted }}>Email</label>
            <input className="input-field" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: t.muted }}>Contraseña</label>
            <input className="input-field" type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={{ background: "none", border: "none", color: t.accent, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {err && <div style={{ background: t.accent2 + "22", border: `1px solid ${t.accent2}44`, borderRadius: 12, padding: "10px 16px", color: t.accent2, fontSize: 14 }}>{err}</div>}

          <button className="btn-primary" onClick={handleLogin} style={{ width: "100%", padding: 16, fontSize: 16, marginTop: 4 }} disabled={loading}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                Ingresando...
              </span>
            ) : "Iniciar Sesión"}
          </button>

          {/* Social */}
          <div style={{ position: "relative", textAlign: "center", margin: "8px 0" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: t.border }} />
            <span style={{ position: "relative", background: t.card, padding: "0 16px", color: t.muted, fontSize: 13 }}>o continúa con</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ icon: "G", label: "Google" }, { icon: "f", label: "Facebook" }].map((s) => (
              <button key={s.label} style={{
                background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: 12, padding: "12px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, color: t.text, fontWeight: 600, fontSize: 14,
                transition: "all .2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentSoft; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}
              >
                <span style={{ fontWeight: 900, fontSize: 16 }}>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", color: t.muted, fontSize: 14, marginTop: 8 }}>
            ¿No tienes cuenta?{" "}
            <button onClick={() => setPage("register")} style={{ background: "none", border: "none", color: t.accent, fontWeight: 700, cursor: "pointer" }}>
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   REGISTER PAGE
════════════════════════════════════════════ */
function RegisterPage({ setPage, setUser, t }) {
  const [form, setForm] = useState({ name: "", email: "", pass: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const ref = useRef();

  useEffect(() => {
    loadGSAP().then((gsap) => {
      gsap.from(ref.current, { opacity: 0, scale: 0.96, duration: 0.7, ease: "power3.out" });
    });
  }, []);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.pass) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep(1);
    setTimeout(() => { setUser({ name: form.name, email: form.email }); setPage("dashboard"); }, 1500);
  };

  const fields = [
    { key: "name", label: "Nombre completo", type: "text", placeholder: "Juan García" },
    { key: "email", label: "Email", type: "email", placeholder: "tu@email.com" },
    { key: "pass", label: "Contraseña", type: "password", placeholder: "Mín. 8 caracteres" },
    { key: "confirm", label: "Confirmar contraseña", type: "password", placeholder: "Repite tu contraseña" },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "80px 20px",
      background: `radial-gradient(ellipse 80% 80% at 80% 50%,${t.accent2}12,transparent)`,
    }}>
      <div ref={ref} className="card" style={{ width: "100%", maxWidth: 480, padding: "48px 40px" }}>
        {step === 1 ? (
          <div style={{ textAlign: "center", animation: "slideIn .5s ease" }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>¡Cuenta creada!</h2>
            <p style={{ color: t.muted }}>Redirigiendo a tu dashboard...</p>
            <div style={{ marginTop: 24, width: 200, height: 4, background: t.border, borderRadius: 4, margin: "24px auto 0", overflow: "hidden" }}>
              <div style={{ height: "100%", background: t.gradient, borderRadius: 4, animation: "spin 1.5s linear", width: "60%" }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: t.gradient,
                margin: "0 auto 16px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 28,
              }}>✨</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Crear Cuenta</h1>
              <p style={{ color: t.muted, fontSize: 15 }}>Únete a más de 850,000 compradores</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {fields.map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: t.muted }}>{f.label}</label>
                  <input className="input-field" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}

              <div style={{
                display: "flex", gap: 8, background: t.accentSoft,
                border: `1px solid ${t.accent}33`, borderRadius: 12, padding: "12px 16px",
                alignItems: "flex-start",
              }}>
                <span>✅</span>
                <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.5 }}>
                  Al registrarte aceptas nuestros <span style={{ color: t.accent, fontWeight: 600 }}>Términos de servicio</span> y <span style={{ color: t.accent, fontWeight: 600 }}>Política de privacidad</span>.
                </p>
              </div>

              <button className="btn-primary" onClick={handleRegister} style={{ width: "100%", padding: 16, fontSize: 16 }} disabled={loading}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                    Creando cuenta...
                  </span>
                ) : "Crear Mi Cuenta →"}
              </button>

              <p style={{ textAlign: "center", color: t.muted, fontSize: 14 }}>
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => setPage("login")} style={{ background: "none", border: "none", color: t.accent, fontWeight: 700, cursor: "pointer" }}>
                  Iniciar sesión
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   DASHBOARD PAGE
════════════════════════════════════════════ */
function DashboardPage({ user, setPage, t }) {
  const [activeTab, setActiveTab] = useState("overview");
  const ref = useRef();

  useEffect(() => {
    loadGSAP().then((gsap) => {
      gsap.from(".dash-stat", {
        opacity: 0, y: 30, stagger: 0.1, duration: 0.6, ease: "power3.out", delay: 0.2,
      });
      gsap.from(".dash-section", {
        opacity: 0, y: 20, stagger: 0.15, duration: 0.6, ease: "power2.out", delay: 0.4,
      });
    });
  }, [activeTab]);

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28 }}>Acceso restringido</h2>
      <p style={{ color: t.muted }}>Debes iniciar sesión para ver el dashboard</p>
      <button className="btn-primary" onClick={() => setPage("login")}>Iniciar Sesión</button>
    </div>
  );

  const dashStats = [
    { label: "Pedidos totales", value: "24", change: "+3 este mes", icon: "📦", color: t.accent },
    { label: "Gastado total", value: "$1,842", change: "+$249 este mes", icon: "💳", color: t.accent2 },
    { label: "Puntos Confimax", value: "4,280", change: "+180 nuevos", icon: "⭐", color: "#fbbf24" },
    { label: "Lista de deseos", value: "12", change: "2 con oferta", icon: "❤️", color: t.accent3 },
  ];

  const tabs = [
    { id: "overview", label: "Resumen", icon: "📊" },
    { id: "orders", label: "Mis Pedidos", icon: "📦" },
    { id: "wishlist", label: "Favoritos", icon: "❤️" },
    { id: "profile", label: "Perfil", icon: "👤" },
  ];

  const statusColor = { "Entregado": t.accent3, "En camino": t.accent, "Procesando": "#fbbf24" };

  return (
    <div style={{ paddingTop: 90, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg,${t.accent}22,${t.accent2}11)`,
        borderBottom: `1px solid ${t.border}`,
        padding: "40px 5% 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: t.gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "#fff",
          }}>{user.name[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              Hola, {user.name} 👋
            </h1>
            <p style={{ color: t.muted, fontSize: 15 }}>{user.email} · Miembro desde Mayo 2026</p>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? t.surface : "none",
              color: activeTab === tab.id ? t.accent : t.muted,
              border: "none", borderBottom: activeTab === tab.id ? `2px solid ${t.accent}` : "2px solid transparent",
              padding: "14px 22px", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
              cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s",
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 5%", ref }}>
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, marginBottom: 40 }}>
              {dashStats.map((s) => (
                <div key={s.label} className="card dash-stat" style={{ padding: "24px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <span style={{ fontSize: 11, color: t.accent3, background: t.accent3 + "22", padding: "3px 10px", borderRadius: 50, fontWeight: 600 }}>▲ {s.change}</span>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ color: t.muted, fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="card dash-section" style={{ padding: "28px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Pedidos Recientes</h3>
                <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: t.accent, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  Ver todos →
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["ID Pedido", "Producto", "Fecha", "Estado", "Total"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${t.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = t.accentSoft}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "14px 12px", fontFamily: "'Syne',sans-serif", fontSize: 13, color: t.accent }}>{o.id}</td>
                        <td style={{ padding: "14px 12px", fontWeight: 500 }}>{o.product}</td>
                        <td style={{ padding: "14px 12px", color: t.muted, fontSize: 14 }}>{o.date}</td>
                        <td style={{ padding: "14px 12px" }}>
                          <span style={{
                            background: (statusColor[o.status] || t.muted) + "22",
                            color: statusColor[o.status] || t.muted,
                            padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 700,
                          }}>{o.status}</span>
                        </td>
                        <td style={{ padding: "14px 12px", fontWeight: 700, color: t.accent3 }}>{o.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="card dash-section" style={{ padding: "28px 24px" }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recomendados para ti</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} style={{
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: 16, padding: 16, cursor: "pointer",
                    transition: "all .2s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>{p.img}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: t.accent, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>${p.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="card" style={{ padding: "28px 24px" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Todos mis pedidos</h2>
            {orders.map((o) => (
              <div key={o.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "20px 0", borderBottom: `1px solid ${t.border}`,
                flexWrap: "wrap", gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: t.accentSoft,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  }}>📦</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{o.product}</div>
                    <div style={{ color: t.muted, fontSize: 13 }}>{o.id} · {o.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{
                    background: (statusColor[o.status] || t.muted) + "22",
                    color: statusColor[o.status] || t.muted,
                    padding: "6px 16px", borderRadius: 50, fontSize: 13, fontWeight: 700,
                  }}>{o.status}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: t.accent3 }}>{o.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "wishlist" && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Mi Lista de Deseos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
              {products.slice(1, 5).map((p) => (
                <div key={p.id} className="card" style={{ padding: 20, position: "relative" }}>
                  <button style={{
                    position: "absolute", top: 14, right: 14,
                    background: t.accent2 + "22", border: "none",
                    width: 34, height: 34, borderRadius: 10,
                    cursor: "pointer", fontSize: 16,
                  }}>❤️</button>
                  <div style={{ fontSize: 56, textAlign: "center", background: t.accentSoft, borderRadius: 14, padding: "20px 0", marginBottom: 14 }}>{p.img}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ color: t.accent, fontWeight: 800, fontSize: 20, fontFamily: "'Syne',sans-serif" }}>${p.price}</div>
                  <button className="btn-primary" style={{ width: "100%", marginTop: 14, padding: 12 }}>Agregar al carrito</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>Mi Perfil</h2>
            <div className="card" style={{ padding: "36px 32px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 24, background: t.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, color: "#fff", fontWeight: 800,
                }}>{user.name[0].toUpperCase()}</div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h3>
                  <p style={{ color: t.muted, fontSize: 14 }}>Cliente Premium · Desde 2026</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Nombre", value: user.name },
                  { label: "Email", value: user.email },
                  { label: "Teléfono", value: "+34 600 000 000" },
                  { label: "Dirección", value: "Calle Mayor 1, Madrid" },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{f.label}</label>
                    <div className="input-field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{f.value}</span>
                      <span style={{ color: t.accent, fontSize: 13, cursor: "pointer" }}>✏️</span>
                    </div>
                  </div>
                ))}
                <button className="btn-primary" style={{ marginTop: 8, padding: 14 }}>Guardar cambios</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════ */
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("index");
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(0);
  const t = themes[theme];

  const navigate = useCallback((p) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(p);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "index": return <IndexPage setPage={navigate} t={t} />;
      case "shop": return <ShopPage t={t} cart={cart} setCart={setCart} />;
      case "login": return <LoginPage setPage={navigate} setUser={setUser} t={t} />;
      case "register": return <RegisterPage setPage={navigate} setUser={setUser} t={t} />;
      case "dashboard": return <DashboardPage user={user} setPage={navigate} t={t} />;
      default: return <IndexPage setPage={navigate} t={t} />;
    }
  };

  return (
    <>
      <GlobalStyles t={t} />
      <Navbar
        page={page} setPage={navigate}
        theme={theme} setTheme={setTheme}
        cart={cart} user={user} setUser={setUser} t={t}
      />
      <main style={{ animation: "slideIn .4s ease" }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{
        background: t.surface, borderTop: `1px solid ${t.border}`,
        padding: "48px 5% 24px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 40, marginBottom: 40 }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
              Confi<span style={{ color: t.accent }}>max</span>
            </h3>
            <p style={{ color: t.muted, fontSize: 14, lineHeight: 1.7 }}>El ecommerce del futuro, hoy. Compra con confianza.</p>
          </div>
          {[
            { title: "Empresa", links: ["Nosotros", "Blog", "Empleo", "Prensa"] },
            { title: "Ayuda", links: ["FAQ", "Envíos", "Devoluciones", "Contacto"] },
            { title: "Legal", links: ["Privacidad", "Términos", "Cookies"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1.5, color: t.muted }}>{col.title}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <a key={l} href="#" style={{ color: t.muted, textDecoration: "none", fontSize: 14, transition: "color .2s" }}
                    onMouseEnter={(e) => e.target.style.color = t.accent}
                    onMouseLeave={(e) => e.target.style.color = t.muted}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: t.muted, fontSize: 13 }}>© 2026 Confimax. Todos los derechos reservados.</p>
          <div style={{ display: "flex", gap: 16 }}>
            {["Twitter", "Instagram", "LinkedIn"].map((s) => (
              <a key={s} href="#" style={{ color: t.muted, fontSize: 13, textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={(e) => e.target.style.color = t.accent}
                onMouseLeave={(e) => e.target.style.color = t.muted}
              >{s}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
