/**
 * Formats Figma node trees as JSON for consumption by the Drawd Import
 * Figma plugin. The plugin reads this JSON and creates native editable
 * Figma layers via the Plugin API.
 */

/**
 * Returns the JSON payload.
 * @param {Object[]} nodes - Array of Figma node objects
 * @param {string}  [topLayerName] - Optional override for the top-level node name
 * @returns {Object}
 */
export function toJsonResponse(nodes, topLayerName) {
  const namedNodes = topLayerName
    ? nodes.map((n, i) => i === 0 ? { ...n, name: topLayerName } : n)
    : nodes;

  return {
    type: 'FIGMA_CLIPBOARD',
    pasteID: Math.round(Math.random() * 10_000_000_000),
    nodes: namedNodes,
    fonts: collectFonts(namedNodes),
  };
}

// ─── Font collection ──────────────────────────────────────────────────────────

/**
 * Walks the node tree and collects unique font references for the `fonts` array.
 * The Figma plugin uses this to pre-load fonts before creating text nodes.
 */
function collectFonts(nodes) {
  const seen = new Set();
  const fonts = [];

  function walk(node) {
    if (node.type === 'TEXT' && node.style) {
      const key = `${node.style.fontFamily}:${node.style.fontWeight}:${node.style.italic ? 1 : 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        fonts.push({
          family: node.style.fontFamily,
          style: node.style.italic
            ? node.style.fontWeight >= 700 ? 'Bold Italic' : 'Italic'
            : node.style.fontWeight >= 700 ? 'Bold' : 'Regular',
        });
      }
    }
    if (node.children) node.children.forEach(walk);
  }

  nodes.forEach(walk);
  return fonts;
}
