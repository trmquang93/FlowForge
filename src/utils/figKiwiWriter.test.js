import { describe, it, expect } from "vitest";
import { writeHTMLMessage } from "./figKiwiWriter.js";
import { readHTMLMessage } from "fig-kiwi/dist/index.esm.js";
import figmaSchema from "./figmaSchema.json";

function decodeForFigKiwi(html) {
  return html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Minimal valid message matching the figmaSchema NODE_CHANGES type
function makeMessage(overrides = {}) {
  return {
    type: "NODE_CHANGES",
    sessionID: 0,
    ackID: 0,
    pasteID: 12345,
    pasteFileKey: "test",
    pasteIsPartiallyOutsideEnclosingFrame: false,
    pastePageId: { sessionID: 100, localID: 1 },
    pasteEditorType: "DESIGN",
    isCut: false,
    publishedAssetGuids: [],
    nodeChanges: [
      {
        guid: { sessionID: 0, localID: 0 },
        phase: "CREATED",
        type: "DOCUMENT",
        name: "Document",
        visible: true,
        opacity: 1,
        transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
      },
      {
        guid: { sessionID: 100, localID: 1 },
        parentIndex: { guid: { sessionID: 0, localID: 0 }, position: "!" },
        phase: "CREATED",
        type: "CANVAS",
        name: "Page 1",
        visible: true,
        opacity: 1,
        transform: { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 },
      },
    ],
    ...overrides,
  };
}

describe("writeHTMLMessage", () => {
  it("returns an HTML string with figmeta and figma markers", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 1, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    expect(typeof html).toBe("string");
    expect(html).toContain("(figmeta)");
    expect(html).toContain("(/figmeta)");
    expect(html).toContain("(figma)");
    expect(html).toContain("(/figma)");
  });

  it("encodes metadata as base64 JSON", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "myKey", pasteID: 42, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    const match = html.match(/\(figmeta\)([^(]+)\(\/figmeta\)/);
    expect(match).not.toBeNull();
    const meta = JSON.parse(atob(match[1]));
    expect(meta.fileKey).toBe("myKey");
    expect(meta.pasteID).toBe(42);
  });

  it("produces a valid fig-kiwi archive (prelude + version)", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 1, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    const match = html.match(/\(figma\)([^(]+)\(\/figma\)/);
    const bytes = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));

    // Prelude: "fig-kiwi" (8 bytes)
    const prelude = new TextDecoder().decode(bytes.slice(0, 8));
    expect(prelude).toBe("fig-kiwi");

    // Version: uint32 LE = 20
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    expect(view.getUint32(8, true)).toBe(20);
  });

  it("contains exactly 2 deflate-compressed chunks", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 1, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    const match = html.match(/\(figma\)([^(]+)\(\/figma\)/);
    const bytes = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
    const view = new DataView(bytes.buffer, bytes.byteOffset);

    let offset = 12; // after prelude (8) + version (4)
    let chunkCount = 0;
    while (offset < bytes.length) {
      const size = view.getUint32(offset, true);
      offset += 4 + size;
      chunkCount++;
    }
    expect(chunkCount).toBe(2); // schema + message
    expect(offset).toBe(bytes.length); // no trailing bytes
  });

  it("round-trips through readHTMLMessage", () => {
    const original = makeMessage({ pasteID: 99999 });
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 99999, dataType: "scene" },
      schema: figmaSchema,
      message: original,
    });
    const { message } = readHTMLMessage(decodeForFigKiwi(html));
    expect(message.type).toBe("NODE_CHANGES");
    expect(message.pasteID).toBe(99999);
    expect(message.pasteFileKey).toBe("test");
    expect(message.nodeChanges.length).toBe(2);
    expect(message.nodeChanges[0].type).toBe("DOCUMENT");
    expect(message.nodeChanges[1].type).toBe("CANVAS");
  });

  it("entity-escapes comment delimiters in HTML", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 1, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    // Attributes use &lt;!-- not raw <!--
    expect(html).toContain("&lt;!--(figmeta)");
    expect(html).toContain("&lt;!--(figma)");
    // No raw HTML comments in attribute values
    expect(html).not.toMatch(/data-\w+="<!--/);
  });

  it("includes charset meta tag", () => {
    const html = writeHTMLMessage({
      meta: { fileKey: "test", pasteID: 1, dataType: "scene" },
      schema: figmaSchema,
      message: makeMessage(),
    });
    expect(html).toContain("<meta charset='utf-8'>");
  });
});
