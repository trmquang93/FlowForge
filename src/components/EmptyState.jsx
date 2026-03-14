import { COLORS, FONTS } from "../styles/theme";

export function EmptyState() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: COLORS.accent008,
          border: `2px dashed ${COLORS.accent02}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          color: COLORS.textDim,
        }}
      >
        &#128241;
      </div>
      <div
        style={{
          color: COLORS.textMuted,
          fontSize: 15,
          fontFamily: FONTS.heading,
          fontWeight: 500,
        }}
      >
        Drop screen designs here
      </div>
      <div
        style={{
          color: COLORS.textDim,
          fontSize: 12,
          fontFamily: FONTS.mono,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Drag &amp; drop or paste from clipboard<br />
        wireframes, screenshots, or mockups
      </div>
    </div>
  );
}
