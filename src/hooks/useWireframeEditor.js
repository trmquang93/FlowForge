import { useState, useRef, useCallback } from "react";
import { WIREFRAME_GRID_SIZE } from "../constants";
import { COMPONENT_DEFAULTS } from "../utils/wireframeDefaults";

function generateId() {
  return `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function snapToGrid(value) {
  return Math.round(value / WIREFRAME_GRID_SIZE) * WIREFRAME_GRID_SIZE;
}

export function useWireframeEditor(initialComponents = [], viewport = { width: 393, height: 852 }) {
  const [components, setComponents] = useState(() =>
    initialComponents.map((c) => ({ ...c }))
  );
  const [selectedId, setSelectedId] = useState(null);

  // Undo/redo stacks (stored in ref for mutation-without-rerender)
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  // Derived state for canUndo/canRedo so components re-render when stacks change
  const [historyLen, setHistoryLen] = useState(0);
  const [redoLen, setRedoLen] = useState(0);

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current, components.map((c) => ({ ...c }))];
    redoRef.current = [];
    setHistoryLen(historyRef.current.length);
    setRedoLen(0);
  }, [components]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    redoRef.current.push(components.map((c) => ({ ...c })));
    setComponents(prev);
    setSelectedId(null);
    setHistoryLen(historyRef.current.length);
    setRedoLen(redoRef.current.length);
  }, [components]);

  const redo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    const next = redoRef.current.pop();
    historyRef.current.push(components.map((c) => ({ ...c })));
    setComponents(next);
    setSelectedId(null);
    setHistoryLen(historyRef.current.length);
    setRedoLen(redoRef.current.length);
  }, [components]);

  const addComponent = useCallback((type, x, y) => {
    pushHistory();
    const defaults = COMPONENT_DEFAULTS[type] || COMPONENT_DEFAULTS.rect;
    const newComp = {
      id: generateId(),
      type,
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: defaults.width,
      height: defaults.height,
      text: defaults.text || "",
      style: { ...defaults.style },
      interactive: defaults.interactive ?? false,
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.id);
    return newComp.id;
  }, [pushHistory]);

  const updateComponent = useCallback((id, updates) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const updateComponentStyle = useCallback((id, styleUpdates) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, style: { ...c.style, ...styleUpdates } } : c))
    );
  }, []);

  const moveComponent = useCallback((id, dx, dy) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          x: snapToGrid(c.x + dx),
          y: snapToGrid(c.y + dy),
        };
      })
    );
  }, []);

  const setComponentPosition = useCallback((id, x, y) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x: snapToGrid(x), y: snapToGrid(y) } : c))
    );
  }, []);

  const resizeComponent = useCallback((id, width, height) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, width: Math.max(8, snapToGrid(width)), height: Math.max(2, snapToGrid(height)) }
          : c
      )
    );
  }, []);

  const deleteComponent = useCallback((id) => {
    pushHistory();
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setSelectedId((sel) => (sel === id ? null : sel));
  }, [pushHistory]);

  const duplicateComponent = useCallback((id) => {
    pushHistory();
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    const newComp = {
      ...comp,
      id: generateId(),
      x: snapToGrid(comp.x + WIREFRAME_GRID_SIZE * 2),
      y: snapToGrid(comp.y + WIREFRAME_GRID_SIZE * 2),
      style: { ...comp.style },
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.id);
  }, [components, pushHistory]);

  const commitMove = useCallback(() => {
    // Snapshot after a drag completes (call from onMouseUp)
    pushHistory();
  }, [pushHistory]);

  const selectedComponent = components.find((c) => c.id === selectedId) || null;
  const canUndo = historyLen > 0;
  const canRedo = redoLen > 0;

  return {
    components,
    selectedId,
    setSelectedId,
    selectedComponent,
    viewport,
    addComponent,
    updateComponent,
    updateComponentStyle,
    moveComponent,
    setComponentPosition,
    resizeComponent,
    deleteComponent,
    duplicateComponent,
    commitMove,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
