import { describe, it, expect } from "vitest";
import { buildZip } from "./zipBuilder.js";

describe("buildZip", () => {
  it("returns a Blob with type application/zip", () => {
    const blob = buildZip([{ name: "hello.txt", content: "world" }]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/zip");
  });

  it("returns a Blob with non-zero size when files are provided", () => {
    const blob = buildZip([{ name: "a.txt", content: "data" }]);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("starts with ZIP local file header signature (PK\\x03\\x04)", async () => {
    const blob = buildZip([{ name: "test.txt", content: "abc" }]);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it("returns a valid Blob for an empty file list", () => {
    const blob = buildZip([]);
    expect(blob).toBeInstanceOf(Blob);
    // Empty ZIP still has an end-of-central-directory record (22 bytes)
    expect(blob.size).toBe(22);
  });

  it("accepts Uint8Array content without error", async () => {
    const data = new Uint8Array([0x00, 0xff, 0x42]);
    const blob = buildZip([{ name: "bin.dat", content: data }]);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // The binary data should be present somewhere in the output
    expect(bytes.length).toBeGreaterThan(data.length);
  });

  it("accepts string content without error", () => {
    const blob = buildZip([{ name: "readme.md", content: "# Hello" }]);
    expect(blob.size).toBeGreaterThan(0);
  });
});
