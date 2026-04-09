import { describe, it, expect } from "vitest";
import { diffFlows } from "./diffFlows";

function makeFlow(overrides = {}) {
  return {
    version: 14,
    metadata: {
      name: "Test Flow",
      exportedAt: new Date().toISOString(),
      screenCount: 0,
      connectionCount: 0,
      documentCount: 0,
      featureBrief: "",
      taskLink: "",
      techStack: {},
    },
    viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
    screens: [],
    connections: [],
    documents: [],
    dataModels: [],
    stickyNotes: [],
    screenGroups: [],
    comments: [],
    ...overrides,
  };
}

function makeScreen(id, overrides = {}) {
  return {
    id,
    name: `Screen ${id}`,
    x: 0,
    y: 0,
    width: 220,
    imageData: null,
    description: "",
    notes: "",
    codeRef: "",
    status: "new",
    acceptanceCriteria: [],
    roles: [],
    tbd: false,
    tbdNote: "",
    stateGroup: null,
    stateName: "",
    figmaSource: null,
    svgContent: null,
    sourceHtml: null,
    wireframe: null,
    hotspots: [],
    ...overrides,
  };
}

function makeConnection(id, from, to, overrides = {}) {
  return {
    id,
    fromScreenId: from,
    toScreenId: to,
    hotspotId: null,
    label: "",
    condition: "",
    connectionPath: "default",
    conditionGroupId: null,
    transitionType: null,
    transitionLabel: "",
    dataFlow: [],
    ...overrides,
  };
}

function makeHotspot(id, overrides = {}) {
  return {
    id,
    label: `Hotspot ${id}`,
    x: 10,
    y: 10,
    w: 20,
    h: 20,
    action: "navigate",
    elementType: "button",
    interactionType: "tap",
    targetScreenId: null,
    transitionType: null,
    transitionLabel: "",
    apiEndpoint: "",
    apiMethod: "",
    requestSchema: "",
    responseSchema: "",
    documentId: null,
    customDescription: "",
    onSuccessAction: "",
    onSuccessTargetId: "",
    onSuccessCustomDesc: "",
    onErrorAction: "",
    onErrorTargetId: "",
    onErrorCustomDesc: "",
    tbd: false,
    tbdNote: "",
    conditions: [],
    dataFlow: [],
    onSuccessDataFlow: [],
    onErrorDataFlow: [],
    accessibility: null,
    validation: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe("diffFlows", () => {
  it("reports zero changes for identical flows", () => {
    const flow = makeFlow({
      screens: [makeScreen("s1")],
      connections: [makeConnection("c1", "s1", "s1")],
    });

    const result = diffFlows(flow, JSON.parse(JSON.stringify(flow)));

    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
    expect(result.summary.unchanged).toBe(2); // 1 screen + 1 connection
  });

  it("detects added screens", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1")] });
    const flowB = makeFlow({ screens: [makeScreen("s1"), makeScreen("s2")] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.added).toHaveLength(1);
    expect(result.categories.screens.added[0].id).toBe("s2");
    expect(result.summary.added).toBe(1);
  });

  it("detects removed screens", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1"), makeScreen("s2")] });
    const flowB = makeFlow({ screens: [makeScreen("s1")] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.removed).toHaveLength(1);
    expect(result.categories.screens.removed[0].id).toBe("s2");
    expect(result.summary.removed).toBe(1);
  });

  it("detects modified screen fields", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1", { name: "Login" })] });
    const flowB = makeFlow({ screens: [makeScreen("s1", { name: "Sign In" })] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.modified).toHaveLength(1);
    const mod = result.categories.screens.modified[0];
    expect(mod.id).toBe("s1");
    expect(mod.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "name", from: "Login", to: "Sign In" }),
      ]),
    );
  });

  it("detects image changes via fingerprint", () => {
    const imgA = "data:image/png;base64," + "A".repeat(1000);
    const imgB = "data:image/png;base64," + "B".repeat(1000);

    const flowA = makeFlow({ screens: [makeScreen("s1", { imageData: imgA })] });
    const flowB = makeFlow({ screens: [makeScreen("s1", { imageData: imgB })] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.modified).toHaveLength(1);
    const changes = result.categories.screens.modified[0].changes;
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "imageData" }),
      ]),
    );
  });

  it("treats identical images as unchanged", () => {
    const img = "data:image/png;base64," + "X".repeat(500);

    const flowA = makeFlow({ screens: [makeScreen("s1", { imageData: img })] });
    const flowB = makeFlow({ screens: [makeScreen("s1", { imageData: img })] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.modified).toHaveLength(0);
    expect(result.categories.screens.unchanged).toBe(1);
  });

  it("detects hotspot additions within a screen", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1", { hotspots: [] })] });
    const flowB = makeFlow({ screens: [makeScreen("s1", { hotspots: [makeHotspot("h1")] })] });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.modified).toHaveLength(1);
    const hotspotChange = result.categories.screens.modified[0].changes.find(
      (c) => c.field === "hotspots",
    );
    expect(hotspotChange).toBeDefined();
    expect(hotspotChange.addedCount).toBe(1);
  });

  it("detects hotspot removals within a screen", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1", { hotspots: [makeHotspot("h1")] })] });
    const flowB = makeFlow({ screens: [makeScreen("s1", { hotspots: [] })] });

    const result = diffFlows(flowA, flowB);

    const hotspotChange = result.categories.screens.modified[0].changes.find(
      (c) => c.field === "hotspots",
    );
    expect(hotspotChange.removedCount).toBe(1);
  });

  it("detects hotspot modifications within a screen", () => {
    const flowA = makeFlow({
      screens: [makeScreen("s1", { hotspots: [makeHotspot("h1", { label: "Login" })] })],
    });
    const flowB = makeFlow({
      screens: [makeScreen("s1", { hotspots: [makeHotspot("h1", { label: "Sign In" })] })],
    });

    const result = diffFlows(flowA, flowB);

    const hotspotChange = result.categories.screens.modified[0].changes.find(
      (c) => c.field === "hotspots",
    );
    expect(hotspotChange.modifiedCount).toBe(1);
    expect(hotspotChange.details[0].changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "label" }),
      ]),
    );
  });

  it("detects connection changes", () => {
    const flowA = makeFlow({
      screens: [makeScreen("s1"), makeScreen("s2")],
      connections: [makeConnection("c1", "s1", "s2", { label: "Next" })],
    });
    const flowB = makeFlow({
      screens: [makeScreen("s1"), makeScreen("s2")],
      connections: [makeConnection("c1", "s1", "s2", { label: "Continue" })],
    });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.connections.modified).toHaveLength(1);
    expect(result.categories.connections.modified[0].changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "label", from: "Next", to: "Continue" }),
      ]),
    );
  });

  it("detects document, dataModel, stickyNote, screenGroup changes", () => {
    const flowA = makeFlow({
      documents: [{ id: "d1", name: "API Docs", content: "old", createdAt: "" }],
      dataModels: [{ id: "dm1", name: "User", schema: { name: { type: "string" } }, createdAt: "" }],
      stickyNotes: [{ id: "sn1", x: 0, y: 0, width: 220, content: "Todo", color: "yellow", author: "" }],
      screenGroups: [{ id: "sg1", name: "Auth", screenIds: ["s1"], color: "#61afef", folderHint: "" }],
    });
    const flowB = makeFlow({
      documents: [{ id: "d1", name: "API Reference", content: "new", createdAt: "" }],
      dataModels: [{ id: "dm1", name: "Account", schema: { name: { type: "string" } }, createdAt: "" }],
      stickyNotes: [{ id: "sn1", x: 0, y: 0, width: 220, content: "Done", color: "green", author: "" }],
      screenGroups: [{ id: "sg1", name: "Authentication", screenIds: ["s1", "s2"], color: "#61afef", folderHint: "" }],
    });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.documents.modified).toHaveLength(1);
    expect(result.categories.dataModels.modified).toHaveLength(1);
    expect(result.categories.stickyNotes.modified).toHaveLength(1);
    expect(result.categories.screenGroups.modified).toHaveLength(1);
  });

  it("excludes viewport differences", () => {
    const flowA = makeFlow({ viewport: { pan: { x: 0, y: 0 }, zoom: 1 } });
    const flowB = makeFlow({ viewport: { pan: { x: 999, y: -500 }, zoom: 3.5 } });

    const result = diffFlows(flowA, flowB);

    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
  });

  it("excludes metadata.exportedAt from diff", () => {
    const flowA = makeFlow();
    const flowB = makeFlow();
    flowA.metadata.exportedAt = "2025-01-01T00:00:00Z";
    flowB.metadata.exportedAt = "2026-04-10T12:00:00Z";

    const result = diffFlows(flowA, flowB);

    expect(result.metadata.modified).toHaveLength(0);
  });

  it("detects metadata field changes", () => {
    const flowA = makeFlow();
    const flowB = makeFlow();
    flowA.metadata.featureBrief = "old brief";
    flowB.metadata.featureBrief = "new brief";

    const result = diffFlows(flowA, flowB);

    expect(result.metadata.modified).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "featureBrief" }),
      ]),
    );
  });

  it("summary counts match category totals", () => {
    const flowA = makeFlow({
      screens: [makeScreen("s1"), makeScreen("s2"), makeScreen("s3")],
      connections: [makeConnection("c1", "s1", "s2")],
      documents: [{ id: "d1", name: "Doc", content: "", createdAt: "" }],
    });
    const flowB = makeFlow({
      screens: [makeScreen("s1", { name: "Renamed" }), makeScreen("s3"), makeScreen("s4")],
      connections: [],
      documents: [{ id: "d1", name: "Doc", content: "", createdAt: "" }, { id: "d2", name: "New", content: "", createdAt: "" }],
    });

    const result = diffFlows(flowA, flowB);

    let totalAdded = 0;
    let totalRemoved = 0;
    let totalModified = 0;
    let totalUnchanged = 0;

    for (const cat of Object.values(result.categories)) {
      totalAdded += cat.added.length;
      totalRemoved += cat.removed.length;
      totalModified += cat.modified.length;
      totalUnchanged += cat.unchanged;
    }

    expect(result.summary.added).toBe(totalAdded);
    expect(result.summary.removed).toBe(totalRemoved);
    expect(result.summary.modified).toBe(totalModified);
    expect(result.summary.unchanged).toBe(totalUnchanged);
  });

  it("detects wireframe/figmaSource existence changes", () => {
    const flowA = makeFlow({ screens: [makeScreen("s1", { wireframe: null, figmaSource: null })] });
    const flowB = makeFlow({
      screens: [makeScreen("s1", {
        wireframe: { type: "basic" },
        figmaSource: { fileKey: "abc", nodeId: "1:2" },
      })],
    });

    const result = diffFlows(flowA, flowB);

    expect(result.categories.screens.modified).toHaveLength(1);
    const changes = result.categories.screens.modified[0].changes;
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "wireframe" }),
        expect.objectContaining({ field: "figmaSource" }),
      ]),
    );
  });
});
