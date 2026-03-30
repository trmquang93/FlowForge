import { useState } from "react";
import { L_COLORS, L_FONTS } from "./landingTheme";
import { DOMAIN } from "../../constants";

const YOUTUBE_ID = "bYZqbdQo6Oc";

// Floating annotation callouts over the screenshot
function Callout({ text, style }) {
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        background: "rgba(20, 20, 24, 0.92)",
        border: `1px solid ${L_COLORS.accent035}`,
        borderRadius: 6,
        padding: "5px 10px",
        fontFamily: L_FONTS.mono,
        fontSize: 11,
        fontWeight: 500,
        color: L_COLORS.accentLight,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: `0 2px 12px rgba(0,0,0,0.5)`,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
}

function VideoEmbed() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
          title="Drawd Demo"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      aria-label="Play demo video"
      style={{
        display: "block",
        width: "100%",
        position: "relative",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <img
        src={`https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
        alt="Drawd demo video thumbnail"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      {/* Play button overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: L_COLORS.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px ${L_COLORS.accentGlow}`,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export default function DemoPreview() {
  return (
    <section
      id="demo"
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "80px 40px",
        boxSizing: "border-box",
      }}
    >
      {/* Section label */}
      <div
        className="reveal"
        style={{
          fontFamily: L_FONTS.mono,
          fontSize: 11,
          fontWeight: 500,
          color: L_COLORS.amber,
          letterSpacing: "0.1em",
          marginBottom: 16,
        }}
      >
        DEMO
      </div>

      <h2
        className="reveal"
        style={{
          fontFamily: L_FONTS.heading,
          fontWeight: 700,
          fontSize: "clamp(22px, 3.5vw, 34px)",
          color: L_COLORS.text,
          margin: "0 0 12px",
          letterSpacing: "-0.03em",
          transitionDelay: "60ms",
        }}
      >
        See it in action
      </h2>
      <p
        className="reveal"
        style={{
          fontFamily: L_FONTS.ui,
          fontSize: 15,
          color: L_COLORS.textMuted,
          margin: "0 0 48px",
          lineHeight: 1.6,
          transitionDelay: "100ms",
        }}
      >
        Upload screens, draw tap areas, connect flows, export instructions.
      </p>

      {/* Browser chrome frame */}
      <div
        className="reveal"
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${L_COLORS.border}`,
          boxShadow: `0 0 0 1px ${L_COLORS.borderSubtle}, 0 32px 80px rgba(0,0,0,0.65), 0 0 60px ${L_COLORS.accentGlow}`,
          maxWidth: 900,
          transitionDelay: "140ms",
        }}
      >
        {/* Chrome toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            background: "#1c1c22",
            borderBottom: `1px solid ${L_COLORS.border}`,
          }}
        >
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
          </div>
          {/* Fake URL bar */}
          <div
            style={{
              flex: 1,
              maxWidth: 360,
              margin: "0 auto",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${L_COLORS.border}`,
              borderRadius: 5,
              padding: "3px 10px",
              fontFamily: L_FONTS.mono,
              fontSize: 11,
              color: L_COLORS.textDim,
              letterSpacing: "0.01em",
              textAlign: "center",
            }}
          >
            {DOMAIN}
          </div>
          <div style={{ width: 72 }} />
        </div>

        {/* Screenshot area with callouts */}
        <div style={{ position: "relative" }}>
          <img
            src="/example-flow.png"
            alt="Drawd editor showing an app flow with screens, connections, and hotspots"
            style={{ display: "block", width: "100%", height: "auto" }}
          />

          {/* Annotation callouts */}
          <Callout text="← Drag to connect" style={{ top: "22%", left: "52%" }} />
          <Callout text="Draw tap areas →" style={{ top: "48%", left: "15%" }} />
          <Callout text="Export to AI ↓" style={{ bottom: "18%", right: "8%" }} />
        </div>
      </div>

      {/* Video demo */}
      <div
        className="reveal"
        style={{
          marginTop: 24,
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${L_COLORS.border}`,
          boxShadow: `0 0 0 1px ${L_COLORS.borderSubtle}, 0 16px 48px rgba(0,0,0,0.5)`,
          maxWidth: 900,
          transitionDelay: "180ms",
        }}
      >
        <VideoEmbed />
      </div>
    </section>
  );
}
