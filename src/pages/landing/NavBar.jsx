import { useState } from "react";
import { L_COLORS, L_FONTS } from "./landingTheme";
import { TOPBAR_HEIGHT, ICON_PATH, APP_NAME } from "../../constants";
import { Z_INDEX } from "../../styles/theme";

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function navigateToLandingSection(id) {
  window.location.hash = `#${id}`;
}

// mode: "landing" | "docs"
export default function NavBar({ mode = "landing" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSectionLink(id) {
    setMobileOpen(false);
    if (mode === "docs") {
      navigateToLandingSection(id);
    } else {
      scrollToSection(id);
    }
  }

  return (
    <>
      <nav
        className="nav-bar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: TOPBAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          background: `${L_COLORS.bg}e6`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: `0 1px 0 ${L_COLORS.borderSubtle}, 0 4px 20px rgba(0,0,0,0.25)`,
          zIndex: Z_INDEX.toolbar,
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
          onClick={() => { window.location.hash = ""; window.location.href = "/"; }}
        >
          <img src={ICON_PATH} alt={APP_NAME} width={26} height={26} />
          <span
            style={{
              fontFamily: L_FONTS.heading,
              fontWeight: 700,
              fontSize: 17,
              color: L_COLORS.text,
              letterSpacing: "-0.03em",
            }}
          >
            {APP_NAME}
          </span>
        </div>

        {/* Center nav links */}
        <div
          className="nav-center"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <button className="nav-link" onClick={() => handleSectionLink("features")}>
            Features
          </button>
          <button className="nav-link" onClick={() => handleSectionLink("how-it-works")}>
            How It Works
          </button>
          <button className="nav-link" onClick={() => handleSectionLink("demo")}>
            Demo
          </button>
          <a
            className="nav-link"
            href="#/docs"
            style={{
              color: mode === "docs" ? L_COLORS.accentLight : undefined,
              fontWeight: mode === "docs" ? 600 : undefined,
            }}
          >
            Docs
          </a>
        </div>

        {/* Right CTA */}
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn-ghost"
            onClick={() => handleSectionLink("how-it-works")}
          >
            Learn more
          </button>
          <button
            onClick={() => { window.location.hash = "#/editor"; }}
            style={{
              padding: "8px 20px",
              background: L_COLORS.accent,
              border: "none",
              borderRadius: 8,
              color: L_COLORS.textOnAccent,
              fontFamily: L_FONTS.ui,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "background 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = L_COLORS.accentHover;
              e.currentTarget.style.boxShadow = `0 0 20px ${L_COLORS.accentGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = L_COLORS.accent;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Open Editor
          </button>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          style={{
            display: "none",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
            width: 36,
            height: 36,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
          }}
        >
          <span style={{ display: "block", width: 20, height: 2, background: L_COLORS.textMuted, borderRadius: 1 }} />
          <span style={{ display: "block", width: 20, height: 2, background: L_COLORS.textMuted, borderRadius: 1 }} />
          <span style={{ display: "block", width: 20, height: 2, background: L_COLORS.textMuted, borderRadius: 1 }} />
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div
        className="nav-mobile-menu"
        style={{
          display: mobileOpen ? "flex" : "none",
          position: "fixed",
          top: TOPBAR_HEIGHT,
          left: 0,
          right: 0,
          flexDirection: "column",
          background: `${L_COLORS.bg}f5`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
          zIndex: Z_INDEX.toolbar - 1,
          padding: "12px 0 16px",
          borderBottom: `1px solid ${L_COLORS.borderSubtle}`,
        }}
      >
        {[
          { label: "Features", id: "features" },
          { label: "How It Works", id: "how-it-works" },
          { label: "Demo", id: "demo" },
        ].map(({ label, id }) => (
          <button
            key={id}
            className="nav-link"
            onClick={() => handleSectionLink(id)}
            style={{ padding: "12px 20px", textAlign: "left", width: "100%" }}
          >
            {label}
          </button>
        ))}
        <a
          className="nav-link"
          href="#/docs"
          onClick={() => setMobileOpen(false)}
          style={{
            padding: "12px 20px",
            textAlign: "left",
            width: "100%",
            color: mode === "docs" ? L_COLORS.accentLight : undefined,
            fontWeight: mode === "docs" ? 600 : undefined,
          }}
        >
          Docs
        </a>
        <div style={{ padding: "12px 20px 0" }}>
          <button
            onClick={() => { setMobileOpen(false); window.location.hash = "#/editor"; }}
            style={{
              width: "100%",
              padding: "10px 20px",
              background: L_COLORS.accent,
              border: "none",
              borderRadius: 8,
              color: L_COLORS.textOnAccent,
              fontFamily: L_FONTS.ui,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            Open Editor
          </button>
        </div>
      </div>
    </>
  );
}
