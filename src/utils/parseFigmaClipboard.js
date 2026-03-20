// TODO(human): Decide whether to use dynamic import() for @grida/refig/browser
// to lazy-load the ~516KB module only when a user actually pastes from Figma.
// Static import (current): simpler, loads upfront, faster paste response.
// Dynamic import: reduces initial bundle by ~516KB, adds delay on first paste.
// See the Learn by Doing prompt for full tradeoff analysis.
import { FigmaDocument, FigmaRenderer } from "@grida/refig/browser";

/**
 * Detect Figma content in clipboard HTML.
 * Figma puts hidden spans with `(figmeta)` and `(figma)` markers
 * in `text/html` — no `image/png` MIME type is included.
 *
 * @param {DataTransfer} clipboardData
 * @returns {boolean}
 */
export function isFigmaClipboard(clipboardData) {
  const html = clipboardData.getData("text/html");
  if (!html) return false;
  return html.includes("(figmeta)") && html.includes("(figma)");
}

/**
 * Extract figmeta JSON and binary buffer from clipboard HTML.
 *
 * Clipboard HTML structure:
 *   <span data-metadata="<!--(figmeta)BASE64(/figmeta)-->">
 *   <span data-buffer="<!--(figma)BASE64(/figma)-->">
 *
 * @param {string} html - clipboard text/html content
 * @returns {{ meta: { fileKey: string, pasteID: string }, buffer: Uint8Array } | null}
 */
export function extractFigmaData(html) {
  try {
    const metaMatch = html.match(/\(figmeta\)([\s\S]*?)\(\/figmeta\)/);
    const bufferMatch = html.match(/\(figma\)([\s\S]*?)\(\/figma\)/);

    if (!metaMatch || !bufferMatch) return null;

    const metaJson = JSON.parse(atob(metaMatch[1].trim()));
    const binaryStr = atob(bufferMatch[1].trim());
    const buffer = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      buffer[i] = binaryStr.charCodeAt(i);
    }

    return {
      meta: {
        fileKey: metaJson.fileKey || null,
        pasteID: metaJson.pasteID || null,
      },
      buffer,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a Figma binary buffer to extract frame metadata without WASM rendering.
 * Uses FigmaDocument's internal kiwi parser to get frame names and IDs.
 *
 * @param {Uint8Array} buffer - decoded fig-kiwi binary
 * @returns {{ frames: Array<{ id: string, name: string }>, document: FigmaDocument }}
 */
export function parseFigmaFrames(buffer) {
  const doc = new FigmaDocument(buffer);

  // Trigger the internal kiwi parse so _figFile is populated.
  // _resolve() converts to Grida IR (flat node map, no tree hierarchy),
  // but _figFile retains the original Figma page/frame structure.
  doc._resolve();

  const figFile = doc._figFile;
  const frames = [];

  if (figFile?.pages) {
    for (const page of figFile.pages) {
      const rootNodes = page.rootNodes || [];
      for (const node of rootNodes) {
        if (node.id && node.name) {
          frames.push({
            id: node.id,
            name: node.name,
            width: node.size?.x ?? null,
            height: node.size?.y ?? null,
          });
        }
      }
    }
  }

  if (import.meta.env.DEV) {
    const imageCount = figFile?.images?.length ?? 0;
    console.log(
      `[Figma] Parsed ${frames.length} frame(s), ${imageCount} embedded image(s)`,
      frames.map((f) => `${f.name} (${f.width}x${f.height})`),
    );
  }

  return { frames, document: doc };
}

/**
 * Render a Figma frame to a PNG data URL.
 *
 * @param {FigmaDocument} doc - parsed FigmaDocument instance
 * @param {string} nodeId - the frame node ID to render
 * @param {{ width?: number, height?: number }} [dimensions] - frame dimensions from parseFigmaFrames
 * @returns {Promise<string>} base64 data URL of the rendered PNG
 */
export async function renderFigmaFrame(doc, nodeId, dimensions) {
  const renderer = new FigmaRenderer(doc, {
    loadFigmaDefaultFonts: true,
  });

  try {
    const renderOpts = { format: "png", scale: 2 };
    if (dimensions?.width && dimensions?.height) {
      renderOpts.width = Math.ceil(dimensions.width);
      renderOpts.height = Math.ceil(dimensions.height);
    }

    const result = await renderer.render(nodeId, renderOpts);

    if (import.meta.env.DEV) {
      console.log(
        `[Figma] Rendered node ${nodeId}: ${result.width}x${result.height} (${result.data.length} bytes)`,
      );
    }

    const base64 = uint8ArrayToBase64(result.data);
    return `data:image/png;base64,${base64}`;
  } finally {
    renderer.dispose();
  }
}

/**
 * Full pipeline: parse buffer, extract first frame, render to data URL.
 *
 * @param {Uint8Array} buffer - decoded fig-kiwi binary from clipboard
 * @returns {Promise<{ frameName: string, imageDataUrl: string, frameCount: number }>}
 */
export async function renderFigmaBuffer(buffer) {
  const { frames, document: doc } = parseFigmaFrames(buffer);

  if (frames.length === 0) {
    throw new Error("No frames found in Figma clipboard data");
  }

  const firstFrame = frames[0];
  const imageDataUrl = await renderFigmaFrame(doc, firstFrame.id, {
    width: firstFrame.width,
    height: firstFrame.height,
  });

  return {
    frameName: firstFrame.name,
    imageDataUrl,
    frameCount: frames.length,
  };
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
