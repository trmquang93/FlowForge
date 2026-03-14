import { COLORS, FONTS } from "../styles/theme";

const SelectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M4 2.5L10.5 20.5L13 13L20.5 10.5L4 2.5Z" />
  </svg>
);

const PanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const TOOLS = [
  { id: "select", label: "Select", icon: SelectIcon, key: "V" },
  { id: "pan", label: "Pan", icon: PanIcon, key: "H" },
];

const dividerStyle = {
  width: 1,
  height: 20,
  background: COLORS.border,
  margin: "0 2px",
  flexShrink: 0,
};

export function ToolBar({ activeTool, onToolChange }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "6px 8px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        zIndex: 100,
        userSelect: "none",
      }}
    >
      {TOOLS.map((tool, i) => {
        const isActive = activeTool === tool.id;
        const Icon = tool.icon;
        return (
          <span key={tool.id} style={{ display: "contents" }}>
            {i > 0 && <div style={dividerStyle} />}
            <button
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} tool (${tool.key})`}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: isActive ? COLORS.accent018 : "transparent",
                border: isActive ? `1px solid ${COLORS.accent}` : "1px solid transparent",
                borderRadius: 8,
                color: isActive ? COLORS.accentLight : COLORS.textMuted,
                cursor: "pointer",
                transition: "all 0.12s ease",
                padding: 0,
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = COLORS.surfaceHover;
                  e.currentTarget.style.color = COLORS.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = COLORS.textMuted;
                }
              }}
            >
              <Icon />
              <span
                style={{
                  fontSize: 8,
                  fontFamily: FONTS.mono,
                  fontWeight: 600,
                  color: isActive ? COLORS.accentLight : COLORS.textDim,
                  lineHeight: 1,
                }}
              >
                {tool.key}
              </span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
