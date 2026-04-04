import { wireframeToSvg } from "./wireframeToSvg";

/**
 * Renders wireframe components to a PNG data URL at 2x scale.
 * Uses SVG -> Image -> Canvas for browser-native conversion.
 */
export function wireframeToPng(wireframe) {
  const svg = wireframeToSvg(wireframe);
  if (!svg) return Promise.resolve(null);

  const { viewport = { width: 393, height: 852 } } = wireframe;
  const { width, height } = viewport;
  const scale = 2; // Retina

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    // Use base64 encoding to avoid CORS/CSSP issues with SVG data URIs
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  });
}
