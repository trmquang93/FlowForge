import { FILE_EXTENSION, LEGACY_FILE_EXTENSION } from "../constants";

/**
 * Find the first .drawd (or legacy .flowforge) file in a FileList / File array.
 * Returns the File object, or null if none found.
 */
export function detectDrawdFile(files) {
  for (const f of files) {
    if (f.name.endsWith(FILE_EXTENSION) || f.name.endsWith(LEGACY_FILE_EXTENSION)) {
      return f;
    }
  }
  return null;
}
