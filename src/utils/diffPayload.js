/**
 * Diffs an incoming payload against current canvas state to identify
 * added or modified entity IDs. Deleted entities are excluded — they
 * cannot be flashed since they no longer exist when state updates.
 *
 * @param {{ screens: Array, connections: Array, stickyNotes: Array }} current
 * @param {{ screens: Array, connections: Array, stickyNotes: Array }} incoming
 * @returns {Set<string>} IDs of added or modified entities
 */
export function diffPayload(current, incoming) {
  const changedIds = new Set();

  const screenMap = new Map((current.screens || []).map((s) => [s.id, s]));
  for (const s of (incoming.screens || [])) {
    const existing = screenMap.get(s.id);
    if (!existing || JSON.stringify(existing) !== JSON.stringify(s)) {
      changedIds.add(s.id);
    }
  }

  const connMap = new Map((current.connections || []).map((c) => [c.id, c]));
  for (const c of (incoming.connections || [])) {
    const existing = connMap.get(c.id);
    if (!existing || JSON.stringify(existing) !== JSON.stringify(c)) {
      changedIds.add(c.id);
    }
  }

  const stickyMap = new Map((current.stickyNotes || []).map((n) => [n.id, n]));
  for (const n of (incoming.stickyNotes || [])) {
    const existing = stickyMap.get(n.id);
    if (!existing || JSON.stringify(existing) !== JSON.stringify(n)) {
      changedIds.add(n.id);
    }
  }

  return changedIds;
}
