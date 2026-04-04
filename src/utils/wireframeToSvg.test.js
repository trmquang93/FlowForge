import { describe, it, expect } from "vitest";
import { wireframeToSvg } from "./wireframeToSvg";

function makeComponent(overrides = {}) {
  return {
    id: "c1",
    type: "rect",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    text: "",
    style: {},
    ...overrides,
  };
}

function makeWireframe(components = [], viewport) {
  return {
    components,
    viewport: viewport || { width: 393, height: 852 },
  };
}

describe("wireframeToSvg", () => {
  describe("null/empty handling", () => {
    it("returns null for null input", () => {
      expect(wireframeToSvg(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(wireframeToSvg(undefined)).toBeNull();
    });

    it("returns SVG with only background rect for empty components", () => {
      const svg = wireframeToSvg(makeWireframe([]));
      expect(svg).toContain("<svg");
      expect(svg).toContain('fill="#ffffff"');
      // Only the background rect, no other elements
      const rectCount = (svg.match(/<rect /g) || []).length;
      expect(rectCount).toBe(1);
    });
  });

  describe("viewport", () => {
    it("uses default 393x852 viewport when not specified", () => {
      const svg = wireframeToSvg({ components: [] });
      expect(svg).toContain('width="393"');
      expect(svg).toContain('height="852"');
      expect(svg).toContain('viewBox="0 0 393 852"');
    });

    it("uses custom viewport dimensions", () => {
      const svg = wireframeToSvg(makeWireframe([], { width: 375, height: 667 }));
      expect(svg).toContain('width="375"');
      expect(svg).toContain('height="667"');
      expect(svg).toContain('viewBox="0 0 375 667"');
    });
  });

  describe("XML escaping", () => {
    it("escapes special characters in text content", () => {
      const comp = makeComponent({
        type: "text",
        text: 'A & B <C> "D"',
        style: { fill: "transparent" },
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("A &amp; B &lt;C&gt; &quot;D&quot;");
      // Raw characters should not appear unescaped in output
      expect(svg).not.toMatch(/A & B/);
    });
  });

  describe("component rendering", () => {
    it("renders rect with default fill and no stroke", () => {
      const comp = makeComponent({ type: "rect", x: 5, y: 10, width: 80, height: 40 });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain('fill="#f0f0f0"');
      expect(svg).toContain('stroke="none"');
    });

    it("renders rect with custom fill, stroke, and borderRadius", () => {
      const comp = makeComponent({
        type: "rect",
        style: { fill: "#ff0000", stroke: "#00ff00", borderRadius: 12 },
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain('fill="#ff0000"');
      expect(svg).toContain('stroke="#00ff00"');
      expect(svg).toContain('rx="12"');
    });

    it("renders text component with label", () => {
      const comp = makeComponent({ type: "text", text: "Hello World" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("<text");
      expect(svg).toContain("Hello World");
    });

    it("renders text with background fill when style.fill is set", () => {
      const comp = makeComponent({
        type: "text",
        text: "Label",
        style: { fill: "#eeeeee" },
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      // Should have a background rect before the text
      expect(svg).toContain('fill="#eeeeee"');
      expect(svg).toContain("<text");
    });

    it("renders text without background when fill is transparent", () => {
      const comp = makeComponent({
        type: "text",
        text: "Label",
        style: { fill: "transparent" },
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      // Background rect should use the white bg only, text component should not add one
      const bgRect = svg.match(/<rect[^>]*fill="#ffffff"[^>]*\/>/);
      expect(bgRect).not.toBeNull();
      // Only the background rect (fill="#ffffff"), no extra rect for the text
      const allRects = svg.match(/<rect /g) || [];
      expect(allRects.length).toBe(1);
    });

    it("renders button with white text on filled rect", () => {
      const comp = makeComponent({ type: "button", text: "Submit" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain('fill="#333333"'); // button background
      expect(svg).toContain('fill="#ffffff"'); // button text color (and bg rect)
      expect(svg).toContain('font-weight="bold"');
      expect(svg).toContain("Submit");
    });

    it("renders input with placeholder text and border", () => {
      const comp = makeComponent({ type: "input", text: "Email..." });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain('stroke="#cccccc"');
      expect(svg).toContain('fill="#aaaaaa"'); // placeholder text color
      expect(svg).toContain("Email...");
    });

    it("renders icon as a rounded rect", () => {
      const comp = makeComponent({
        type: "icon",
        width: 24,
        height: 24,
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      // rx defaults to Math.min(w,h)/4 = 6
      expect(svg).toContain('rx="6"');
      expect(svg).toContain('fill="#cccccc"');
    });

    it("renders image-placeholder with diagonal lines and label", () => {
      const comp = makeComponent({ type: "image-placeholder" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      // Two diagonal lines
      const lineCount = (svg.match(/<line /g) || []).length;
      expect(lineCount).toBe(2);
      // Default label "Image"
      expect(svg).toContain("Image");
    });

    it("renders image-placeholder with custom label", () => {
      const comp = makeComponent({ type: "image-placeholder", text: "Avatar" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("Avatar");
    });

    it("renders list-item with text, bottom border, and chevron", () => {
      const comp = makeComponent({ type: "list-item", text: "Settings" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("Settings");
      expect(svg).toContain("<line"); // bottom border
      expect(svg).toContain("<polyline"); // chevron
    });

    it("renders nav-bar with centered bold title", () => {
      const comp = makeComponent({ type: "nav-bar", text: "Profile" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("Profile");
      expect(svg).toContain('font-weight="bold"');
      expect(svg).toContain('text-anchor="middle"');
    });

    it("renders tab-bar splitting comma-separated text into tabs", () => {
      const comp = makeComponent({
        type: "tab-bar",
        text: "Home,Search,Profile",
        width: 393,
        height: 49,
      });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("Home");
      expect(svg).toContain("Search");
      expect(svg).toContain("Profile");
      // 3 tab labels + 3 icon circles
      const circleCount = (svg.match(/<circle /g) || []).length;
      expect(circleCount).toBe(3);
    });

    it("renders tab-bar with defaults when text is empty", () => {
      const comp = makeComponent({ type: "tab-bar", text: "", width: 393, height: 49 });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("Tab1");
      expect(svg).toContain("Tab2");
      expect(svg).toContain("Tab3");
    });

    it("renders divider as a horizontal line", () => {
      const comp = makeComponent({ type: "divider", x: 25, y: 100, width: 343 });
      const svg = wireframeToSvg(makeWireframe([comp]));
      expect(svg).toContain("<line");
      expect(svg).toContain('x1="25"');
      expect(svg).toContain('y1="100"');
      expect(svg).toContain('x2="368"'); // 25 + 343
      expect(svg).toContain('y2="100"');
    });

    it("falls back to rect rendering for unknown type", () => {
      const comp = makeComponent({ type: "something-new" });
      const svg = wireframeToSvg(makeWireframe([comp]));
      // Should produce a rect (background + fallback)
      const rectCount = (svg.match(/<rect /g) || []).length;
      expect(rectCount).toBe(2); // background + component
    });
  });

  describe("multiple components", () => {
    it("renders all components in order", () => {
      const comps = [
        makeComponent({ id: "c1", type: "nav-bar", text: "Title", y: 0 }),
        makeComponent({ id: "c2", type: "button", text: "Login", y: 100 }),
        makeComponent({ id: "c3", type: "input", text: "Email", y: 200 }),
      ];
      const svg = wireframeToSvg(makeWireframe(comps));
      expect(svg).toContain("Title");
      expect(svg).toContain("Login");
      expect(svg).toContain("Email");
      // Title appears before Login in the SVG string
      expect(svg.indexOf("Title")).toBeLessThan(svg.indexOf("Login"));
      expect(svg.indexOf("Login")).toBeLessThan(svg.indexOf("Email"));
    });
  });
});
