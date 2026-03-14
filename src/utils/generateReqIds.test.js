import { describe, it, expect } from "vitest";
import { screenReqId, hotspotReqId, connectionReqId } from "./generateReqIds.js";

describe("screenReqId", () => {
  it("returns a string starting with SCR- followed by 8 chars", () => {
    const result = screenReqId({ id: "abc12345xyz" });
    expect(result).toMatch(/^SCR-[a-zA-Z0-9]{8}$/);
  });

  it("is deterministic for the same input", () => {
    const screen = { id: "screen001abc" };
    expect(screenReqId(screen)).toBe(screenReqId(screen));
  });

  it("works with short IDs", () => {
    const result = screenReqId({ id: "a" });
    expect(result).toMatch(/^SCR-/);
    expect(result.length).toBeGreaterThan(4);
  });
});

describe("hotspotReqId", () => {
  it("returns HSP-{8chars}-{4chars} format", () => {
    const result = hotspotReqId({ id: "screen12345" }, { id: "hotspot9876" });
    expect(result).toMatch(/^HSP-.{8}-.{4}$/);
  });

  it("is deterministic for the same input", () => {
    const screen = { id: "screen001abc" };
    const hotspot = { id: "hotspot001" };
    expect(hotspotReqId(screen, hotspot)).toBe(hotspotReqId(screen, hotspot));
  });

  it("works with short IDs", () => {
    const result = hotspotReqId({ id: "x" }, { id: "y" });
    expect(result).toMatch(/^HSP-/);
  });
});

describe("connectionReqId", () => {
  it("returns NAV-{4chars} format", () => {
    const result = connectionReqId({ id: "conn12345" });
    expect(result).toMatch(/^NAV-.{4}$/);
  });

  it("is deterministic for the same input", () => {
    const conn = { id: "conn001abc" };
    expect(connectionReqId(conn)).toBe(connectionReqId(conn));
  });

  it("handles special characters in IDs", () => {
    const result = connectionReqId({ id: "c-_!@#$%^&" });
    expect(result).toMatch(/^NAV-/);
    expect(result.length).toBe(8);
  });
});
