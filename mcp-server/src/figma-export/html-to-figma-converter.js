import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { domTraversalFn } from './dom-traversal.js';
import { toJsonResponse } from './clipboard-format.js';

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

/**
 * Converts HTML to Figma-compatible node data using a headless Chrome browser.
 *
 * Flow:
 *   HTML string → Puppeteer page → live DOM render → domTraversalFn() →
 *   Figma node tree → JSON or clipboard HTML
 */
export class HtmlToFigmaConverter {
  constructor() {
    this.browser = null;
  }

  async init() {
    let executablePath = process.env.CHROME_PATH || null;

    if (!executablePath) {
      for (const p of CHROME_PATHS) {
        try {
          fs.accessSync(p);
          executablePath = p;
          break;
        } catch { /* skip */ }
      }
    }

    if (!executablePath) {
      throw new Error(
        'Chrome/Chromium not found. Set CHROME_PATH environment variable to your Chrome executable path.'
      );
    }

    this.browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
  }

  /**
   * Convert a single HTML string to Figma node data.
   *
   * @param {string} html
   * @param {Object} options
   * @param {number}  [options.width=1280]       - Viewport width
   * @param {number}  [options.height=720]        - Viewport height
   * @param {string}  [options.topLayerName]      - Override top-level frame name
   * @param {boolean} [options.noAutoLayout=false]- Strip auto-layout properties from result
   * @param {'light'|'dark'} [options.theme='light'] - CSS color-scheme preference
   * @returns {Promise<Object>} JSON payload for the Figma plugin
   */
  async convert(html, options = {}) {
    if (!this.browser) throw new Error('HtmlToFigmaConverter not initialized. Call init() first.');

    const {
      width = 1280,
      height = 720,
      topLayerName,
      noAutoLayout = false,
      theme = 'light',
    } = options;

    const page = await this.browser.newPage();
    try {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });

      if (theme === 'dark') {
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
      }

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Allow CSS transitions/animations to settle
      await new Promise(r => setTimeout(r, 300));

      const rootNode = await page.evaluate(domTraversalFn, width, height);

      if (noAutoLayout) stripAutoLayout(rootNode);

      return toJsonResponse([rootNode], topLayerName);
    } finally {
      await page.close();
    }
  }

  /**
   * Convert multiple HTML screens and place them side-by-side in one Figma frame.
   *
   * @param {Array<{html: string, name?: string}>} screens
   * @param {Object} options - Same options as convert()
   * @returns {Promise<Object>} JSON payload for the Figma plugin
   */
  async convertMulti(screens, options = {}) {
    if (!this.browser) throw new Error('HtmlToFigmaConverter not initialized. Call init() first.');

    const {
      width = 1280,
      height = 720,
      topLayerName = 'Screens',
      noAutoLayout = false,
      theme = 'light',
    } = options;

    const GAP = 40;
    const nodes = [];

    for (let i = 0; i < screens.length; i++) {
      const { html, name } = screens[i];
      if (!html) continue;

      const page = await this.browser.newPage();
      try {
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        if (theme === 'dark') {
          await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
        }
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 300));

        const node = await page.evaluate(domTraversalFn, width, height);
        if (name) node.name = name;
        if (noAutoLayout) stripAutoLayout(node);

        // Offset each screen horizontally
        node.x = i * (width + GAP);
        node.y = 0;
        nodes.push(node);
      } finally {
        await page.close();
      }
    }

    // Wrap all screens in a single GROUP-like FRAME
    const wrapper = {
      id: '0',
      type: 'FRAME',
      name: topLayerName,
      x: 0, y: 0,
      width: nodes.length * width + Math.max(0, nodes.length - 1) * GAP,
      height,
      opacity: 1,
      fills: [],
      strokes: [],
      strokeWeight: 0,
      strokeAlign: 'INSIDE',
      effects: [],
      cornerRadius: 0,
      clipsContent: false,
      layoutMode: 'NONE',
      paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0,
      itemSpacing: 0,
      children: nodes,
    };

    return toJsonResponse([wrapper]);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripAutoLayout(node) {
  delete node.layoutMode;
  delete node.paddingLeft;
  delete node.paddingRight;
  delete node.paddingTop;
  delete node.paddingBottom;
  delete node.itemSpacing;
  if (node.children) node.children.forEach(stripAutoLayout);
}
