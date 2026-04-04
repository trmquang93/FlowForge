import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

let idCounter = 0;
vi.mock("../utils/generateId", () => ({
  generateId: vi.fn(() => `test-id-${++idCounter}`),
}));

import { useWireframeEditor } from "./useWireframeEditor";

beforeEach(() => {
  idCounter = 0;
});

function makeComponent(overrides = {}) {
  return {
    id: "existing-1",
    type: "rect",
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    text: "",
    style: { fill: "#f0f0f0" },
    interactive: false,
    ...overrides,
  };
}

describe("useWireframeEditor", () => {
  describe("initial state", () => {
    it("starts with empty components and no selection", () => {
      const { result } = renderHook(() => useWireframeEditor());
      expect(result.current.components).toEqual([]);
      expect(result.current.selectedId).toBeNull();
    });

    it("accepts initial components", () => {
      const initial = [makeComponent()];
      const { result } = renderHook(() => useWireframeEditor(initial));
      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].id).toBe("existing-1");
    });

    it("returns default viewport", () => {
      const { result } = renderHook(() => useWireframeEditor());
      expect(result.current.viewport).toEqual({ width: 393, height: 852 });
    });

    it("starts with canUndo and canRedo false", () => {
      const { result } = renderHook(() => useWireframeEditor());
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("addComponent", () => {
    it("adds component with correct type and snapped position", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("button", 13, 17); });
      const comp = result.current.components[0];
      expect(comp.type).toBe("button");
      // 13 -> round(13/8)*8 = round(1.625)*8 = 2*8 = 16
      expect(comp.x).toBe(16);
      // 17 -> round(17/8)*8 = round(2.125)*8 = 2*8 = 16
      expect(comp.y).toBe(16);
    });

    it("uses COMPONENT_DEFAULTS for width, height, text, and style", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("button", 0, 0); });
      const comp = result.current.components[0];
      expect(comp.width).toBe(160);
      expect(comp.height).toBe(44);
      expect(comp.text).toBe("Button");
      expect(comp.style.fill).toBe("#333333");
      expect(comp.interactive).toBe(true);
    });

    it("selects newly added component", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.selectedId).toBe(result.current.components[0].id);
    });

    it("assigns a unique ID via generateId", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.components[0].id).toBe("test-id-1");
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.components[1].id).toBe("test-id-2");
    });

    it("falls back to rect defaults for unknown type", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("nonsense", 0, 0); });
      const comp = result.current.components[0];
      expect(comp.width).toBe(120);
      expect(comp.height).toBe(80);
    });
  });

  describe("updateComponent", () => {
    it("merges updates into the target component", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.updateComponent(id, { text: "Updated" }); });
      expect(result.current.components[0].text).toBe("Updated");
      expect(result.current.components[0].width).toBe(120); // preserved
    });
  });

  describe("updateComponentStyle", () => {
    it("merges style updates without replacing other style keys", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("button", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.updateComponentStyle(id, { fill: "#ff0000" }); });
      expect(result.current.components[0].style.fill).toBe("#ff0000");
      expect(result.current.components[0].style.fontSize).toBe(14); // preserved
    });
  });

  describe("setComponentPosition", () => {
    it("snaps x and y to grid", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.setComponentPosition(id, 15, 23); });
      expect(result.current.components[0].x).toBe(16);
      expect(result.current.components[0].y).toBe(24);
    });

    it("does not affect other components", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.addComponent("rect", 40, 40); });
      const id1 = result.current.components[0].id;
      act(() => { result.current.setComponentPosition(id1, 100, 100); });
      expect(result.current.components[1].x).toBe(40);
      expect(result.current.components[1].y).toBe(40);
    });
  });

  describe("resizeComponent", () => {
    it("snaps width and height to grid", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.resizeComponent(id, 105, 53); });
      expect(result.current.components[0].width).toBe(104);
      expect(result.current.components[0].height).toBe(56);
    });

    it("enforces minimum width of 8 and minimum height of 2", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.resizeComponent(id, 1, 1); });
      // snapToGrid(1) = round(1/8)*8 = 0, Math.max(8, 0) = 8
      expect(result.current.components[0].width).toBe(8);
      // snapToGrid(1) = 0, Math.max(2, 0) = 2
      expect(result.current.components[0].height).toBe(2);
    });
  });

  describe("deleteComponent", () => {
    it("removes the component by id", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.deleteComponent(id); });
      expect(result.current.components).toHaveLength(0);
    });

    it("clears selectedId when deleting selected component", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      expect(result.current.selectedId).toBe(id);
      act(() => { result.current.deleteComponent(id); });
      expect(result.current.selectedId).toBeNull();
    });

    it("preserves selectedId when deleting a different component", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.addComponent("button", 100, 100); });
      const id1 = result.current.components[0].id;
      const id2 = result.current.components[1].id;
      // Select the second component
      act(() => { result.current.setSelectedId(id2); });
      // Delete the first
      act(() => { result.current.deleteComponent(id1); });
      expect(result.current.selectedId).toBe(id2);
    });
  });

  describe("duplicateComponent", () => {
    it("creates a copy offset by 2 grid units diagonally", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const original = result.current.components[0];
      act(() => { result.current.duplicateComponent(original.id); });
      expect(result.current.components).toHaveLength(2);
      const dup = result.current.components[1];
      // Offset = WIREFRAME_GRID_SIZE * 2 = 16
      expect(dup.x).toBe(original.x + 16);
      expect(dup.y).toBe(original.y + 16);
    });

    it("assigns a new ID to the duplicate", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const original = result.current.components[0];
      act(() => { result.current.duplicateComponent(original.id); });
      const dup = result.current.components[1];
      expect(dup.id).not.toBe(original.id);
    });

    it("selects the duplicate", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const original = result.current.components[0];
      act(() => { result.current.duplicateComponent(original.id); });
      const dup = result.current.components[1];
      expect(result.current.selectedId).toBe(dup.id);
    });

    it("does nothing for non-existent id", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.duplicateComponent("no-such-id"); });
      expect(result.current.components).toHaveLength(1);
    });
  });

  describe("undo / redo", () => {
    it("undo restores state before addComponent", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.components).toHaveLength(1);
      act(() => { result.current.undo(); });
      expect(result.current.components).toHaveLength(0);
    });

    it("redo restores undone addComponent", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.undo(); });
      expect(result.current.components).toHaveLength(0);
      act(() => { result.current.redo(); });
      expect(result.current.components).toHaveLength(1);
    });

    it("undo restores state before deleteComponent", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.deleteComponent(id); });
      expect(result.current.components).toHaveLength(0);
      act(() => { result.current.undo(); });
      expect(result.current.components).toHaveLength(1);
    });

    it("undo restores state before duplicateComponent", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      act(() => { result.current.duplicateComponent(id); });
      expect(result.current.components).toHaveLength(2);
      act(() => { result.current.undo(); });
      expect(result.current.components).toHaveLength(1);
    });

    it("new mutation clears redo stack", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.undo(); });
      expect(result.current.canRedo).toBe(true);
      act(() => { result.current.addComponent("button", 0, 0); });
      expect(result.current.canRedo).toBe(false);
    });

    it("undo clears selection", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.selectedId).not.toBeNull();
      act(() => { result.current.undo(); });
      expect(result.current.selectedId).toBeNull();
    });

    it("undo is a no-op when history is empty", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.undo(); });
      expect(result.current.components).toEqual([]);
    });

    it("redo is a no-op when redo stack is empty", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      act(() => { result.current.redo(); });
      expect(result.current.components).toHaveLength(1);
    });
  });

  describe("captureDragSnapshot", () => {
    it("makes the next position change undoable", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      const id = result.current.components[0].id;
      const origX = result.current.components[0].x;
      const origY = result.current.components[0].y;
      act(() => { result.current.captureDragSnapshot(); });
      act(() => { result.current.setComponentPosition(id, 100, 100); });
      // 100 snaps to round(100/8)*8 = 104
      expect(result.current.components[0].x).toBe(104);
      act(() => { result.current.undo(); });
      expect(result.current.components[0].x).toBe(origX);
      expect(result.current.components[0].y).toBe(origY);
    });
  });

  describe("grid snapping", () => {
    it("snaps 0 to 0", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 0, 0); });
      expect(result.current.components[0].x).toBe(0);
    });

    it("snaps 3 to 0", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 3, 0); });
      // round(3/8)*8 = round(0.375)*8 = 0*8 = 0
      expect(result.current.components[0].x).toBe(0);
    });

    it("snaps 4 to 8", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 4, 0); });
      // round(4/8)*8 = round(0.5)*8 = 1*8 = 8
      expect(result.current.components[0].x).toBe(8);
    });

    it("snaps 12 to 16", () => {
      const { result } = renderHook(() => useWireframeEditor());
      act(() => { result.current.addComponent("rect", 12, 0); });
      // round(12/8)*8 = round(1.5)*8 = 2*8 = 16
      expect(result.current.components[0].x).toBe(16);
    });
  });
});
