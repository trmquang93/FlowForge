import { useCallback } from "react";

const HEADER_HEIGHT = 37;
const resizeCursors = {
  nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize", e: "ew-resize",
  se: "nwse-resize", s: "ns-resize", sw: "nesw-resize", w: "ew-resize",
};

export function useCanvasMouseHandlers({
  // hotspot interaction
  hotspotInteraction,
  setHotspotInteraction,
  commitDragSnapshot,
  screens,
  moveHotspot,
  resizeHotspot,
  updateConnection,
  // connection interaction
  connecting,
  setConnecting,
  cancelConnecting,
  selectedConnection,
  setSelectedConnection,
  conditionalPrompt,
  onConditionalPromptCancel,
  editingConditionGroup,
  setEditingConditionGroup,
  selectedHotspots,
  setSelectedHotspots,
  // canvas hook
  handleCanvasMouseDown,
  handleMouseMove,
  handleMouseUp,
  isSpaceHeld,
  spaceHeld,
  isPanning,
  dragging,
  // screen management
  setSelectedScreen,
  moveScreen,
  // viewport
  pan,
  zoom,
  canvasRef,
}) {
  const onCanvasMouseDown = useCallback((e) => {
    // Space+click: always pan, skip all interaction guards
    if (isSpaceHeld.current) {
      if (selectedConnection) setSelectedConnection(null);
      if (hotspotInteraction && hotspotInteraction.mode !== "draw" && hotspotInteraction.mode !== "reposition" && hotspotInteraction.mode !== "hotspot-drag" && hotspotInteraction.mode !== "resize" && hotspotInteraction.mode !== "conn-endpoint-drag") {
        setHotspotInteraction(null);
      }
      handleCanvasMouseDown(e);
      return;
    }
    // Dismiss conditional prompt on canvas click (add normal connection)
    if (conditionalPrompt) {
      onConditionalPromptCancel();
      return;
    }
    // Dismiss inline condition label editing
    if (editingConditionGroup) setEditingConditionGroup(null);
    // Clear selected connection on canvas click
    if (selectedConnection) setSelectedConnection(null);
    // Clear batch hotspot selection
    if (selectedHotspots.length > 0) setSelectedHotspots([]);
    // Cancel hotspot interaction on canvas click
    if (hotspotInteraction && hotspotInteraction.mode !== "draw" && hotspotInteraction.mode !== "reposition" && hotspotInteraction.mode !== "hotspot-drag" && hotspotInteraction.mode !== "resize" && hotspotInteraction.mode !== "conn-endpoint-drag") {
      setHotspotInteraction(null);
    }
    if (connecting) {
      if (connecting.mode === "click") cancelConnecting();
      return;
    }
    if (hotspotInteraction?.mode === "draw" || hotspotInteraction?.mode === "reposition" || hotspotInteraction?.mode === "hotspot-drag" || hotspotInteraction?.mode === "resize" || hotspotInteraction?.mode === "conn-endpoint-drag") {
      return;
    }
    const wasPan = handleCanvasMouseDown(e);
    if (wasPan) setSelectedScreen(null);
  }, [handleCanvasMouseDown, setSelectedScreen, connecting, cancelConnecting, hotspotInteraction, setHotspotInteraction, selectedConnection, setSelectedConnection, isSpaceHeld, conditionalPrompt, onConditionalPromptCancel, editingConditionGroup, setEditingConditionGroup, selectedHotspots, setSelectedHotspots]);

  const onCanvasMouseMove = useCallback((e) => {
    if (hotspotInteraction?.mode === "draw") {
      const { imageAreaRect } = hotspotInteraction;
      if (!imageAreaRect) return;

      const startPctX = ((hotspotInteraction.drawStart.clientX - imageAreaRect.left) / imageAreaRect.width) * 100;
      const startPctY = ((hotspotInteraction.drawStart.clientY - imageAreaRect.top) / imageAreaRect.height) * 100;
      const curPctX = ((e.clientX - imageAreaRect.left) / imageAreaRect.width) * 100;
      const curPctY = ((e.clientY - imageAreaRect.top) / imageAreaRect.height) * 100;

      const x = Math.max(0, Math.min(100, Math.min(startPctX, curPctX)));
      const y = Math.max(0, Math.min(100, Math.min(startPctY, curPctY)));
      const x2 = Math.max(0, Math.min(100, Math.max(startPctX, curPctX)));
      const y2 = Math.max(0, Math.min(100, Math.max(startPctY, curPctY)));

      setHotspotInteraction((prev) => ({
        ...prev,
        drawRect: {
          screenId: hotspotInteraction.screenId,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          w: Math.round((x2 - x) * 10) / 10,
          h: Math.round((y2 - y) * 10) / 10,
        },
      }));
      return;
    }

    if (hotspotInteraction?.mode === "reposition") {
      const screen = screens.find((s) => s.id === hotspotInteraction.screenId);
      if (!screen || !screen.imageHeight) return;
      const screenW = screen.width || 220;
      const hs = screen.hotspots.find((h) => h.id === hotspotInteraction.hotspotId);
      if (!hs) return;

      const dxPx = (e.clientX - hotspotInteraction.startClientX) / zoom;
      const dyPx = (e.clientY - hotspotInteraction.startClientY) / zoom;
      const dxPct = (dxPx / screenW) * 100;
      const dyPct = (dyPx / screen.imageHeight) * 100;

      let newX = hotspotInteraction.startX + dxPct;
      let newY = hotspotInteraction.startY + dyPct;
      newX = Math.max(0, Math.min(100 - hs.w, newX));
      newY = Math.max(0, Math.min(100 - hs.h, newY));

      moveHotspot(hotspotInteraction.screenId, hotspotInteraction.hotspotId, Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
      return;
    }

    if (hotspotInteraction?.mode === "resize") {
      const screen = screens.find((s) => s.id === hotspotInteraction.screenId);
      if (!screen || !screen.imageHeight) return;
      const screenW = screen.width || 220;
      const { handle, startClientX, startClientY, startRect } = hotspotInteraction;

      const dxPct = ((e.clientX - startClientX) / zoom / screenW) * 100;
      const dyPct = ((e.clientY - startClientY) / zoom / screen.imageHeight) * 100;

      let { x, y, w, h } = startRect;
      const MIN = 2;

      if (handle.includes("e")) w = Math.max(MIN, Math.min(100 - x, startRect.w + dxPct));
      if (handle.includes("w")) {
        const dx = Math.min(dxPct, startRect.w - MIN);
        const clampedDx = Math.max(-startRect.x, dx);
        x = startRect.x + clampedDx;
        w = startRect.w - clampedDx;
      }
      if (handle.includes("s")) h = Math.max(MIN, Math.min(100 - y, startRect.h + dyPct));
      if (handle.includes("n")) {
        const dy = Math.min(dyPct, startRect.h - MIN);
        const clampedDy = Math.max(-startRect.y, dy);
        y = startRect.y + clampedDy;
        h = startRect.h - clampedDy;
      }

      const round = (v) => Math.round(v * 10) / 10;
      resizeHotspot(hotspotInteraction.screenId, hotspotInteraction.hotspotId, round(x), round(y), round(w), round(h));
      return;
    }

    if (hotspotInteraction?.mode === "conn-endpoint-drag") {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setHotspotInteraction((prev) => ({ ...prev, mouseX, mouseY }));
      return;
    }

    if (hotspotInteraction?.mode === "hotspot-drag") {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setHotspotInteraction((prev) => ({ ...prev, mouseX, mouseY }));
      return;
    }

    if (connecting) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setConnecting((prev) => ({ ...prev, mouseX, mouseY }));
      return;
    }
    const result = handleMouseMove(e);
    if (result?.type === "drag") moveScreen(result.id, result.x, result.y);
  }, [handleMouseMove, moveScreen, connecting, setConnecting, canvasRef, pan, zoom, hotspotInteraction, setHotspotInteraction, screens, moveHotspot, resizeHotspot]);

  const onCanvasMouseUp = useCallback((e) => {
    // Handle connection endpoint drag completion
    if (hotspotInteraction?.mode === "conn-endpoint-drag") {
      const { connectionId, endpoint, mouseX, mouseY } = hotspotInteraction;
      const hitScreen = screens.find((s) => {
        const sw = s.width || 220;
        const sh = (s.imageHeight || 120) + HEADER_HEIGHT;
        return mouseX >= s.x && mouseX <= s.x + sw && mouseY >= s.y && mouseY <= s.y + sh;
      });
      if (hitScreen) {
        const patch = endpoint === "from" ? { fromScreenId: hitScreen.id } : { toScreenId: hitScreen.id };
        updateConnection(connectionId, patch);
      }
      setHotspotInteraction(null);
      return;
    }

    // Handle draw completion
    if (hotspotInteraction?.mode === "draw") {
      const dr = hotspotInteraction.drawRect;
      // Signal draw completion via a special state value; caller opens modal
      if (dr && dr.w >= 2 && dr.h >= 2) {
        setHotspotInteraction({ mode: "draw-complete", screenId: hotspotInteraction.screenId, drawRect: dr });
      } else {
        setHotspotInteraction(null);
      }
      return;
    }

    // Handle resize completion
    if (hotspotInteraction?.mode === "resize") {
      commitDragSnapshot();
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }

    // Handle reposition completion
    if (hotspotInteraction?.mode === "reposition") {
      commitDragSnapshot();
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }

    // Handle hotspot-drag completion (drop on empty canvas)
    if (hotspotInteraction?.mode === "hotspot-drag") {
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }

    if (connecting) {
      cancelConnecting();
      return;
    }
    const wasDragging = !!dragging;
    handleMouseUp(e);
    if (wasDragging) commitDragSnapshot();
  }, [connecting, cancelConnecting, handleMouseUp, hotspotInteraction, setHotspotInteraction, screens, updateConnection, dragging, commitDragSnapshot]);

  const onCanvasMouseLeave = useCallback((e) => {
    if (hotspotInteraction?.mode === "conn-endpoint-drag") {
      setHotspotInteraction(null);
      return;
    }
    if (hotspotInteraction?.mode === "reposition" || hotspotInteraction?.mode === "resize") {
      commitDragSnapshot();
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }
    if (hotspotInteraction?.mode === "draw") {
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }
    if (hotspotInteraction?.mode === "hotspot-drag") {
      setHotspotInteraction({ mode: "selected", screenId: hotspotInteraction.screenId, hotspotId: hotspotInteraction.hotspotId });
      return;
    }
    if (connecting) {
      cancelConnecting();
      return;
    }
    handleMouseUp(e);
  }, [connecting, cancelConnecting, handleMouseUp, hotspotInteraction, setHotspotInteraction, commitDragSnapshot]);

  const canvasCursor = connecting || hotspotInteraction?.mode === "hotspot-drag" || hotspotInteraction?.mode === "conn-endpoint-drag"
    ? "crosshair"
    : hotspotInteraction?.mode === "draw"
      ? "crosshair"
      : hotspotInteraction?.mode === "resize"
        ? (resizeCursors[hotspotInteraction.handle] || "default")
        : hotspotInteraction?.mode === "reposition"
          ? "grabbing"
          : (spaceHeld && isPanning) ? "grabbing"
            : spaceHeld ? "grab"
              : isPanning ? "grabbing" : "default";

  return {
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasMouseLeave,
    canvasCursor,
  };
}
