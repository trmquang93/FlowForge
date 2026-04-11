import { useState } from "react";
import { COLORS, FONTS, styles } from "../styles/theme";

const CATEGORY_LABELS = {
  screens: "Screens",
  connections: "Connections",
  documents: "Documents",
  dataModels: "Data Models",
  stickyNotes: "Sticky Notes",
  screenGroups: "Screen Groups",
};

function Chevron({ expanded }) {
  return (
    <span style={{
      display: "inline-block",
      transition: "transform 0.15s",
      transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
      fontSize: 10,
      color: COLORS.textDim,
    }}>
      &#9654;
    </span>
  );
}

function SummaryBadge({ label, count, color }) {
  if (count === 0) return null;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 12,
      fontFamily: FONTS.mono,
      fontWeight: 600,
      color,
      background: color + "12",
      border: `1px solid ${color}30`,
    }}>
      {label} {count}
    </span>
  );
}

function ChangeItem({ name, type, color, changes, expanded, onToggle }) {
  const isModified = type === "modified";
  const prefix = type === "added" ? "+" : type === "removed" ? "\u2212" : "~";

  return (
    <div style={{ marginBottom: 3 }}>
      <div
        onClick={isModified ? onToggle : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderLeft: `3px solid ${color}`,
          background: color + "08",
          borderRadius: "0 6px 6px 0",
          cursor: isModified ? "pointer" : "default",
          fontSize: 12,
          fontFamily: FONTS.ui,
          color: COLORS.text,
        }}
      >
        <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color, fontSize: 13, width: 12, textAlign: "center" }}>
          {prefix}
        </span>
        <span style={{ flex: 1 }}>{name}</span>
        {isModified && (
          <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: FONTS.mono }}>
            {changes.length} change{changes.length !== 1 ? "s" : ""}
            {" "}
            <Chevron expanded={expanded} />
          </span>
        )}
      </div>

      {isModified && expanded && (
        <div style={{
          marginLeft: 15,
          borderLeft: `1px solid ${COLORS.border}`,
          padding: "4px 0 4px 12px",
        }}>
          {changes.map((change, i) => (
            <ChangeDetail key={i} change={change} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeDetail({ change }) {
  // Hotspot sub-diff
  if (change.field === "hotspots") {
    const parts = [];
    if (change.addedCount > 0) parts.push(`+${change.addedCount} added`);
    if (change.removedCount > 0) parts.push(`${change.removedCount} removed`);
    if (change.modifiedCount > 0) parts.push(`${change.modifiedCount} modified`);

    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{
          fontSize: 11,
          fontFamily: FONTS.mono,
          color: COLORS.textMuted,
          padding: "3px 0",
        }}>
          <span style={{ color: COLORS.warning }}>hotspots</span>
          {": "}
          {parts.join(", ")}
        </div>
        {change.details && change.details.map((d, i) => (
          <div key={i} style={{
            fontSize: 10,
            fontFamily: FONTS.mono,
            color: COLORS.textDim,
            paddingLeft: 12,
            padding: "1px 0 1px 12px",
          }}>
            <span style={{
              color: d.type === "added" ? COLORS.success
                : d.type === "removed" ? COLORS.danger
                : COLORS.warning,
            }}>
              {d.type === "added" ? "+" : d.type === "removed" ? "\u2212" : "~"}
            </span>
            {" "}
            {d.label}
            {d.changes && (
              <span style={{ color: COLORS.textDim }}>
                {" "}({d.changes.map((c) => c.field).join(", ")})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Regular field change
  return (
    <div style={{
      fontSize: 11,
      fontFamily: FONTS.mono,
      color: COLORS.textMuted,
      padding: "2px 0",
      lineHeight: 1.5,
    }}>
      <span style={{ color: COLORS.accent }}>{change.field}</span>
      {": "}
      <span style={{ color: COLORS.danger }}>{change.from}</span>
      {" \u2192 "}
      <span style={{ color: COLORS.success }}>{change.to}</span>
    </div>
  );
}

function CategorySection({ label, data, expandedItems, onToggleItem }) {
  const [expanded, setExpanded] = useState(true);
  const changeCount = data.added.length + data.removed.length + data.modified.length;

  if (changeCount === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Chevron expanded={expanded} />
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONTS.mono,
          color: COLORS.text,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 11,
          fontFamily: FONTS.mono,
          color: COLORS.textDim,
        }}>
          ({changeCount} change{changeCount !== 1 ? "s" : ""})
        </span>
      </div>

      {expanded && (
        <div style={{ paddingLeft: 8 }}>
          {data.added.map((item) => (
            <ChangeItem key={item.id} name={item.name} type="added" color={COLORS.success} />
          ))}
          {data.removed.map((item) => (
            <ChangeItem key={item.id} name={item.name} type="removed" color={COLORS.danger} />
          ))}
          {data.modified.map((item) => (
            <ChangeItem
              key={item.id}
              name={item.name}
              type="modified"
              color={COLORS.warning}
              changes={item.changes}
              expanded={expandedItems.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FlowDiffModal({ diffResult, baseFileName, onClose }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { summary, categories, metadata } = diffResult;

  const totalChanges = summary.added + summary.removed + summary.modified;
  const hasMetadataChanges = metadata.modified.length > 0;

  const toggleItem = (id) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      style={{ ...styles.modalOverlay, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...styles.modalCard,
          width: 560,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 0" }}>
          <h3 style={{ ...styles.modalTitle, marginBottom: 4 }}>
            Flow Comparison
          </h3>
          <div style={{
            fontSize: 11,
            fontFamily: FONTS.mono,
            color: COLORS.textDim,
            marginBottom: 16,
          }}>
            Comparing against: {baseFileName}
          </div>

          {/* Summary bar */}
          <div style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <SummaryBadge label="+" count={summary.added} color={COLORS.success} />
            <SummaryBadge label="\u2212" count={summary.removed} color={COLORS.danger} />
            <SummaryBadge label="~" count={summary.modified} color={COLORS.warning} />
            {summary.unchanged > 0 && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                fontSize: 12,
                fontFamily: FONTS.mono,
                color: COLORS.textDim,
              }}>
                {summary.unchanged} unchanged
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px",
          minHeight: 0,
        }}>
          {totalChanges === 0 && !hasMetadataChanges ? (
            <div style={{
              textAlign: "center",
              padding: "32px 0",
              color: COLORS.textMuted,
              fontFamily: FONTS.ui,
              fontSize: 14,
            }}>
              No differences found. The flows are identical.
            </div>
          ) : (
            <>
              {hasMetadataChanges && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONTS.mono,
                    color: COLORS.text,
                    padding: "6px 0",
                  }}>
                    Metadata
                  </div>
                  <div style={{ paddingLeft: 8 }}>
                    {metadata.modified.map((change, i) => (
                      <ChangeDetail key={i} change={change} />
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(categories).map(([key, data]) => (
                <CategorySection
                  key={key}
                  label={CATEGORY_LABELS[key] || key}
                  data={data}
                  expandedItems={expandedItems}
                  onToggleItem={toggleItem}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={{ ...styles.btnCancel, padding: "8px 24px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
