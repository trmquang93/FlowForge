import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./wireframeToSvg", () => ({
  wireframeToSvg: vi.fn(
    () => '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><rect fill="#ffffff"/></svg>'
  ),
}));

vi.mock("./zipBuilder", () => ({
  downloadZip: vi.fn(),
}));

import {
  getScreenSvg,
  copyScreenForFigma,
  copyScreensForFigma,
  downloadScreenSvg,
} from "./copyToFigma";
import { wireframeToSvg } from "./wireframeToSvg";
import { downloadZip } from "./zipBuilder";

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom does not provide clipboard by default
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    writable: true,
    configurable: true,
  });
});

describe("getScreenSvg", () => {
  it("returns svgContent when present", () => {
    const screen = { svgContent: "<svg>raw</svg>" };
    expect(getScreenSvg(screen)).toBe("<svg>raw</svg>");
  });

  it("falls back to wireframeToSvg when svgContent is absent", () => {
    const screen = { wireframe: { components: [] } };
    getScreenSvg(screen);
    expect(wireframeToSvg).toHaveBeenCalledWith(screen.wireframe);
  });

  it("returns null when neither svgContent nor wireframe exists", () => {
    expect(getScreenSvg({})).toBeNull();
  });

  it("prefers svgContent over wireframe", () => {
    const screen = {
      svgContent: "<svg>preferred</svg>",
      wireframe: { components: [] },
    };
    expect(getScreenSvg(screen)).toBe("<svg>preferred</svg>");
    expect(wireframeToSvg).not.toHaveBeenCalled();
  });
});

describe("copyScreenForFigma", () => {
  it("copies SVG to clipboard and returns true", async () => {
    const screen = { svgContent: "<svg><rect/></svg>" };
    const result = await copyScreenForFigma(screen);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it("returns false when no SVG is available", async () => {
    const result = await copyScreenForFigma({});
    expect(result).toBe(false);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("applies prepareSvgForFigma to transform patterns into gradients", async () => {
    // SVG with a pattern wrapping a linearGradient -- Figma can't read patterns
    const svgWithPattern = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">',
      "<defs>",
      '<pattern id="pat1" patternUnits="objectBoundingBox" width="1" height="1">',
      '<linearGradient id="grad1"><stop offset="0" stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient>',
      "</pattern>",
      "</defs>",
      '<rect fill="url(#pat1)"/>',
      "</svg>",
    ].join("");

    const screen = { svgContent: svgWithPattern };
    await copyScreenForFigma(screen);

    const written = navigator.clipboard.writeText.mock.calls[0][0];
    // Pattern should be removed, gradient hoisted, fill updated
    expect(written).toContain('fill="url(#grad1)"');
    expect(written).not.toContain("<pattern");
    expect(written).toContain("<linearGradient");
  });

  it("passes through SVG unchanged when no patterns exist", async () => {
    const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>';
    const screen = { svgContent: simpleSvg };
    await copyScreenForFigma(screen);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(simpleSvg);
  });
});

describe("copyScreensForFigma", () => {
  it("returns false for empty array", async () => {
    const result = await copyScreensForFigma([]);
    expect(result).toBe(false);
  });

  it("returns false when no screens have SVG content", async () => {
    const result = await copyScreensForFigma([{}, {}]);
    expect(result).toBe(false);
  });

  it("copies single screen without grouping", async () => {
    const screen = { svgContent: '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>' };
    const result = await copyScreensForFigma([screen]);
    expect(result).toBe(1);
    const written = navigator.clipboard.writeText.mock.calls[0][0];
    // Should not have <g transform= grouping for single screen
    expect(written).not.toContain("<g transform=");
  });

  it("combines multiple screens into positioned groups", async () => {
    const screens = [
      {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><rect id="r1"/></svg>',
        x: 0, y: 0, width: 220, name: "Home",
      },
      {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><rect id="r2"/></svg>',
        x: 300, y: 0, width: 220, name: "Profile",
      },
    ];
    const result = await copyScreensForFigma(screens);
    expect(result).toBe(2);
    const written = navigator.clipboard.writeText.mock.calls[0][0];
    expect(written).toContain('data-screen="Home"');
    expect(written).toContain('data-screen="Profile"');
    expect(written).toContain("<g transform=");
  });

  it("prefixes IDs to avoid collisions between screens", async () => {
    const screens = [
      {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><defs></defs><rect id="foo"/></svg>',
        x: 0, y: 0, width: 220, name: "A",
      },
      {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><defs></defs><rect id="foo"/></svg>',
        x: 300, y: 0, width: 220, name: "B",
      },
    ];
    await copyScreensForFigma(screens);
    const written = navigator.clipboard.writeText.mock.calls[0][0];
    expect(written).toContain('id="s0_foo"');
    expect(written).toContain('id="s1_foo"');
  });

  it("returns the count of screens with SVG content", async () => {
    const screens = [
      { svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><defs></defs><rect/></svg>', x: 0, y: 0, width: 220, name: "A" },
      {}, // no SVG
      { svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="393" height="852" viewBox="0 0 393 852"><defs></defs><rect/></svg>', x: 300, y: 0, width: 220, name: "C" },
    ];
    const result = await copyScreensForFigma(screens);
    expect(result).toBe(2);
  });
});

describe("downloadScreenSvg", () => {
  it("calls downloadZip with blob and filename", () => {
    const screen = { name: "Login", svgContent: "<svg/>" };
    const result = downloadScreenSvg(screen);
    expect(result).toBe(true);
    expect(downloadZip).toHaveBeenCalledTimes(1);
    const [blob, filename] = downloadZip.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toBe("Login.svg");
  });

  it("uses 'screen' as default filename when name is absent", () => {
    const screen = { svgContent: "<svg/>" };
    downloadScreenSvg(screen);
    const [, filename] = downloadZip.mock.calls[0];
    expect(filename).toBe("screen.svg");
  });

  it("returns false when no SVG is available", () => {
    expect(downloadScreenSvg({})).toBe(false);
    expect(downloadZip).not.toHaveBeenCalled();
  });
});
