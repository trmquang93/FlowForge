import { COLORS, FONTS } from "../../styles/theme";

const GRAYSCALE_FILLS = [
  { label: "White",      value: "#ffffff" },
  { label: "Light",      value: "#f0f0f0" },
  { label: "Medium",     value: "#cccccc" },
  { label: "Dark",       value: "#666666" },
  { label: "Black",      value: "#333333" },
  { label: "None",       value: "transparent" },
];

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  color: COLORS.text,
  fontFamily: FONTS.mono,
  fontSize: 12,
  padding: "5px 8px",
  outline: "none",
  boxSizing: "border-box",
};

export function PropertyPanel({ component, onUpdate, onUpdateStyle, onDelete, onDuplicate }) {
  if (!component) {
    return (
      <div style={{
        width: 180,
        height: "100%",
        background: COLORS.surface,
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted }}>
          Select a component
        </span>
      </div>
    );
  }

  const { type, text, style = {}, interactive } = component;
  const showText = type !== "divider" && type !== "icon";

  return (
    <div style={{
      width: 180,
      height: "100%",
      background: COLORS.surface,
      borderLeft: `1px solid ${COLORS.border}`,
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>{type}</span>
      </div>

      <div style={{ padding: "12px" }}>
        {showText && (
          <Field label="Text">
            <input
              style={inputStyle}
              value={text || ""}
              onChange={(e) => onUpdate({ text: e.target.value })}
            />
          </Field>
        )}

        <Field label="Fill">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {GRAYSCALE_FILLS.map(({ label, value }) => (
              <button
                key={value}
                title={label}
                onClick={() => onUpdateStyle({ fill: value })}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: `2px solid ${style.fill === value ? COLORS.accent : COLORS.border}`,
                  background: value === "transparent" ? "repeating-linear-gradient(45deg, #ccc, #ccc 3px, #fff 3px, #fff 6px)" : value,
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </Field>

        <Field label="Font Size">
          <input
            type="number"
            style={inputStyle}
            value={style.fontSize || 13}
            min={8}
            max={48}
            onChange={(e) => onUpdateStyle({ fontSize: Number(e.target.value) })}
          />
        </Field>

        <Field label="Border Radius">
          <input
            type="number"
            style={inputStyle}
            value={style.borderRadius || 0}
            min={0}
            max={100}
            onChange={(e) => onUpdateStyle({ borderRadius: Number(e.target.value) })}
          />
        </Field>

        <Field label="Font Weight">
          <select
            style={{ ...inputStyle, padding: "5px 8px" }}
            value={style.fontWeight || "normal"}
            onChange={(e) => onUpdateStyle({ fontWeight: e.target.value })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </Field>

        <Field label="Interactive (Hotspot)">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={interactive || false}
              onChange={(e) => onUpdate({ interactive: e.target.checked })}
              style={{ accentColor: COLORS.accent }}
            />
            <span style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.text }}>
              Auto-generate hotspot
            </span>
          </label>
        </Field>

        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button
            onClick={onDuplicate}
            style={{
              flex: 1,
              padding: "6px 0",
              background: COLORS.surfaceHover,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.text,
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Duplicate
          </button>
          <button
            onClick={onDelete}
            style={{
              flex: 1,
              padding: "6px 0",
              background: "rgba(224,108,117,0.1)",
              border: `1px solid ${COLORS.danger}`,
              borderRadius: 4,
              color: COLORS.danger,
              fontFamily: FONTS.mono,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
