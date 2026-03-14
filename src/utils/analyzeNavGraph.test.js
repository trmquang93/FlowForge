import { describe, it, expect } from "vitest";
import { analyzeNavGraph } from "./analyzeNavGraph.js";

const makeScreen = (id, name, x = 0, y = 0) => ({
  id,
  name,
  x,
  y,
  width: 200,
  hotspots: [],
});

const makeConn = (from, to, action = "navigate") => ({
  id: `c-${from}-${to}`,
  fromScreenId: from,
  toScreenId: to,
  action,
});

describe("analyzeNavGraph", () => {
  // --- Entry screens ---

  it("identifies screens with no incoming connections as entry points", () => {
    const screens = [makeScreen("s1", "Home"), makeScreen("s2", "Detail")];
    const connections = [makeConn("s1", "s2")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.entryScreens).toEqual([{ id: "s1", name: "Home" }]);
  });

  it("returns multiple entry points when several screens have no incoming", () => {
    const screens = [
      makeScreen("s1", "Home"),
      makeScreen("s2", "Settings"),
      makeScreen("s3", "Detail"),
    ];
    const connections = [makeConn("s1", "s3"), makeConn("s2", "s3")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.entryScreens).toHaveLength(2);
    expect(result.entryScreens.map((e) => e.id)).toContain("s1");
    expect(result.entryScreens.map((e) => e.id)).toContain("s2");
  });

  it("falls back to leftmost screen when all screens have incoming connections", () => {
    const screens = [
      makeScreen("s1", "Right", 500),
      makeScreen("s2", "Left", 100),
    ];
    const connections = [makeConn("s1", "s2"), makeConn("s2", "s1")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.entryScreens).toEqual([{ id: "s2", name: "Left" }]);
  });

  it("returns empty entry screens for empty screens array", () => {
    const result = analyzeNavGraph([], []);
    expect(result.entryScreens).toEqual([]);
  });

  it("does not crash with empty inputs", () => {
    const result = analyzeNavGraph([], []);
    expect(result).toHaveProperty("entryScreens");
    expect(result).toHaveProperty("tabBarPatterns");
    expect(result).toHaveProperty("modalScreens");
    expect(result).toHaveProperty("backLoops");
    expect(result).toHaveProperty("navigationSummary");
  });

  // --- Tab bar patterns ---

  it("detects tab bar pattern with 3 outgoing navigate connections within Y-range <= 100", () => {
    const screens = [
      makeScreen("hub", "Tab Bar", 0, 0),
      makeScreen("t1", "Tab 1", 300, 10),
      makeScreen("t2", "Tab 2", 600, 50),
      makeScreen("t3", "Tab 3", 900, 80),
    ];
    const connections = [
      makeConn("hub", "t1"),
      makeConn("hub", "t2"),
      makeConn("hub", "t3"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.tabBarPatterns).toHaveLength(1);
    expect(result.tabBarPatterns[0].hubScreenId).toBe("hub");
    expect(result.tabBarPatterns[0].tabs).toHaveLength(3);
  });

  it("does not detect tab bar when fewer than 3 outgoing connections", () => {
    const screens = [
      makeScreen("hub", "Hub"),
      makeScreen("t1", "Tab 1", 300, 0),
      makeScreen("t2", "Tab 2", 600, 0),
    ];
    const connections = [makeConn("hub", "t1"), makeConn("hub", "t2")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.tabBarPatterns).toHaveLength(0);
  });

  it("does not detect tab bar when Y-range exceeds 100", () => {
    const screens = [
      makeScreen("hub", "Hub"),
      makeScreen("t1", "Tab 1", 300, 0),
      makeScreen("t2", "Tab 2", 600, 200),
      makeScreen("t3", "Tab 3", 900, 300),
    ];
    const connections = [
      makeConn("hub", "t1"),
      makeConn("hub", "t2"),
      makeConn("hub", "t3"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.tabBarPatterns).toHaveLength(0);
  });

  it("sorts tab bar patterns by tab count descending", () => {
    const screens = [
      makeScreen("h1", "Small Hub", 0, 0),
      makeScreen("a1", "A1", 300, 0),
      makeScreen("a2", "A2", 600, 0),
      makeScreen("a3", "A3", 900, 0),
      makeScreen("h2", "Big Hub", 0, 500),
      makeScreen("b1", "B1", 300, 500),
      makeScreen("b2", "B2", 600, 500),
      makeScreen("b3", "B3", 900, 500),
      makeScreen("b4", "B4", 1200, 500),
    ];
    const connections = [
      makeConn("h1", "a1"),
      makeConn("h1", "a2"),
      makeConn("h1", "a3"),
      makeConn("h2", "b1"),
      makeConn("h2", "b2"),
      makeConn("h2", "b3"),
      makeConn("h2", "b4"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.tabBarPatterns).toHaveLength(2);
    expect(result.tabBarPatterns[0].tabs.length).toBeGreaterThanOrEqual(
      result.tabBarPatterns[1].tabs.length
    );
  });

  it("ignores non-navigate connections for tab bar detection", () => {
    const screens = [
      makeScreen("hub", "Hub"),
      makeScreen("t1", "T1", 300, 0),
      makeScreen("t2", "T2", 600, 0),
      makeScreen("t3", "T3", 900, 0),
    ];
    const connections = [
      makeConn("hub", "t1", "navigate"),
      makeConn("hub", "t2", "navigate"),
      makeConn("hub", "t3", "modal"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.tabBarPatterns).toHaveLength(0);
  });

  // --- Modal screens ---

  it("detects screens reached via modal action", () => {
    const screens = [makeScreen("s1", "Home"), makeScreen("s2", "Popup")];
    const connections = [makeConn("s1", "s2", "modal")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.modalScreens).toHaveLength(1);
    expect(result.modalScreens[0].id).toBe("s2");
    expect(result.modalScreens[0].name).toBe("Popup");
    expect(result.modalScreens[0].presentedFrom.id).toBe("s1");
  });

  it("deduplicates modals when multiple sources point to same target", () => {
    const screens = [
      makeScreen("s1", "Home"),
      makeScreen("s2", "Settings"),
      makeScreen("s3", "Modal"),
    ];
    const connections = [
      makeConn("s1", "s3", "modal"),
      makeConn("s2", "s3", "modal"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.modalScreens).toHaveLength(1);
    expect(result.modalScreens[0].id).toBe("s3");
  });

  it("returns empty modals when no modal connections exist", () => {
    const screens = [makeScreen("s1", "Home"), makeScreen("s2", "Detail")];
    const connections = [makeConn("s1", "s2")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.modalScreens).toHaveLength(0);
  });

  // --- Back loops ---

  it("detects back loops from back action connections", () => {
    const screens = [makeScreen("s1", "Detail"), makeScreen("s2", "Home")];
    const connections = [makeConn("s1", "s2", "back")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.backLoops).toHaveLength(1);
    expect(result.backLoops[0].from.id).toBe("s1");
    expect(result.backLoops[0].to.id).toBe("s2");
  });

  it("returns empty back loops when no back connections exist", () => {
    const screens = [makeScreen("s1", "Home")];
    const result = analyzeNavGraph(screens, []);
    expect(result.backLoops).toHaveLength(0);
  });

  // --- Navigation summary ---

  it("summary uses singular form for single entry point", () => {
    const screens = [makeScreen("s1", "Home")];
    const result = analyzeNavGraph(screens, []);
    expect(result.navigationSummary).toContain("Entry point:");
    expect(result.navigationSummary).toContain("Home");
  });

  it("summary uses plural form for multiple entry points", () => {
    const screens = [makeScreen("s1", "Home"), makeScreen("s2", "Login")];
    const result = analyzeNavGraph(screens, []);
    expect(result.navigationSummary).toContain("Entry points:");
    expect(result.navigationSummary).toContain("Home");
    expect(result.navigationSummary).toContain("Login");
  });

  it("summary mentions stack navigation when no tab bar detected", () => {
    const screens = [makeScreen("s1", "Home"), makeScreen("s2", "Detail")];
    const connections = [makeConn("s1", "s2")];
    const result = analyzeNavGraph(screens, connections);
    expect(result.navigationSummary).toContain("stack navigation");
  });

  it("summary mentions tab bar hub when tab pattern detected", () => {
    const screens = [
      makeScreen("hub", "Main", 0, 0),
      makeScreen("t1", "Feed", 300, 0),
      makeScreen("t2", "Search", 600, 0),
      makeScreen("t3", "Profile", 900, 0),
    ];
    const connections = [
      makeConn("hub", "t1"),
      makeConn("hub", "t2"),
      makeConn("hub", "t3"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.navigationSummary).toContain("tab bar hub");
    expect(result.navigationSummary).toContain("Main");
  });

  it("summary includes back navigation descriptions", () => {
    const screens = [makeScreen("s1", "Detail"), makeScreen("s2", "Home")];
    const connections = [
      makeConn("s2", "s1"),
      makeConn("s1", "s2", "back"),
    ];
    const result = analyzeNavGraph(screens, connections);
    expect(result.navigationSummary).toContain("Back navigation:");
    expect(result.navigationSummary).toContain("Detail back to Home");
  });
});
