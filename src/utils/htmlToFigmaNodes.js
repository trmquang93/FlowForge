// The DOM traversal function source lives in mcp-server/src/figma-export/dom-traversal.js.
// We import it here so .toString() gives us the source to inject into a sandboxed iframe.
// Inside the iframe, `window`, `document`, and `getComputedStyle` resolve to the
// iframe's own context — exactly like Puppeteer's page.evaluate().
import { domTraversalFn } from "../../mcp-server/src/figma-export/dom-traversal";

/**
 * Renders HTML in a hidden iframe and returns the raw DOM traversal node tree.
 * This is the low-level function — returns a single root FRAME node
 * with nested children (FRAME/TEXT/RECTANGLE).
 *
 * @param {string} html - The HTML string to convert
 * @param {Object} [options]
 * @param {number}  [options.width=393]    - Viewport width
 * @param {number}  [options.height=852]   - Viewport height
 * @param {string}  [options.name]         - Top-level frame name
 * @returns {Promise<Object>} Raw node tree from domTraversalFn
 */
export async function htmlToRawNodeTree(html, options = {}) {
  const { width = 393, height = 852, name } = options;

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;" +
    "width:" + width + "px;height:" + height + "px;" +
    "border:none;visibility:hidden;pointer-events:none;";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // Ensure body fills the iframe viewport so percentage-height flex
    // containers don't collapse to zero. Injected BEFORE layout polling so
    // the measurements reflect the reset margins, not the default 8px body margin.
    const resetStyle = doc.createElement("style");
    resetStyle.textContent = "html,body{margin:0;padding:0;width:100%;height:100%;}";
    (doc.head || doc.documentElement).appendChild(resetStyle);

    // Wait for layout to stabilize: poll until body children have non-zero
    // dimensions or fall back after 2000ms. A fixed 300ms timeout is not
    // reliable when the HTML references web fonts or external stylesheets.
    await new Promise((resolve) => {
      const deadline = setTimeout(resolve, 2000);
      const iwin = iframe.contentWindow;

      function check() {
        const body = doc.body;
        if (body && body.children.length > 0) {
          const rect = body.children[0].getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            clearTimeout(deadline);
            resolve();
            return;
          }
        }
        iwin.requestAnimationFrame(check);
      }

      // Brief initial delay so the parser can construct the DOM before we poll.
      setTimeout(() => iwin.requestAnimationFrame(check), 50);
    });

    const script = doc.createElement("script");
    script.textContent = "window.__domTraversal = " + domTraversalFn.toString();
    doc.head.appendChild(script);

    const rootNode = iframe.contentWindow.__domTraversal(width, height);
    if (name) rootNode.name = name;
    return rootNode;
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Converts an HTML string to a Figma-compatible JSON node tree entirely
 * in the browser using a hidden iframe — no API server required.
 *
 * @param {string} html - The HTML string to convert
 * @param {Object} [options]
 * @param {number}  [options.width=393]    - Viewport width
 * @param {number}  [options.height=852]   - Viewport height
 * @param {string}  [options.name]         - Top-level frame name
 * @returns {Promise<Object>} Figma JSON payload { type, pasteID, nodes, fonts }
 */
export async function htmlToFigmaNodes(html, options = {}) {
  const rootNode = await htmlToRawNodeTree(html, options);

  return {
    type: "FIGMA_CLIPBOARD",
    pasteID: Math.round(Math.random() * 10_000_000_000),
    nodes: [rootNode],
    fonts: collectFonts(rootNode),
  };
}

/**
 * Converts multiple HTML screens and returns a combined JSON payload.
 *
 * @param {Array<{html: string, name?: string}>} screens
 * @param {Object} [options]
 * @param {number}  [options.width=393]
 * @param {number}  [options.height=852]
 * @returns {Promise<Object>} Figma JSON payload
 */
export async function htmlToFigmaNodesMulti(screens, options = {}) {
  const { width = 393, height = 852 } = options;
  const GAP = 40;
  const nodes = [];

  for (let i = 0; i < screens.length; i++) {
    const { html, name } = screens[i];
    if (!html) continue;

    const result = await htmlToFigmaNodes(html, { width, height, name });
    const node = result.nodes[0];
    node.x = i * (width + GAP);
    node.y = 0;
    nodes.push(node);
  }

  return {
    type: "FIGMA_CLIPBOARD",
    pasteID: Math.round(Math.random() * 10_000_000_000),
    nodes,
    fonts: deduplicateFonts(nodes.flatMap((n) => collectFonts(n))),
  };
}

// ─── Font collection ──────────────────────────────────────────────────────────

function collectFonts(rootNode) {
  const seen = new Set();
  const fonts = [];

  function walk(node) {
    if (node.type === "TEXT" && node.style) {
      const key = `${node.style.fontFamily}:${node.style.fontWeight}:${node.style.italic ? 1 : 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        fonts.push({
          family: node.style.fontFamily,
          style: node.style.italic
            ? node.style.fontWeight >= 700 ? "Bold Italic" : "Italic"
            : node.style.fontWeight >= 700 ? "Bold" : "Regular",
        });
      }
    }
    if (node.children) node.children.forEach(walk);
  }

  walk(rootNode);
  return fonts;
}

function deduplicateFonts(fonts) {
  const seen = new Set();
  return fonts.filter((f) => {
    const key = `${f.family}:${f.style}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
