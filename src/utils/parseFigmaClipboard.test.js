import { describe, it, expect } from "vitest";
import { isFigmaClipboard, extractFigmaData } from "./parseFigmaClipboard.js";

// Helper to build a mock DataTransfer with getData
function mockClipboardData(htmlContent) {
  return {
    getData(type) {
      if (type === "text/html") return htmlContent || "";
      return "";
    },
  };
}

// Build clipboard HTML that mirrors Figma's actual format
function buildFigmaHtml(meta = { fileKey: "abc123", pasteID: "p1", dataType: "scene" }, bufferBytes = [1, 2, 3]) {
  const metaBase64 = btoa(JSON.stringify(meta));
  const bufferBase64 = btoa(String.fromCharCode(...bufferBytes));
  return `<meta charset="utf-8"><span data-metadata="<!--(figmeta)${metaBase64}(/figmeta)-->"></span><span data-buffer="<!--(figma)${bufferBase64}(/figma)-->"></span>`;
}

describe("isFigmaClipboard", () => {
  it("returns true for HTML with figmeta and figma markers", () => {
    const clip = mockClipboardData(buildFigmaHtml());
    expect(isFigmaClipboard(clip)).toBe(true);
  });

  it("returns false for regular HTML without markers", () => {
    const clip = mockClipboardData("<div>hello world</div>");
    expect(isFigmaClipboard(clip)).toBe(false);
  });

  it("returns false for empty HTML", () => {
    const clip = mockClipboardData("");
    expect(isFigmaClipboard(clip)).toBe(false);
  });

  it("returns false when no text/html is available", () => {
    const clip = mockClipboardData(null);
    expect(isFigmaClipboard(clip)).toBe(false);
  });

  it("returns false when only figmeta is present (no figma buffer)", () => {
    const metaBase64 = btoa(JSON.stringify({ fileKey: "abc" }));
    const clip = mockClipboardData(`<!--(figmeta)${metaBase64}(/figmeta)-->`);
    expect(isFigmaClipboard(clip)).toBe(false);
  });
});

describe("extractFigmaData", () => {
  it("extracts meta and buffer from valid Figma HTML", () => {
    const html = buildFigmaHtml({ fileKey: "xyz789", pasteID: "paste1" }, [10, 20, 30]);
    const result = extractFigmaData(html);
    expect(result).not.toBeNull();
    expect(result.meta.fileKey).toBe("xyz789");
    expect(result.meta.pasteID).toBe("paste1");
    expect(result.buffer).toBeInstanceOf(Uint8Array);
    expect(result.buffer.length).toBe(3);
    expect(result.buffer[0]).toBe(10);
    expect(result.buffer[1]).toBe(20);
    expect(result.buffer[2]).toBe(30);
  });

  it("returns null for HTML without figma markers", () => {
    expect(extractFigmaData("<div>not figma</div>")).toBeNull();
  });

  it("returns null for malformed base64 in figmeta", () => {
    const html = `<!--(figmeta)!!!not-base64!!!(/figmeta)--><!--(figma)${btoa("abc")}(/figma)-->`;
    expect(extractFigmaData(html)).toBeNull();
  });

  it("returns null for missing buffer marker", () => {
    const metaBase64 = btoa(JSON.stringify({ fileKey: "abc" }));
    const html = `<!--(figmeta)${metaBase64}(/figmeta)-->`;
    expect(extractFigmaData(html)).toBeNull();
  });

  it("handles meta with missing fields gracefully", () => {
    const html = buildFigmaHtml({}, [1]);
    const result = extractFigmaData(html);
    expect(result).not.toBeNull();
    expect(result.meta.fileKey).toBeNull();
    expect(result.meta.pasteID).toBeNull();
  });
});
