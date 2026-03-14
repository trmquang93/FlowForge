import { describe, it, expect } from "vitest";
import { validateInstructions } from "./validateInstructions.js";

const makeScreen = (overrides = {}) => ({
  id: "s1",
  name: "Screen 1",
  imageData: "data:image/png;base64,abc",
  hotspots: [],
  ...overrides,
});

const makeConnection = (overrides = {}) => ({
  id: "c1",
  fromScreenId: "s1",
  toScreenId: "s2",
  ...overrides,
});

describe("validateInstructions", () => {
  it("returns empty array for empty inputs", () => {
    expect(validateInstructions([], [])).toEqual([]);
  });

  it("returns empty array for valid screens and connections", () => {
    const screens = [
      makeScreen({ id: "s1" }),
      makeScreen({ id: "s2", name: "Screen 2" }),
    ];
    const connections = [makeConnection({ fromScreenId: "s1", toScreenId: "s2" })];
    expect(validateInstructions(screens, connections)).toEqual([]);
  });

  // SCREEN_EMPTY
  it("warns when screen has no image and no description", () => {
    const screens = [makeScreen({ imageData: null, description: "" })];
    const issues = validateInstructions(screens, []);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("SCREEN_EMPTY");
    expect(issues[0].level).toBe("warning");
    expect(issues[0].entityId).toBe("s1");
  });

  it("does not warn for screen with description but no image", () => {
    const screens = [makeScreen({ imageData: null, description: "A login screen" })];
    expect(validateInstructions(screens, [])).toEqual([]);
  });

  it("does not warn for screen with image but no description", () => {
    const screens = [makeScreen({ description: undefined })];
    expect(validateInstructions(screens, [])).toEqual([]);
  });

  // BROKEN_HOTSPOT_TARGET
  it("errors when hotspot targets a missing screen", () => {
    const screens = [
      makeScreen({
        hotspots: [{ id: "h1", label: "Go", action: "navigate", targetScreenId: "missing" }],
      }),
    ];
    const issues = validateInstructions(screens, []);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BROKEN_HOTSPOT_TARGET");
    expect(issues[0].level).toBe("error");
    expect(issues[0].entityId).toBe("h1");
  });

  it("does not error when hotspot targets an existing screen", () => {
    const screens = [
      makeScreen({
        id: "s1",
        hotspots: [{ id: "h1", label: "Go", action: "navigate", targetScreenId: "s2" }],
      }),
      makeScreen({ id: "s2", name: "Screen 2" }),
    ];
    expect(validateInstructions(screens, [])).toEqual([]);
  });

  // BROKEN_DOC_REF
  it("warns when hotspot references a missing document", () => {
    const screens = [
      makeScreen({
        hotspots: [{ id: "h1", label: "API", action: "api", documentId: "doc-missing", apiEndpoint: "/api/test" }],
      }),
    ];
    const issues = validateInstructions(screens, [], { documents: [] });
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BROKEN_DOC_REF");
    expect(issues[0].level).toBe("warning");
  });

  it("does not warn when hotspot references an existing document", () => {
    const screens = [
      makeScreen({
        hotspots: [{ id: "h1", label: "API", action: "api", documentId: "doc1", apiEndpoint: "/api/test" }],
      }),
    ];
    const issues = validateInstructions(screens, [], { documents: [{ id: "doc1" }] });
    expect(issues).toEqual([]);
  });

  // API_NO_ENDPOINT
  it("warns when api hotspot has no endpoint", () => {
    const screens = [
      makeScreen({
        hotspots: [{ id: "h1", label: "Fetch", action: "api", apiEndpoint: "" }],
      }),
    ];
    const issues = validateInstructions(screens, []);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("API_NO_ENDPOINT");
    expect(issues[0].level).toBe("warning");
  });

  it("does not warn when api hotspot has an endpoint", () => {
    const screens = [
      makeScreen({
        hotspots: [{ id: "h1", label: "Fetch", action: "api", apiEndpoint: "/api/users" }],
      }),
    ];
    expect(validateInstructions(screens, [])).toEqual([]);
  });

  // BROKEN_CONNECTION
  it("errors when connection references a missing screen", () => {
    const screens = [makeScreen({ id: "s1" })];
    const connections = [makeConnection({ fromScreenId: "s1", toScreenId: "missing" })];
    const issues = validateInstructions(screens, connections);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BROKEN_CONNECTION");
    expect(issues[0].level).toBe("error");
  });

  it("errors when connection fromScreenId is missing", () => {
    const screens = [makeScreen({ id: "s2" })];
    const connections = [makeConnection({ fromScreenId: "missing", toScreenId: "s2" })];
    const issues = validateInstructions(screens, connections);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("BROKEN_CONNECTION");
  });

  // Multiple violations
  it("returns multiple violations in one call", () => {
    const screens = [
      makeScreen({
        id: "s1",
        imageData: null,
        description: "",
        hotspots: [
          { id: "h1", label: "Go", action: "navigate", targetScreenId: "missing" },
          { id: "h2", label: "Fetch", action: "api", apiEndpoint: "" },
        ],
      }),
    ];
    const connections = [makeConnection({ fromScreenId: "s1", toScreenId: "gone" })];
    const issues = validateInstructions(screens, connections);
    expect(issues.length).toBeGreaterThanOrEqual(4);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("SCREEN_EMPTY");
    expect(codes).toContain("BROKEN_HOTSPOT_TARGET");
    expect(codes).toContain("API_NO_ENDPOINT");
    expect(codes).toContain("BROKEN_CONNECTION");
  });
});
