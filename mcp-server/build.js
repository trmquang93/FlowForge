import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

await build({
  entryPoints: ["index.js"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/index.js",
  // @resvg/resvg-js ships native .node binaries — cannot be bundled.
  // satori and satori-html are kept external to avoid bundling issues with
  // their ESM-only internals and to keep the bundle size smaller.
  external: ["puppeteer-core", "@modelcontextprotocol/sdk", "@resvg/resvg-js", "satori", "satori-html"],
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});

// Copy font assets alongside the bundle so import.meta.url-relative paths work
mkdirSync("dist/assets", { recursive: true });
cpSync("assets", "dist/assets", { recursive: true });
