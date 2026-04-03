import { COLORS, FONTS } from "../../styles/theme";

const PALETTE_ITEMS = [
  { type: "nav-bar",           label: "Nav Bar",     icon: "□ Title" },
  { type: "tab-bar",           label: "Tab Bar",     icon: "⊡ Tabs" },
  { type: "button",            label: "Button",      icon: "▣ Btn" },
  { type: "input",             label: "Input",       icon: "▭ Input" },
  { type: "list-item",         label: "List Item",   icon: "≡ Item" },
  { type: "rect",              label: "Rectangle",   icon: "□ Rect" },
  { type: "text",              label: "Text",        icon: "T Text" },
  { type: "image-placeholder", label: "Image",       icon: "⊠ Img" },
  { type: "divider",           label: "Divider",     icon: "— Line" },
  { type: "icon",              label: "Icon",        icon: "◈ Icon" },
];

export function ComponentPalette({ onAddComponent }) {
  return (
    <div style={{
      width: 120,
      height: "100%",
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      flexShrink: 0,
    }}>
      <div style={{
        padding: "10px 12px 8px",
        fontSize: 10,
        fontFamily: FONTS.mono,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        Components
      </div>
      {PALETTE_ITEMS.map(({ type, label, icon }) => (
        <button
          key={type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("wireframe/type", type);
          }}
          onClick={() => onAddComponent(type)}
          title={`Add ${label}`}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "10px 8px",
            background: "none",
            border: "none",
            borderBottom: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            fontFamily: FONTS.mono,
            fontSize: 10,
            cursor: "pointer",
            width: "100%",
            textAlign: "center",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.surfaceHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
