import { describe, it, expect } from "vitest";
import { mergeFlow } from "./mergeFlow.js";

const makeScreen = (id, name, x = 0, overrides = {}) => ({
  id,
  name,
  x,
  y: 0,
  width: 200,
  imageData: "data:image/png;base64,abc",
  hotspots: [],
  stateGroup: null,
  stateName: "",
  ...overrides,
});

const makeConn = (id, from, to, overrides = {}) => ({
  id,
  fromScreenId: from,
  toScreenId: to,
  hotspotId: null,
  connectionPath: "default",
  condition: "",
  conditionGroupId: null,
  ...overrides,
});

const makeDoc = (id, name) => ({
  id,
  name,
  content: `Content for ${name}`,
  createdAt: new Date().toISOString(),
});

describe("mergeFlow", () => {
  it("assigns new IDs to merged screens (different from originals)", () => {
    const screens = [makeScreen("s1", "Home")];
    const result = mergeFlow(screens, [], [], []);
    expect(result.screens).toHaveLength(1);
    expect(result.screens[0].id).not.toBe("s1");
  });

  it("offsets merged screen X positions based on existing screens", () => {
    const imported = [makeScreen("s1", "Home", 0)];
    const existing = [makeScreen("e1", "Existing", 100, { width: 200 })];
    const result = mergeFlow(imported, [], existing, []);
    // maxX = 100 + 200 = 300, offsetX = 300 + 300 = 600
    expect(result.screens[0].x).toBe(600);
  });

  it("does not offset when no existing screens", () => {
    const imported = [makeScreen("s1", "Home", 50)];
    const result = mergeFlow(imported, [], [], []);
    expect(result.screens[0].x).toBe(50);
  });

  it("preserves original screen properties after remap", () => {
    const screens = [makeScreen("s1", "Dashboard", 0, { imageData: "img123" })];
    const result = mergeFlow(screens, [], [], []);
    expect(result.screens[0].name).toBe("Dashboard");
    expect(result.screens[0].imageData).toBe("img123");
  });

  it("remaps hotspot IDs to new IDs", () => {
    const screens = [
      makeScreen("s1", "Home", 0, {
        hotspots: [{ id: "h1", label: "Tap", targetScreenId: null, conditions: [] }],
      }),
    ];
    const result = mergeFlow(screens, [], [], []);
    expect(result.screens[0].hotspots[0].id).not.toBe("h1");
  });

  it("remaps hotspot targetScreenId from old to new screen ID", () => {
    const screens = [
      makeScreen("s1", "Home", 0, {
        hotspots: [{ id: "h1", label: "Go", targetScreenId: "s2", conditions: [] }],
      }),
      makeScreen("s2", "Detail"),
    ];
    const result = mergeFlow(screens, [], [], []);
    const newS2Id = result.screens[1].id;
    expect(result.screens[0].hotspots[0].targetScreenId).toBe(newS2Id);
  });

  it("remaps hotspot documentId from old to new document ID", () => {
    const screens = [
      makeScreen("s1", "Home", 0, {
        hotspots: [
          { id: "h1", label: "API", targetScreenId: null, documentId: "d1", conditions: [] },
        ],
      }),
    ];
    const docs = [makeDoc("d1", "API Spec")];
    const result = mergeFlow(screens, [], [], docs);
    const newDocId = result.documents[0].id;
    expect(newDocId).not.toBe("d1");
    expect(result.screens[0].hotspots[0].documentId).toBe(newDocId);
  });

  it("remaps conditions[].targetScreenId in hotspots", () => {
    const screens = [
      makeScreen("s1", "Home", 0, {
        hotspots: [
          {
            id: "h1",
            label: "Branch",
            targetScreenId: null,
            conditions: [
              { id: "cond1", label: "Admin", targetScreenId: "s2" },
              { id: "cond2", label: "User", targetScreenId: "s1" },
            ],
          },
        ],
      }),
      makeScreen("s2", "Admin"),
    ];
    const result = mergeFlow(screens, [], [], []);
    const newS1Id = result.screens[0].id;
    const newS2Id = result.screens[1].id;
    const conds = result.screens[0].hotspots[0].conditions;
    expect(conds[0].targetScreenId).toBe(newS2Id);
    expect(conds[1].targetScreenId).toBe(newS1Id);
  });

  it("assigns same new stateGroup ID for screens sharing original stateGroup", () => {
    const screens = [
      makeScreen("s1", "Default", 0, { stateGroup: "g1", stateName: "Default" }),
      makeScreen("s2", "Loading", 250, { stateGroup: "g1", stateName: "Loading" }),
    ];
    const result = mergeFlow(screens, [], [], []);
    expect(result.screens[0].stateGroup).toBe(result.screens[1].stateGroup);
    expect(result.screens[0].stateGroup).not.toBe("g1");
  });

  it("remaps connection IDs to new IDs", () => {
    const screens = [makeScreen("s1", "A"), makeScreen("s2", "B")];
    const conns = [makeConn("c1", "s1", "s2")];
    const result = mergeFlow(screens, conns, [], []);
    expect(result.connections[0].id).not.toBe("c1");
  });

  it("remaps connection fromScreenId and toScreenId", () => {
    const screens = [makeScreen("s1", "A"), makeScreen("s2", "B")];
    const conns = [makeConn("c1", "s1", "s2")];
    const result = mergeFlow(screens, conns, [], []);
    const newS1 = result.screens[0].id;
    const newS2 = result.screens[1].id;
    expect(result.connections[0].fromScreenId).toBe(newS1);
    expect(result.connections[0].toScreenId).toBe(newS2);
  });

  it("remaps connection hotspotId", () => {
    const screens = [
      makeScreen("s1", "A", 0, {
        hotspots: [{ id: "h1", label: "Tap", targetScreenId: "s2", conditions: [] }],
      }),
      makeScreen("s2", "B"),
    ];
    const conns = [makeConn("c1", "s1", "s2", { hotspotId: "h1" })];
    const result = mergeFlow(screens, conns, [], []);
    const newHsId = result.screens[0].hotspots[0].id;
    expect(result.connections[0].hotspotId).toBe(newHsId);
  });

  it("remaps document IDs while preserving content", () => {
    const docs = [makeDoc("d1", "API Spec"), makeDoc("d2", "Design Guide")];
    const result = mergeFlow([], [], [], docs);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].id).not.toBe("d1");
    expect(result.documents[1].id).not.toBe("d2");
    expect(result.documents[0].name).toBe("API Spec");
    expect(result.documents[1].name).toBe("Design Guide");
    expect(result.documents[0].content).toBe("Content for API Spec");
  });
});
