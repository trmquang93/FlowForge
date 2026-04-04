import {
  compileSchema,
  encodeBinarySchema,
} from "kiwi-schema";
import { deflateRaw } from "pako";

// ─── Archive format ───────────────────────────────────────────────────────────
// The fig-kiwi archive is: "fig-kiwi" (8 bytes) + version (uint32 LE)
// followed by one or more size-prefixed chunks: size (uint32 LE) + data bytes.
// Version 20 matches what current Figma clipboard data uses.

const FIG_KIWI_PRELUDE = "fig-kiwi";
const FIG_KIWI_VERSION = 20;

function writeArchive(files) {
  const enc = new TextEncoder();
  const preludeBytes = enc.encode(FIG_KIWI_PRELUDE);
  const headerSize = preludeBytes.length + 4; // prelude + uint32 version
  const totalSize = files.reduce((n, f) => n + 4 + f.byteLength, headerSize);
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  let offset = 0;
  buf.set(preludeBytes, offset);
  offset += preludeBytes.length;

  view.setUint32(offset, FIG_KIWI_VERSION, /* littleEndian */ true);
  offset += 4;

  for (const file of files) {
    view.setUint32(offset, file.byteLength, true);
    offset += 4;
    buf.set(file, offset);
    offset += file.byteLength;
  }

  return buf;
}

// ─── HTML wrapper ─────────────────────────────────────────────────────────────
// Figma reads the clipboard HTML via DOM parsing (getAttribute), so the
// comment delimiters inside attribute values MUST be entity-escaped.
// Raw <!-- in attributes is misinterpreted by some HTML parsers.

function uint8ToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function composeHTML(meta, archiveBytes) {
  const metaB64 = btoa(JSON.stringify(meta));
  const figB64 = uint8ToBase64(archiveBytes);
  // Entity-escape the comment delimiters so DOM parsers see them as plain text
  // inside the attribute value, not as comment start/end tokens.
  return (
    "<meta charset='utf-8'>" +
    "<html><head><meta charset=\"utf-8\"></head><body>" +
    "<span data-metadata=\"&lt;!--(figmeta)" + metaB64 + "(/figmeta)--&gt;\"></span>" +
    "<span data-buffer=\"&lt;!--(figma)" + figB64 + "(/figma)--&gt;\"></span>" +
    "</body></html>"
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Serialises a Figma clipboard message into the fig-kiwi HTML format that
 * Figma recognises when pasting (text/html MIME type).
 *
 * @param {{ meta: object, schema: object, message: object }} m
 * @returns {string} HTML clipboard string
 */
export function writeHTMLMessage({ meta, schema, message }) {
  const binSchema = encodeBinarySchema(schema);
  const compiledSchema = compileSchema(schema);
  const encodedMessage = compiledSchema.encodeMessage(message);

  const archive = writeArchive([
    deflateRaw(binSchema),
    deflateRaw(encodedMessage),
  ]);

  return composeHTML(meta, archive);
}
