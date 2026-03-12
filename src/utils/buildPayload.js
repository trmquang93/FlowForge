export function buildPayload(screens, connections, pan, zoom, documents = [], featureBrief = "") {
  return {
    version: 7,
    metadata: {
      name: "Untitled Flow",
      exportedAt: new Date().toISOString(),
      screenCount: screens.length,
      connectionCount: connections.length,
      documentCount: documents.length,
      featureBrief,
    },
    viewport: { pan: { x: pan.x, y: pan.y }, zoom },
    screens,
    connections,
    documents,
  };
}
