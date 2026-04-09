/**
 * Compares two normalized .drawd flow payloads and returns a structured diff
 * describing added, removed, and modified entities across all categories.
 *
 * Both flows should be normalized through importFlow() before diffing to
 * ensure consistent field defaults and avoid false positives.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cheap fingerprint for large strings (imageData, svgContent, sourceHtml).
 * Avoids multi-MB string comparisons by checking length + boundary chars.
 */
function fingerprint(str) {
  if (!str) return "";
  return `${str.length}:${str.slice(0, 32)}:${str.slice(-32)}`;
}

/**
 * Formats a value for human-readable display in change details.
 */
function displayValue(val) {
  if (val === null || val === undefined) return "(none)";
  if (val === "") return "(empty)";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "string" && val.length > 60) return val.slice(0, 57) + "...";
  if (typeof val === "object") {
    const json = JSON.stringify(val);
    return json.length > 60 ? json.slice(0, 57) + "..." : json;
  }
  return String(val);
}

/**
 * Compare two values. For arrays/objects, uses JSON serialization.
 * For fingerprint fields, compares fingerprints instead of full content.
 */
function valuesEqual(a, b, useFp) {
  if (useFp) return fingerprint(a) === fingerprint(b);
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Diff two entities field-by-field.
 * @param {Object} a - Entity from flow A
 * @param {Object} b - Entity from flow B
 * @param {string[]} fields - Fields to compare with strict/JSON equality
 * @param {string[]} fpFields - Fields to compare with fingerprinting
 * @param {string[]} existFields - Fields to compare by existence (truthy vs falsy)
 * @returns {Array|null} Array of { field, from, to } changes, or null if identical
 */
function diffEntity(a, b, fields, fpFields = [], existFields = []) {
  const changes = [];

  for (const f of fields) {
    if (!valuesEqual(a[f], b[f], false)) {
      changes.push({ field: f, from: displayValue(a[f]), to: displayValue(b[f]) });
    }
  }

  for (const f of fpFields) {
    if (!valuesEqual(a[f], b[f], true)) {
      const fromLabel = a[f] ? "present" : "(none)";
      const toLabel = b[f] ? "changed" : "(none)";
      changes.push({ field: f, from: fromLabel, to: toLabel });
    }
  }

  for (const f of existFields) {
    const aHas = !!a[f];
    const bHas = !!b[f];
    if (aHas !== bHas) {
      changes.push({ field: f, from: aHas ? "present" : "(none)", to: bHas ? "present" : "(none)" });
    }
  }

  return changes.length > 0 ? changes : null;
}

// ---------------------------------------------------------------------------
// Hotspot sub-diffing
// ---------------------------------------------------------------------------

const HOTSPOT_FIELDS = [
  "label", "x", "y", "w", "h",
  "action", "elementType", "interactionType",
  "targetScreenId", "transitionType", "transitionLabel",
  "apiEndpoint", "apiMethod", "requestSchema", "responseSchema", "documentId",
  "customDescription",
  "onSuccessAction", "onSuccessTargetId", "onSuccessCustomDesc",
  "onErrorAction", "onErrorTargetId", "onErrorCustomDesc",
  "tbd", "tbdNote",
  "conditions", "dataFlow", "onSuccessDataFlow", "onErrorDataFlow",
  "accessibility", "validation",
];

function diffHotspots(hotspotsA, hotspotsB) {
  const mapA = new Map((hotspotsA || []).map((h) => [h.id, h]));
  const mapB = new Map((hotspotsB || []).map((h) => [h.id, h]));

  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  const details = [];

  for (const [id, hs] of mapB) {
    if (!mapA.has(id)) {
      addedCount++;
      details.push({ type: "added", id, label: hs.label || id });
    }
  }

  for (const [id, hs] of mapA) {
    if (!mapB.has(id)) {
      removedCount++;
      details.push({ type: "removed", id, label: hs.label || id });
    }
  }

  for (const [id, hsA] of mapA) {
    const hsB = mapB.get(id);
    if (!hsB) continue;
    const changes = diffEntity(hsA, hsB, HOTSPOT_FIELDS);
    if (changes) {
      modifiedCount++;
      details.push({ type: "modified", id, label: hsA.label || id, changes });
    }
  }

  if (addedCount === 0 && removedCount === 0 && modifiedCount === 0) return null;
  return { field: "hotspots", addedCount, removedCount, modifiedCount, details };
}

// ---------------------------------------------------------------------------
// Collection diffing
// ---------------------------------------------------------------------------

const SCREEN_FIELDS = [
  "name", "x", "y", "width",
  "description", "notes", "status", "codeRef",
  "tbd", "tbdNote",
  "roles", "acceptanceCriteria",
  "stateGroup", "stateName",
];
const SCREEN_FP_FIELDS = ["imageData", "svgContent", "sourceHtml"];
const SCREEN_EXIST_FIELDS = ["wireframe", "figmaSource"];

const CONNECTION_FIELDS = [
  "fromScreenId", "toScreenId", "hotspotId",
  "label", "condition", "connectionPath",
  "conditionGroupId", "transitionType", "transitionLabel",
  "dataFlow",
];

const DOCUMENT_FIELDS = ["name", "content"];
const DATA_MODEL_FIELDS = ["name", "schema"];
const STICKY_NOTE_FIELDS = ["x", "y", "content", "color"];
const SCREEN_GROUP_FIELDS = ["name", "screenIds", "color"];

/**
 * Extracts a display name for an entity based on the category.
 */
function entityName(entity, category, flowScreens) {
  if (category === "stickyNotes") {
    const text = entity.content || "";
    return text.length > 40 ? text.slice(0, 37) + "..." : text || "(empty note)";
  }
  if (category === "connections") {
    const from = flowScreens?.get(entity.fromScreenId)?.name || entity.fromScreenId;
    const to = flowScreens?.get(entity.toScreenId)?.name || entity.toScreenId;
    return `${from} -> ${to}`;
  }
  return entity.name || entity.id;
}

function diffCollection(collA, collB, category, fields, opts = {}) {
  const { fpFields = [], existFields = [], includeHotspots = false, screenMapA, screenMapB } = opts;

  const mapA = new Map((collA || []).map((e) => [e.id, e]));
  const mapB = new Map((collB || []).map((e) => [e.id, e]));

  const added = [];
  const removed = [];
  const modified = [];
  let unchanged = 0;

  // Detect added (in B but not in A)
  for (const [id, entity] of mapB) {
    if (!mapA.has(id)) {
      added.push({ id, name: entityName(entity, category, screenMapB) });
    }
  }

  // Detect removed (in A but not in B)
  for (const [id, entity] of mapA) {
    if (!mapB.has(id)) {
      removed.push({ id, name: entityName(entity, category, screenMapA) });
    }
  }

  // Detect modified (in both, but different)
  for (const [id, entityA] of mapA) {
    const entityB = mapB.get(id);
    if (!entityB) continue;

    const changes = diffEntity(entityA, entityB, fields, fpFields, existFields);
    const hotspotDiff = includeHotspots ? diffHotspots(entityA.hotspots, entityB.hotspots) : null;

    if (changes || hotspotDiff) {
      const allChanges = changes || [];
      if (hotspotDiff) allChanges.push(hotspotDiff);
      modified.push({
        id,
        name: entityName(entityA, category, screenMapA),
        changes: allChanges,
      });
    } else {
      unchanged++;
    }
  }

  return { added, removed, modified, unchanged };
}

// ---------------------------------------------------------------------------
// Metadata diffing
// ---------------------------------------------------------------------------

const METADATA_FIELDS = ["name", "featureBrief", "taskLink", "techStack"];

function diffMetadata(metaA, metaB) {
  const a = metaA || {};
  const b = metaB || {};
  const modified = [];

  for (const f of METADATA_FIELDS) {
    if (!valuesEqual(a[f], b[f], false)) {
      modified.push({ field: f, from: displayValue(a[f]), to: displayValue(b[f]) });
    }
  }

  return { modified };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function diffFlows(flowA, flowB) {
  const screenMapA = new Map((flowA.screens || []).map((s) => [s.id, s]));
  const screenMapB = new Map((flowB.screens || []).map((s) => [s.id, s]));

  const categories = {
    screens: diffCollection(
      flowA.screens, flowB.screens, "screens",
      SCREEN_FIELDS,
      { fpFields: SCREEN_FP_FIELDS, existFields: SCREEN_EXIST_FIELDS, includeHotspots: true, screenMapA, screenMapB },
    ),
    connections: diffCollection(
      flowA.connections, flowB.connections, "connections",
      CONNECTION_FIELDS,
      { screenMapA, screenMapB },
    ),
    documents: diffCollection(
      flowA.documents, flowB.documents, "documents",
      DOCUMENT_FIELDS,
    ),
    dataModels: diffCollection(
      flowA.dataModels, flowB.dataModels, "dataModels",
      DATA_MODEL_FIELDS,
    ),
    stickyNotes: diffCollection(
      flowA.stickyNotes, flowB.stickyNotes, "stickyNotes",
      STICKY_NOTE_FIELDS,
    ),
    screenGroups: diffCollection(
      flowA.screenGroups, flowB.screenGroups, "screenGroups",
      SCREEN_GROUP_FIELDS,
    ),
  };

  const metadata = diffMetadata(flowA.metadata, flowB.metadata);

  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  for (const cat of Object.values(categories)) {
    added += cat.added.length;
    removed += cat.removed.length;
    modified += cat.modified.length;
    unchanged += cat.unchanged;
  }

  return {
    summary: { added, removed, modified, unchanged },
    categories,
    metadata,
  };
}
