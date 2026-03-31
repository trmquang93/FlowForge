import { COLORS, FONTS, Z_INDEX } from "../styles/theme";

export function FormSummaryPanel({ screen, onClose }) {
  const textInputs = (screen.hotspots || []).filter(
    (h) => h.elementType === "text-input"
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z_INDEX?.modal ?? 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 24,
          minWidth: 520,
          maxWidth: 720,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          fontFamily: FONTS.ui,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: COLORS.text, fontFamily: FONTS.ui }}>
            Form Summary — {screen.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: COLORS.textMuted,
              fontSize: 18,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>

        {textInputs.length === 0 ? (
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>
            No text-input hotspots on this screen.
          </p>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                fontFamily: FONTS.mono,
              }}
            >
              <thead>
                <tr>
                  {["Field", "Input Type", "Required", "Min", "Max", "Pattern", "Error Message"].map(
                    (col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: `1px solid ${COLORS.border}`,
                          color: COLORS.textMuted,
                          fontWeight: 600,
                          fontSize: 11,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {textInputs.map((h) => {
                  const v = h.validation;
                  const hasValidation = v && (v.required || v.inputType !== "text" || v.minLength != null || v.maxLength != null || v.pattern || v.errorMessage);
                  return (
                    <tr
                      key={h.id}
                      style={{
                        background: !hasValidation ? "rgba(255,107,107,0.06)" : "transparent",
                      }}
                    >
                      <td style={cellStyle}>
                        {h.label || "Unnamed"}
                        {!hasValidation && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: COLORS.warning,
                              fontFamily: FONTS.ui,
                            }}
                            title="No validation rules configured"
                          >
                            ⚠
                          </span>
                        )}
                      </td>
                      <td style={cellStyle}>{v?.inputType || "text"}</td>
                      <td style={cellStyle}>
                        {v?.required ? (
                          <span style={{ color: COLORS.success }}>Yes</span>
                        ) : (
                          <span style={{ color: COLORS.textMuted }}>No</span>
                        )}
                      </td>
                      <td style={cellStyle}>{v?.minLength != null ? v.minLength : "—"}</td>
                      <td style={cellStyle}>{v?.maxLength != null ? v.maxLength : "—"}</td>
                      <td style={{ ...cellStyle, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v?.pattern || "—"}
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v?.errorMessage || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Warnings summary */}
            {textInputs.some((h) => {
              const v = h.validation;
              return !v || !(v.required || (v.inputType && v.inputType !== "text") || v.minLength != null || v.maxLength != null || v.pattern || v.errorMessage);
            }) && (
              <div
                style={{
                  marginTop: 14,
                  padding: "8px 12px",
                  background: "rgba(229,192,123,0.08)",
                  border: `1px solid rgba(229,192,123,0.25)`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: COLORS.warning,
                  fontFamily: FONTS.ui,
                }}
              >
                ⚠ Some text-input fields have no validation rules. Open the hotspot editor to add constraints.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "6px 8px",
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  whiteSpace: "nowrap",
};
