import { wireframeToSvg } from "./wireframeToSvg";

/**
 * Returns the SVG string for a screen, preferring Satori-generated SVG
 * (from MCP screens) over wireframe-generated SVG.
 */
export function getScreenSvg(screen) {
  if (screen.svgContent) return screen.svgContent;
  if (screen.wireframe) return wireframeToSvg(screen.wireframe);
  return null;
}

/**
 * Copies the screen SVG to the clipboard as text.
 * Figma accepts pasted SVG text and converts it to editable vector layers.
 * Returns true on success, false if no SVG available.
 */
export async function copyScreenForFigma(screen) {
  const svg = getScreenSvg(screen);
  if (!svg) return false;

  await navigator.clipboard.writeText(svg);
  return true;
}

/**
 * Downloads the screen as an SVG file.
 */
export function downloadScreenSvg(screen) {
  const svg = getScreenSvg(screen);
  if (!svg) return false;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${screen.name || "screen"}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
