import { describe, it, expect } from "vitest";
import { handleGenerationTool } from "./generation-tools.js";

const makeMockState = (overrides = {}) => ({
  screens: [
    {
      id: "s1",
      name: "Login",
      x: 0,
      y: 0,
      hotspots: [
        { id: "h1", label: "Login Button", x: 10, y: 80, width: 80, height: 10, action: "navigate" },
      ],
      imageData: null,
      imageWidth: 390,
      imageHeight: 844,
    },
    {
      id: "s2",
      name: "Dashboard",
      x: 400,
      y: 0,
      hotspots: [],
      imageData: null,
      imageWidth: 390,
      imageHeight: 844,
    },
  ],
  connections: [
    { id: "c1", fromScreenId: "s1", toScreenId: "s2", hotspotId: "h1", label: "Login tap" },
  ],
  documents: [],
  dataModels: [],
  screenGroups: [],
  metadata: {
    name: "Test Flow",
    featureBrief: "A test feature brief",
    taskLink: "",
    techStack: {},
  },
  filePath: "/tmp/test.drawd",
  ...overrides,
});

// ── generate_instructions ────────────────────────────────────────────────────

describe("handleGenerationTool — generate_instructions", () => {
  it("returns content blocks with markdown text", () => {
    const state = makeMockState();
    const result = handleGenerationTool("generate_instructions", {}, state);
    expect(result.__contentBlocks).toBeDefined();
    expect(result.__contentBlocks[0].type).toBe("text");
    expect(result.__contentBlocks[0].text).toContain("# AI Build Instructions");
  });

  it("includes MCP tool guidance table instead of file references", () => {
    const state = makeMockState();
    const result = handleGenerationTool("generate_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("get_screen_instructions");
    expect(text).toContain("get_navigation_instructions");
    expect(text).toContain("get_build_guide");
    // Should NOT reference reading files
    expect(text).not.toContain("| `screens.md`");
    expect(text).not.toContain("| `navigation.md`");
  });

  it("includes feature brief in output", () => {
    const state = makeMockState();
    const result = handleGenerationTool("generate_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("A test feature brief");
  });

  it("scopes to specific screenIds when provided", () => {
    const state = makeMockState();
    const result = handleGenerationTool("generate_instructions", { screenIds: ["s1"] }, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("Login");
    // Dashboard should not appear in the roster as a screen to build
    // (it may appear as a connection target reference but not in the main roster)
  });

  it("throws error when all screenIds are invalid", () => {
    const state = makeMockState();
    expect(() =>
      handleGenerationTool("generate_instructions", { screenIds: ["nonexistent"] }, state)
    ).toThrow("No screens matched");
  });

  it("includes validation warnings when issues exist", () => {
    const state = makeMockState({
      connections: [
        { id: "c1", fromScreenId: "s1", toScreenId: "deleted-screen", label: "Broken" },
      ],
    });
    const result = handleGenerationTool("generate_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("Validation Warnings");
  });

  it("respects platform parameter", () => {
    const state = makeMockState();
    const result = handleGenerationTool("generate_instructions", { platform: "swiftui" }, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("SwiftUI");
  });

  it("appends tasks content", () => {
    const state = makeMockState({
      screens: [
        {
          id: "s1",
          name: "Login",
          x: 0,
          y: 0,
          hotspots: [{ id: "h1", label: "Submit", x: 10, y: 80, width: 80, height: 10, action: "navigate" }],
          imageData: null,
          acceptanceCriteria: ["User can log in with email"],
        },
        { id: "s2", name: "Dashboard", x: 400, y: 0, hotspots: [], imageData: null },
      ],
    });
    const result = handleGenerationTool("generate_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("# Tasks");
  });
});

// ── get_screen_instructions ──────────────────────────────────────────────────

describe("handleGenerationTool — get_screen_instructions", () => {
  it("returns all screen specs when no screenId provided", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_screen_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("# Screens");
    expect(text).toContain("Login");
    expect(text).toContain("Dashboard");
  });

  it("returns single screen section when screenId provided", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_screen_instructions", { screenId: "s1" }, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("Login");
    // Should not include the full "# Screens" header for all screens
    expect(text).not.toContain("# Screens");
  });

  it("throws when screenId does not exist", () => {
    const state = makeMockState();
    expect(() =>
      handleGenerationTool("get_screen_instructions", { screenId: "nonexistent" }, state)
    ).toThrow("Screen not found");
  });
});

// ── get_navigation_instructions ──────────────────────────────────────────────

describe("handleGenerationTool — get_navigation_instructions", () => {
  it("returns navigation markdown with connections", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_navigation_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("# Navigation Architecture");
    expect(text).toContain("All Connections");
  });

  it("includes entry screen detection", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_navigation_instructions", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("Entry Screen");
  });
});

// ── get_build_guide ──────────────────────────────────────────────────────────

describe("handleGenerationTool — get_build_guide", () => {
  it("returns build guide markdown", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_build_guide", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("# Build Guide");
  });

  it("respects platform parameter", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_build_guide", { platform: "swiftui" }, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("SwiftUI");
  });

  it("defaults to auto platform", () => {
    const state = makeMockState();
    const result = handleGenerationTool("get_build_guide", {}, state);
    const text = result.__contentBlocks[0].text;
    expect(text).toContain("Implementation Instructions");
  });
});

// ── validate_flow ────────────────────────────────────────────────────────────

describe("handleGenerationTool — validate_flow", () => {
  it("returns empty issues for valid flow", () => {
    const state = makeMockState({
      screens: [
        { id: "s1", name: "Login", x: 0, y: 0, hotspots: [], imageData: null, description: "Login screen" },
        { id: "s2", name: "Dashboard", x: 400, y: 0, hotspots: [], imageData: null, description: "Dashboard screen" },
      ],
    });
    const result = handleGenerationTool("validate_flow", {}, state);
    expect(result.issueCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects broken connection targets", () => {
    const state = makeMockState({
      connections: [
        { id: "c1", fromScreenId: "s1", toScreenId: "deleted-id", label: "Broken" },
      ],
    });
    const result = handleGenerationTool("validate_flow", {}, state);
    expect(result.issueCount).toBeGreaterThan(0);
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
  });
});

// ── analyze_navigation ───────────────────────────────────────────────────────

describe("handleGenerationTool — analyze_navigation", () => {
  it("returns navigation analysis with entry screens", () => {
    const state = makeMockState();
    const result = handleGenerationTool("analyze_navigation", {}, state);
    expect(result).toHaveProperty("entryScreens");
    expect(result.entryScreens.length).toBeGreaterThan(0);
  });
});

// ── Unknown tool ─────────────────────────────────────────────────────────────

describe("handleGenerationTool — unknown tool", () => {
  it("throws for an unrecognized tool name", () => {
    const state = makeMockState();
    expect(() => handleGenerationTool("bad_tool", {}, state)).toThrow("Unknown generation tool");
  });
});
