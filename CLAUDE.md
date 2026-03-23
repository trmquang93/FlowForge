# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drawd is a visual **mobile app flow designer** — a React application that lets users design app navigation flows by uploading screen images, placing them on an infinite canvas, defining interactive hotspots/tap areas, connecting screens with navigation links, and generating AI build instructions from the resulting flow.

## Architecture

### Project Structure

```
drawd.jsx                  — Re-export entry point (backwards compat)
src/
  Drawd.jsx                — Main component (orchestrator)
  components/
    ScreenNode.jsx          — Draggable screen card with image, hotspots, action buttons
    ScreensPanel.jsx        — Left panel listing all screens with thumbnails; click to select + pan canvas
    ConnectionLines.jsx     — SVG layer rendering interactive navigation arrows between screens
    HotspotModal.jsx        — Modal for creating/editing hotspot tap areas
    ConnectionEditModal.jsx — Modal for editing plain (non-hotspot) connections and conditional branching
    ConditionalPrompt.jsx   — Floating prompt for drag-to-create conditional branches
    InlineConditionLabels.jsx — Positioned inputs for editing condition labels on canvas
    DocumentsPanel.jsx      — Full-screen panel for managing project-level documents
    InstructionsPanel.jsx   — Panel displaying generated AI build instructions
    RenameModal.jsx         — Modal for renaming screens
    ImportConfirmModal.jsx  — Modal for import replace/merge confirmation
    TopBar.jsx              — Top toolbar with File dropdown (New/Open/Save As/Import/Export), upload, generate
    Sidebar.jsx             — Right panel showing selected screen details, implementation notes
    BatchHotspotBar.jsx     — Floating action bar for batch hotspot operations (copy/paste/delete)
    ShortcutsPanel.jsx      — Keyboard shortcuts reference modal (toggled with ?)
    EmptyState.jsx          — Empty canvas placeholder
    ShareModal.jsx          — Create/join collaboration room modal
    CollabPresence.jsx      — Peer avatar circles with role dropdown (TopBar)
    CollabBadge.jsx         — Room code pill + connection status + leave button
    ParticipantsPanel.jsx   — Slide-out right panel listing all room participants with roles
    RemoteCursors.jsx       — World-space remote cursor arrows with name labels
    HostLeftModal.jsx       — "Session ended" modal when host disconnects
  collab/
    supabaseClient.js       — Singleton Supabase client (reads VITE_SUPABASE_URL/KEY from env)
  hooks/
    useCanvas.js                — Pan, zoom, and drag logic
    useScreenManager.js         — Screen/connection/hotspot CRUD state
    useFilePersistence.js       — Auto-save to connected .drawd file via File System Access API
    useConnectionInteraction.js — Connection drag/click/conditional-branch state and callbacks
    useHotspotInteraction.js    — Hotspot draw/resize/reposition/drag state and callbacks
    useCanvasMouseHandlers.js   — Canvas onMouseDown/Move/Up/Leave handlers + cursor logic
    useImportExport.js          — Import/export/merge file logic and state
    useKeyboardShortcuts.js     — Global keyboard shortcut useEffect
    useCollaboration.js         — Real-time collaboration via Supabase Realtime (Broadcast + Presence)
  styles/
    theme.js                — COLORS, FONTS, FONT_LINK, shared style objects
  utils/
    generateId.js           — Unique ID generator (timestamp + random)
    generateInstructions.js — Legacy single-string AI instruction generator (delegates to generateInstructionFiles)
    generateInstructionFiles.js — Multi-file AI instruction generator (index.md, main.md, screens.md, navigation.md, build-guide.md, documents.md, tasks.md)
    instructionRenderers.js — Registry of hotspot action renderers (PLATFORM_TERMINOLOGY, HOTSPOT_ACTION_RENDERERS, renderHotspotDetailBlock, renderBuildGuideActionTable)
    generateReqIds.js       — Stable requirement ID generators (screenReqId, hotspotReqId, connectionReqId)
    validateInstructions.js — Pre-generation validation: SCREEN_EMPTY, BROKEN_HOTSPOT_TARGET, BROKEN_DOC_REF, API_NO_ENDPOINT, BROKEN_CONNECTION
    analyzeNavGraph.js      — Navigation graph analysis (entry points, tab bars, modals, back loops)
    zipBuilder.js           — Zero-dependency browser-native ZIP file creator (STORE compression)
    buildPayload.js         — Pure function to construct .drawd JSON payload (used by export and auto-save)
    exportFlow.js           — Export screens/connections/documents as .drawd JSON file
    importFlow.js           — Parse and validate .drawd JSON files (v1, v2, v3, v4, v5, and v6)
    mergeFlow.js            — Remap IDs and offset positions for merge imports
    parseFigmaClipboard.js  — Detect, extract, and render Figma clipboard data (uses @grida/refig)
```

### Component Hierarchy

```
Drawd (src/Drawd.jsx)
  ├── TopBar — Toolbar: File dropdown (New/Open/Save As/Import/Export), upload, add blank, generate
  ├── ScreensPanel — Left panel: scrollable screen list with thumbnails; click to select + center canvas
  ├── Canvas area
  │   ├── ConnectionLines — SVG bezier arrows between screens
  │   ├── ConditionalPrompt — Floating "Create conditional branches?" prompt
  │   ├── InlineConditionLabels — Inline text inputs at connection midpoints for condition labels
  │   ├── ScreenNode[] — Draggable screen cards
  │   └── EmptyState — Shown when no screens exist
  ├── Sidebar — Selected screen details, hotspot list, implementation notes, incoming links
  ├── HotspotModal — Create/edit hotspot tap areas and actions
  ├── ConnectionEditModal — Edit plain connections (label, target, conditional branching)
  ├── DocumentsPanel — Project-level document management (full-screen overlay)
  ├── InstructionsPanel — Generated AI build instructions viewer
  ├── RenameModal — Screen rename dialog
  ├── ImportConfirmModal — Import replace/merge confirmation dialog
  ├── BatchHotspotBar — Floating bar shown when hotspots are multi-selected
  ├── ParticipantsPanel — Slide-out right panel listing room participants with roles
  └── ShortcutsPanel — Keyboard shortcuts reference modal
```

### Key Data Structures

- **screens[]** — `{ id, name, x, y, width, imageData, imageWidth, imageHeight, description, notes, hotspots[], stateGroup, stateName, figmaSource }`
- **connections[]** — `{ id, fromScreenId, toScreenId, hotspotId, label, action, connectionPath, condition, conditionGroupId }`
- **documents[]** — `{ id, name, content, createdAt }` — Project-level reusable documents (API specs, design guides, etc.)
- **connectionPath values**: `default`, `api-success`, `api-error`, `condition-0`, `condition-1`, ... `condition-N`
- **connection.condition** — `string`. The condition text for conditional connections (e.g., "user is subscriber"). Empty string for non-conditional connections.
- **connection.conditionGroupId** — `string | null`. Shared ID grouping conditional branch connections from the same source. Used for plain (non-hotspot) conditional connections. `null` = standalone connection.
- **hotspot** — `{ id, label, elementType, x, y, w, h (all %), action, targetScreenId, apiEndpoint, apiMethod, customDescription, documentId, onSuccessAction, onSuccessTargetId, onSuccessCustomDesc, onErrorAction, onErrorTargetId, onErrorCustomDesc }`
- **elementType values**: `button`, `text-input`, `toggle`, `card`, `icon`, `link`, `image`, `tab`, `list-item`, `other`
- **Hotspot actions**: `navigate`, `back`, `modal`, `conditional`, `api`, `custom`
- **api action fields**: `apiEndpoint` (string, e.g. "/api/users"), `apiMethod` ("GET"|"POST"|"PUT"|"DELETE"|"PATCH"), `documentId` (string|null, references a document in documents[])
- **api follow-up fields**: `onSuccessAction`/`onErrorAction` ("navigate"|"back"|"modal"|"custom"|""), `onSuccessTargetId`/`onErrorTargetId` (screen ID), `onSuccessCustomDesc`/`onErrorCustomDesc` (string)
- **conditional action fields**: `conditions` (array of `{ id, label, targetScreenId }` — each branch defines a condition text and target screen)
- **custom action fields**: `customDescription` (string, free-text behavior description)
- **.drawd file** — `{ version: 1|2|3|4|5|6|7|8|9|10, metadata: { name, exportedAt, screenCount, connectionCount, documentCount, featureBrief, taskLink, techStack }, viewport: { pan, zoom }, screens[], connections[], documents[], dataModels[], stickyNotes[], screenGroups[] }`. v2 adds elementType, apiEndpoint, apiMethod, customDescription to hotspots. v3 adds apiDocs, onSuccessAction, onSuccessTargetId, onSuccessCustomDesc, onErrorAction, onErrorTargetId, onErrorCustomDesc to hotspots and connectionPath to connections. v4 adds stateGroup and stateName to screens. v5 replaces inline apiDocs with top-level documents[] and documentId references on hotspots. v6 adds conditions[] to hotspots (conditional branching) and condition field to connections. v7 adds notes field to screens. v10 (current) adds featureBrief, taskLink, techStack to metadata and dataModels, stickyNotes, screenGroups top-level arrays. `importFlow.js` backfills missing fields for older versions.
- **notes** — `string`. Free-form implementation notes for a screen (technical context, edge cases). Persisted to `.drawd` and included in AI instruction output as a blockquote callout. Empty string when unused.
- **stateGroup** — `string | null`. Shared group ID for screens that are variants of the same logical screen. `null` = standalone.
- **stateName** — `string`. Label for the screen state (e.g., "Default", "Loading", "Error"). Empty string for standalone screens.
- **figmaSource** — `{ fileKey, frameName, importedAt } | null`. Metadata from Figma clipboard paste. `null` for non-Figma screens.

### Custom Hooks

- **useCanvas** — Manages pan/zoom state, canvas mouse events (drag, pan, wheel zoom). Returns `{ pan, setPan, zoom, setZoom, isPanning, dragging, canvasRef, handleDragStart, handleMouseMove, handleMouseUp, handleCanvasMouseDown }`.
- **useScreenManager(pan, zoom, canvasRef)** — Manages screens, connections, documents, and hotspot CRUD. Returns screen/connection/document state, all mutation callbacks, plus `replaceAll(screens, connections, counter, documents)` and `mergeAll(screens, connections, documents)` for import. Also provides `moveHotspot(screenId, hotspotId, x, y)`, `updateScreenDimensions(screenId, imageWidth, imageHeight)`, `quickConnectHotspot(screenId, hotspotId, targetScreenId)` for interactive hotspot features, and `updateConnection(connectionId, patch)` / `deleteConnection(connectionId)` for direct connection manipulation. Plain connection editing: `saveConnectionGroup(originalConnId, payload)` handles navigate-or-conditional save from ConnectionEditModal, `deleteConnectionGroup(conditionGroupId)` removes all connections in a condition group. Drag-to-create conditional branches: `convertToConditionalGroup(existingConnId, fromScreenId, toScreenId)` converts an existing connection + new target into a conditional group (single undo step, returns groupId), `addToConditionalGroup(fromScreenId, toScreenId, conditionGroupId)` adds a new branch to an existing group. Document CRUD: `addDocument(name, content)` returns new ID synchronously, `updateDocument(docId, patch)`, `deleteDocument(docId)` (also clears documentId on any referencing hotspots). Batch hotspot ops: `deleteHotspots(screenId, ids[])` removes multiple hotspots and their connections in one undo step; `pasteHotspots(screenId, hotspots[])` clones hotspot objects with new IDs, offset +5% position, and cleared `targetScreenId`. Screen notes: `updateScreenNotes(screenId, notes)` persists free-form implementation notes. Also provides undo/redo via `canUndo`, `canRedo`, `undo()`, `redo()`, `captureDragSnapshot()`, `commitDragSnapshot()`.
  - **Screen placement**: `addScreen()` places screens on a grid layout (used by file upload and drag-and-drop). `addScreenAtCenter(imageData, name, offset)` places screens at the viewport center in world coordinates (used by paste and "Add Blank"). Multiple pasted images are staggered diagonally with `offset * 30px`.
  - **Screen states**: `addState(parentScreenId)` creates a variant screen 250px right of parent, sharing a `stateGroup` ID. If the parent has no group yet, one is generated and the parent gets `stateName: "Default"`. `updateStateName(screenId, stateName)` updates the state label. `removeScreen()` auto-cleans: if only one screen remains in a group after deletion, its `stateGroup` and `stateName` are cleared.
  - **Batch hotspot operations**: `deleteHotspots` and `pasteHotspots` operate on arrays of hotspot IDs, each as a single undo step. Paste offsets positions by +5% (clamped to image bounds) and assigns fresh IDs so originals are unaffected.

### Design System

Colors and shared styles are in `src/styles/theme.js`:
- `COLORS` — One Dark Pro theme with blue accent (`#61afef`). Named opacity tokens `accent005`–`accent04` (11 levels) avoid inline rgba repetition. `btnPrimary` uses dark text (`#282c34`) on the blue background for WCAG AA compliance.
- `FONTS` — `{ ui, mono, heading }` font family constants
- `styles` — Reusable style objects: `monoLabel`, `input`, `select`, `modalOverlay`, `modalCard`, `modalTitle`, `btnPrimary`, `btnCancel`, `btnDanger`

### Canvas System

- **Pan**: Click-drag on empty canvas area
- **Zoom**: Mouse wheel (range 0.2x - 2x)
- **Drag-and-drop**: Images can be dropped directly onto the canvas
- **Screen dragging**: Click-drag on screen nodes to reposition
- **Figma paste**: Copy a frame in Figma → Cmd/Ctrl+V → frame is rendered via `@grida/refig` (Skia WASM) and added as a named screen. Uses `parseFigmaClipboard.js` utilities. Loading overlay shown during render; errors shown as auto-dismiss toast.

### Keyboard Shortcuts Panel

- **Toggle**: Press `?` anywhere on the canvas (blocked when focus is in input/textarea).
- **Close**: Press `Escape` or click the overlay.
- **Component**: `ShortcutsPanel` — a modal overlay listing all shortcuts grouped by category (General, Canvas, Editing, File).
- **State**: `showShortcuts` boolean in Drawd.jsx. Treated as a modal for purposes of blocking Delete/Undo/Redo keyboard handlers.

### Interactive Hotspot Features

- **Draw tap areas**: Click-and-drag on screen image to draw a rectangle. On release, HotspotModal opens with pre-filled x/y/w/h percentages. Min size guard: 2% w and h.
- **Select and reposition**: Click a hotspot to select it (purple highlight + glow). Click again to begin drag-reposition within image bounds.
- **Drag-from-hotspot to connect**: Drag from a selected hotspot's green handle (right edge) to another screen to create a navigation connection without modal. Preview line renders in success color.
- **Multi-select**: Shift+click hotspots to toggle selection (amber highlight). Multi-select is constrained to a single screen. Clicking canvas or a hotspot without Shift clears the selection. When hotspots are selected, `BatchHotspotBar` appears with Copy / Paste / Delete / Cancel actions. Delete/Backspace also deletes the selection. Escape clears it.
- **Batch copy/paste**: Copying stores hotspot objects in a `hotspotClipboard` ref in Drawd.jsx (not serialized). Paste targets the currently selected screen, inserting clones with new IDs and +5% offset via `pasteHotspots`.
- **hotspotInteraction state** in Drawd.jsx: `{ mode: "selected"|"draw"|"reposition"|"hotspot-drag"|"resize"|"conn-endpoint-drag", screenId, hotspotId, ... }`
- **selectedHotspots state** in Drawd.jsx: `[{ screenId, hotspotId }]`. Separate from `hotspotInteraction`. Alt+drag clears it; Shift+click builds it.
- **Connection line origins**: When a connection has a `hotspotId` and the screen has `imageHeight`, lines originate from hotspot center instead of screen right edge.

### Interactive Connection Lines

- **Click to select**: Click a connection line to highlight it (solid stroke, glow, brighter color) and show draggable endpoint handles. Transparent wide hit-path (`strokeWidth: 12`, `pointerEvents: "stroke"`) provides generous click target without blocking canvas.
- **Double-click to edit**: Double-click a connection line to open HotspotModal for its associated hotspot.
- **Drag endpoints to reroute**: Drag the from/to endpoint circles to reroute a connection to a different screen. Live bezier preview follows the mouse. Only updates the connection record (`fromScreenId`/`toScreenId`), not the hotspot.
- **Delete with keyboard**: Press Delete/Backspace to remove the selected connection. Only removes the connection record; the associated hotspot remains.
- **selectedConnection state** in Drawd.jsx: Separate from `hotspotInteraction`. Selecting a connection clears hotspot interaction and vice versa. Clicking empty canvas clears both.
- **Endpoint drag** uses `hotspotInteraction` mode `"conn-endpoint-drag"` to reuse the existing mouse pipeline: `{ mode, connectionId, endpoint: "from"|"to", mouseX, mouseY }`.
- **ConnectionLines helpers**: `computePoints(conn, screens)` (exported) extracts from/to coordinates and control point; `bezierD()` builds the SVG path string.

### Drag-to-Create Conditional Branches

- **Scenario 1 — New group**: Dragging a second non-hotspot connection from the same screen shows a `ConditionalPrompt` floating card near the source screen. "Yes" converts both connections into a conditional group (amber lines with shared `conditionGroupId`); "No" creates a normal connection.
- **Scenario 2 — Join existing group**: If the source screen already has a conditional group, dragging a new connection auto-joins it as `condition-N` without a prompt.
- **Inline label editing**: After creating/joining a group, `InlineConditionLabels` renders positioned `<input>` elements at each connection's bezier midpoint. Enter advances to the next input; Enter on the last or Escape closes editing.
- **Dismissal**: Clicking canvas while prompt is open treats as "No". Escape dismisses the prompt without creating any connection.
- **State**: `conditionalPrompt` (prompt position + IDs) and `editingConditionGroup` (groupId) in Drawd.jsx. Both are guarded in Delete/Undo/Redo keyboard handlers.

### Undo/Redo System

- **Snapshot-based**: Each undoable action stores a `{ screens, connections }` snapshot (deep clone via JSON) before the mutation. History stack lives in a `useRef` (`historyRef`) to avoid re-renders on push/pop.
- **Discrete mutations** (`addScreen`, `addScreenAtCenter`, `removeScreen`, `renameScreen`, `saveHotspot`, `deleteHotspot`, `deleteHotspots`, `pasteHotspots`, `quickConnectHotspot`, `addConnection`, `convertToConditionalGroup`, `addToConditionalGroup`, `updateConnection`, `deleteConnection`, `updateScreenDescription`, `updateScreenNotes`) call `pushHistory()` before mutating.
- **Continuous drags** (`moveScreen`, `moveHotspot`, `resizeHotspot`) do NOT push history per frame. Instead, `captureDragSnapshot()` is called at drag-start and `commitDragSnapshot()` at drag-end, producing a single undo step.
- **Import operations** (`replaceAll`, `mergeAll`) clear the history stack entirely.
- **Not undoable**: `updateScreenDimensions` (layout-only, triggered by image load).
- **Keyboard shortcuts**: `Cmd/Ctrl+Z` for undo, `Cmd/Ctrl+Shift+Z` for redo. Guarded: skipped when focus is in input/textarea or any modal is open.
- **UI**: Undo/redo buttons in `TopBar` between stats and "Upload Screens" button.

### File Persistence (Auto-Save)

- **File System Access API**: Uses `showOpenFilePicker`/`showSaveFilePicker` to obtain a `FileSystemFileHandle` for silent read/write to a local `.drawd` file. Chromium-only (Chrome/Edge); gracefully hidden in other browsers.
- **Auto-save**: `useFilePersistence` hook watches `screens` and `connections` via `useEffect`. When a connected file handle exists, changes are debounced at 1500ms and written to disk automatically.
- **FileHandle in useRef**: The `FileSystemFileHandle` is not serializable and must never enter the undo/redo JSON clone pipeline, so it's stored in a `useRef`.
- **Pan/zoom in refs**: Viewport changes do NOT trigger auto-save; only screen/connection mutations do.
- **skipNextSaveRef**: Prevents a redundant save immediately after opening a file (since `replaceAll` triggers the `useEffect`).
- **New flow**: File > New clears all screens, connections, documents, undo history, resets viewport to origin, and disconnects any open file handle. Shows `window.confirm` when screens exist.
- **Open replaces canvas**: Opening a file always replaces current state. Import remains available for merging.
- **Keyboard shortcuts**: `Cmd/Ctrl+S` saves immediately (or opens Save As picker if no file connected, or falls back to Export download); `Cmd/Ctrl+O` opens a file.
- **UI**: File dropdown menu in TopBar with New, Open, Save As (Chromium only), Import, Export. Connected filename shown as a badge with a save status dot (yellow pulse = saving, green = saved, red = error).
- **buildPayload.js**: Pure function extracted from `exportFlow.js` to construct the `.drawd` JSON payload, reused by both export and auto-save. Also exports `buildCollabPayload` (omits version/viewport/metadata for lighter collaboration payloads).

### Real-Time Collaboration

- **Supabase Realtime**: Uses `@supabase/supabase-js` with Broadcast (state relay) and Presence (peer tracking). No custom server needed. Configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
- **supabaseClient.js**: Singleton in `src/collab/`. Returns `null` if env vars are missing (graceful degradation).
- **useCollaboration hook**: Manages channel subscription, state broadcasting (host + editors, 500ms debounce), state receiving (viewers via `applyRemoteState`), cursor tracking via Presence metadata (50ms throttle), role management, and host departure detection.
- **Room model**: Host generates a 6-char alphanumeric code. Channel name = `room:CODE`. Guests subscribe and receive initial state when host detects their presence join.
- **Sync model**: Both host and editors broadcast full document state (sans viewport/images when unchanged) on changes. Viewers apply remote state via `replaceAll`. Last-write-wins with 500ms debounce. Viewers are read-only and never broadcast.
- **Read-only enforcement**: Two layers: (1) `isReadOnly` prop cascades through all components, disabling inputs and hiding mutation buttons. (2) Early-returns in `useCanvasMouseHandlers` and `useKeyboardShortcuts` block mutation operations. Canvas pan/zoom remain enabled.
- **Mid-interaction safety**: Remote state updates arriving during a drag operation are queued in `pendingRemoteStateRef` and applied on mouseUp.
- **Deep linking**: `#/editor?room=CODE` auto-opens ShareModal in join mode. Parsed in `App.jsx` and passed as `initialRoomCode` to `Drawd`.
- **UI components**: `ShareModal` (create/join tabs), `CollabBadge` (room code pill + status), `CollabPresence` (peer avatars with role dropdown), `RemoteCursors` (world-space SVG arrows), `HostLeftModal` (session ended prompt).

### AI Instruction Generation

- **Multi-file output**: `generateInstructionFiles(screens, connections, options)` in `src/utils/generateInstructionFiles.js` produces a structured `{ files: [{name, content}], images: [{name, data}] }` object. Files: `index.md` (master checklist/manifest, always first), `main.md`, `screens.md`, `navigation.md`, `build-guide.md`, optional `documents.md` and `types.md`, and `tasks.md`. Every `.md` file is prefixed with a `<!-- drawd-schema: N | generated: ISO-timestamp -->` header.
- **Schema versioning**: `INSTRUCTION_SCHEMA_VERSION` constant at the top of `generateInstructionFiles.js`. Increment when the generated format changes in a breaking way. The version appears in `index.md` metadata and in the comment header of every file.
- **Hotspot action registry**: `src/utils/instructionRenderers.js` exports `HOTSPOT_ACTION_RENDERERS` — an object keyed by action name, each with `tableActionLabel(h)`, `detailBlock(h, screens, documents)`, and `buildGuideRow(pt)`. Adding a new action type requires only one entry in this registry. Also exports `renderHotspotDetailBlock` and `renderBuildGuideActionTable` used by `generateInstructionFiles.js`. `PLATFORM_TERMINOLOGY` lives here too.
- **Stable requirement IDs**: `src/utils/generateReqIds.js` exports `screenReqId(screen)` → `SCR-{8chars}`, `hotspotReqId(screen, hotspot)` → `HSP-{8chars}-{4chars}`, `connectionReqId(conn)` → `NAV-{4chars}`. These IDs appear in the Screen Roster table (`main.md`), screen headings (`screens.md`), the All Connections table (`navigation.md`), and task headings (`tasks.md`), allowing cross-file tracking without relying on sequential numbers.
- **Pre-generation validation**: `validateInstructions(screens, connections, options)` in `src/utils/validateInstructions.js` returns `Array<{level, code, message, entityId}>`. Checks: `SCREEN_EMPTY`, `BROKEN_HOTSPOT_TARGET`, `BROKEN_DOC_REF`, `API_NO_ENDPOINT`, `BROKEN_CONNECTION`. Called in `onGenerate` in `Drawd.jsx` before `generateInstructionFiles`. Errors show a `window.confirm` dialog; warnings are embedded in `main.md` as a `## Validation Warnings` callout. The warnings array is passed as `options.warnings` to `generateInstructionFiles`.
- **index.md manifest**: Generated by `generateIndexMd` inside `generateInstructionFiles.js`. Contains schema version, generation timestamp, Files in This Package table, Screen Checklist (ID, checkbox, name, status, image ref, hotspot count, connection count), and Navigation Summary. Always the first file/tab.
- **main.md structure** (generated by `generateMainMd`): Designed for both single-agent and multi-agent consumption. Section order: title → Validation Warnings → Feature Brief → summary table → entry/nav summary → **Instruction Files table** (where sibling files live) → **How to Use These Instructions** (dual-mode: single-agent vs orchestrator) → **Planning Requirements** (AI must include spec references in its plan per screen) → **Screen Roster** (with `Spec` column pointing to `screens.md` section per screen) → Feature Areas/Context Screens → **Implementation Workflow** (6 H3-headed steps in proper markdown — not a code block) → **Delegation & Progress Tracking** (with failure mode warning) → Design Override → **Final Integration** → Open Questions. The "File Reference" bottom section was removed (absorbed into the Instruction Files table). The previous "you do NOT need to read the detail files" instruction was removed.
- **Platform-specific**: Accepts `options.platform` ("auto"|"swiftui"|"react-native"|"flutter"|"jetpack-compose") to customize build guide with framework-specific code patterns.
- **Navigation analysis**: Uses `analyzeNavGraph()` from `src/utils/analyzeNavGraph.js` to detect entry screens, tab bar patterns, modal screens, and back loops.
- **Device detection**: `detectDeviceType(imageWidth, imageHeight)` maps screen dimensions to device categories (iPhone, iPad, Android, etc.).
- **Image extraction**: Base64 `imageData` is converted to PNG files in the `images/` folder of the ZIP output.
- **ZIP download**: `buildZip()` + `downloadZip()` from `src/utils/zipBuilder.js` create and download a ZIP file containing all instruction files and images.
- **Legacy compat**: `generateInstructions(screens, connections)` in `src/utils/generateInstructions.js` delegates to `generateInstructionFiles` and concatenates all file contents.
- **InstructionsPanel**: Tabbed UI showing each file, with rendered markdown view (toggle to raw), per-section copy, copy-all, and download ZIP buttons.
- **Platform selector**: Dropdown in TopBar next to the Generate button. State managed as `platformPreference` in Drawd.jsx.
- **Screen descriptions**: Editable on ALL screens (not just blank ones) via the Sidebar.
- **Implementation notes**: Each screen has a `notes` field editable in the Sidebar below the description. Notes are saved on textarea blur. Included in `screens.md` output as a `> **Implementation Notes:**` blockquote.

## Code Conventions

- Styles use shared objects from `theme.js`, spread with inline overrides where needed
- IDs generated via `generateId()` using timestamp + random string
- React hooks: `useState`, `useRef`, `useCallback`, `useEffect` only
- No external state management — state split between `useCanvas` and `useScreenManager` hooks
- No TypeScript — plain JSX
- Hash-based routing in `src/App.jsx`: `getRoute()` maps `window.location.hash` to `"landing"` | `"editor"` | `"docs"`. Landing is the default (no hash). A `hashchange` event listener drives route transitions.
- No build system — bare ESM imports of React
- **No analytics in this repo** — Analytics (GA4, Vercel Analytics) live in the private deployment wrapper (`drawd-private`), not here. Do not add analytics code to this repo.

### User Guide / Docs Page

- **Route**: `#/docs`
- **Page**: `src/pages/DocsPage.jsx` — sticky sidebar table of contents + scroll-spy via `IntersectionObserver`. Responsive: sidebar collapses to inline mobile ToC below 860px.
- **Content**: `src/pages/docs/docsContent.jsx` — exports `DOC_SECTIONS`, an array of `{ id, title, content: JSX }` objects. Add, remove, or reorder sections here.
- **Shared CSS**: `src/pages/landing/globalCss.js` — shared by both `LandingPage.jsx` and `DocsPage.jsx`. Avoid duplicating CSS between the two pages.
- **Theme**: uses `L_COLORS` and `L_FONTS` from `src/pages/landing/landingTheme.js`.
- **NavBar**: accepts a `mode` prop (`"landing"` | `"docs"`). In docs mode, the center section links navigate to the landing page via hash rather than scrolling in-page.

## Working with This Codebase

- `src/Drawd.jsx` is the orchestrator (~580 lines). It wires hooks to components and manages all canvas interaction state.
- To add new canvas interactions, extend `useCanvas` hook or `useCanvasMouseHandlers` hook.
- To add new screen/connection operations, extend `useScreenManager` hook.
- To add new UI sections, create a component in `src/components/` and compose it in `Drawd.jsx`.
- When adding new shared styles, add them to `styles` in `src/styles/theme.js`.
- `drawd.jsx` at the root is a re-export for backwards compatibility.
- **User guide**: Every feature change or addition **must** include an update to the user guide in `src/pages/docs/userGuide.md`. When planning an implementation, always add a step for updating the relevant section (or creating a new `## Section`). The guide is the single source of truth for end users — if a feature isn't documented there, it doesn't exist to them. The markdown supports `### ` subsections, `- ` lists, `` `backtick` `` for kbd elements, `> [!TIP]` / `> [!NOTE]` callout blocks, and `| \`key\` | action |` shortcut rows.

## Repository & Deployment Architecture

### Open-Source Repo (this repo)

- **GitHub**: `codeflow-studio/drawd`
- **Contains**: All application source code, no analytics, no deployment config
- **CI**: `.github/workflows/ci.yml` — `npm ci` → `npm run lint` → `npx vite build` → `npm test` on every push/PR to `main`
- **Not deployed directly** — deployment is managed by the private wrapper repo

### Private Wrapper Repo (`drawd-private`)

- **GitHub**: `trmquang93/drawd-private` (private)
- **Purpose**: Wraps this repo as a git submodule, adds proprietary layers (analytics, future auth)
- **Structure**:
  - `FlowForge/` — git submodule pointing to `codeflow-studio/drawd`
  - `src/main.jsx` → `src/WrapperApp.jsx` → imports `App` from submodule
  - `src/analytics/useRouteTracking.js` — GA4 hash-route page view tracking
  - `index.html` — includes GA4 script tag (`G-MYXS4VD6PQ`, `send_page_view: false`)
  - `vite.config.js` — `publicDir` → `FlowForge/public`, `resolve.dedupe` for React, `@grida/refig` node stubs and alias
  - `vercel.json` — SPA rewrites (moved from this repo)
- **Deployed to**: Vercel (drawd.app)
- **Env vars** (set in Vercel): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Submodule update**: `npm run submodule:update` pulls latest from this repo's main branch

### Key Separation Rules

- **Never add analytics, auth, or deployment config to this repo** — those belong in `drawd-private`
- **Never modify files inside `FlowForge/`** from the wrapper — all customization lives in the wrapper's `src/`, `index.html`, and `vite.config.js`
- When this repo adds a new dependency, mirror it in `drawd-private/package.json`

### GitHub Actions

- **Workflow**: `.github/workflows/ci.yml` — runs on every push and pull request targeting `main`.
- **Job name**: `Lint, Build & Test` (this exact string is the required status check name in branch protection).
- **Steps**: `npm ci` → `npm run lint` (ESLint) → `npx vite build` → `npm test` (Vitest).
- **Node version**: 20 (update to 24 by June 2026 when GitHub deprecates Node 20 on runners).

### Branch Protection (main)

| Rule | Setting |
|---|---|
| Required status check | `Lint, Build & Test` (strict — branch must be up-to-date) |
| Required PR reviews | 1 approval; stale reviews dismissed on new push |
| Force pushes | Blocked |
| Branch deletion | Blocked |

All merges to `main` must go through a pull request and pass CI. Direct pushes are rejected (admin bypass is off).

## Maintaining This Document

**IMPORTANT**: This CLAUDE.md file should be kept up-to-date as the project evolves.

### When to Update CLAUDE.md

Update this file when:
- **Architecture changes** — New components, hooks, or file structure changes
- **New features added** — New hotspot actions, canvas tools, export formats
- **Dependencies added** — If a build system or package.json is introduced
- **Conventions evolve** — New coding patterns or file organization
- **User guide content changed** — When features are added, modified, or removed, update the corresponding section in `src/pages/docs/docsContent.jsx`

### How to Update

Run the `/claude-init` skill to regenerate or enhance this file, or manually update specific sections as changes occur.
