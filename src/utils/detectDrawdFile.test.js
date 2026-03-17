import { describe, it, expect } from "vitest";
import { detectDrawdFile } from "./detectDrawdFile.js";

const makeFile = (name) => ({ name });

describe("detectDrawdFile", () => {
  it("returns null for an empty file list", () => {
    expect(detectDrawdFile([])).toBeNull();
  });

  it("returns null when only image files are present", () => {
    const files = [makeFile("screen1.png"), makeFile("photo.jpg")];
    expect(detectDrawdFile(files)).toBeNull();
  });

  it("detects a .drawd file", () => {
    const drawdFile = makeFile("myproject.drawd");
    const files = [makeFile("image.png"), drawdFile];
    expect(detectDrawdFile(files)).toBe(drawdFile);
  });

  it("detects a legacy .flowforge file", () => {
    const legacyFile = makeFile("old.flowforge");
    const files = [legacyFile, makeFile("photo.jpg")];
    expect(detectDrawdFile(files)).toBe(legacyFile);
  });

  it("returns the first .drawd file when multiple are present", () => {
    const first = makeFile("a.drawd");
    const second = makeFile("b.drawd");
    expect(detectDrawdFile([first, second])).toBe(first);
  });

  it("prefers .drawd over .flowforge when .drawd comes first", () => {
    const drawd = makeFile("new.drawd");
    const legacy = makeFile("old.flowforge");
    expect(detectDrawdFile([drawd, legacy])).toBe(drawd);
  });

  it("does not match files with .drawd in the middle of the name", () => {
    const fake = makeFile("drawd-backup.txt");
    expect(detectDrawdFile([fake])).toBeNull();
  });

  it("works with a FileList-like iterable", () => {
    const drawdFile = makeFile("test.drawd");
    // Simulate a FileList (iterable but not an Array)
    const fileList = { 0: drawdFile, length: 1, [Symbol.iterator]: function* () { yield this[0]; } };
    expect(detectDrawdFile(fileList)).toBe(drawdFile);
  });
});
