// Landing page-specific theme. Do NOT import from the editor's theme.js —
// this file intentionally diverges from it to keep the landing design
// independent of editor UI changes.

export const L_COLORS = {
  // One Dark Pro base — neutral dark with slight blue tint
  bg: "#282c34",
  surface: "#2c313a",
  surfaceHover: "#333842",
  surfaceCard: "#2c313a",
  border: "#3e4451",
  borderSubtle: "#333842",

  // One Dark Pro blue accent
  accent: "#61afef",
  accentHover: "#8cc5f6",
  accentGlow: "rgba(97,175,239,0.28)",
  accentLight: "#8cc5f6",

  // Warm tan secondary — for step numbers, highlights, badge dots
  amber: "#d19a66",
  amberGlow: "rgba(209,154,102,0.22)",
  amberDim: "rgba(209,154,102,0.12)",

  text: "#abb2bf",
  textMuted: "#5c6370",
  textDim: "#4b5263",
  textOnAccent: "#282c34",

  // Accent opacity tokens — use these instead of inline rgba(97,175,239,X)
  accent006: "rgba(97,175,239,0.06)",
  accent007: "rgba(97,175,239,0.07)",
  accent008: "rgba(97,175,239,0.08)",
  accent01:  "rgba(97,175,239,0.1)",
  accent012: "rgba(97,175,239,0.12)",
  accent014: "rgba(97,175,239,0.14)",
  accent015: "rgba(97,175,239,0.15)",
  accent018: "rgba(97,175,239,0.18)",
  accent02:  "rgba(97,175,239,0.2)",
  accent022: "rgba(97,175,239,0.22)",
  accent028: "rgba(97,175,239,0.28)",
  accent035: "rgba(97,175,239,0.35)",
  accent04:  "rgba(97,175,239,0.4)",
  accent05:  "rgba(97,175,239,0.5)",

  // Amber opacity tokens — use these instead of inline rgba(209,154,102,X)
  amber007: "rgba(209,154,102,0.07)",
  amber02:  "rgba(209,154,102,0.2)",
  amber022: "rgba(209,154,102,0.22)",
  amber025: "rgba(209,154,102,0.25)",
  amber03:  "rgba(209,154,102,0.3)",
};

export const L_FONTS = {
  // Sora: geometric-humanist, distinctive — not an AI-default
  heading: "'Sora', sans-serif",
  ui: "'Outfit', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Google Fonts URL — includes Sora, Outfit, JetBrains Mono
export const L_FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
