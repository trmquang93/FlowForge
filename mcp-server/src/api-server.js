import http from 'node:http';

/**
 * Creates the HTML-to-Figma HTTP API server.
 *
 * Endpoints:
 *   POST /html       — convert a single HTML string to Figma plugin JSON
 *   POST /html-multi — convert multiple HTML screens side-by-side
 *   GET  /balance    — returns remaining credit balance (stub: unlimited)
 *
 * The JSON output is consumed by the Drawd Import Figma plugin,
 * which creates native editable Figma layers via the Plugin API.
 *
 * @param {import('./figma-export/html-to-figma-converter.js').HtmlToFigmaConverter} converter
 * @param {number} port
 * @returns {http.Server}
 */
export function createApiServer(converter, port) {
  const server = http.createServer(async (req, res) => {
    // CORS — allow all origins so browser clients and the Figma plugin iframe can call
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);

    try {
      // GET /balance
      if (req.method === 'GET' && url.pathname === '/balance') {
        return sendJson(res, 200, { credits: 999999, plan: 'unlimited' });
      }

      // POST /html
      if (req.method === 'POST' && url.pathname === '/html') {
        const body = await readBody(req);
        const { html, topLayerName, noAutoLayout, width, height, theme } = body;

        if (!html || typeof html !== 'string') {
          return sendJson(res, 400, { error: '`html` (string) is required' });
        }

        const result = await converter.convert(html, {
          topLayerName,
          noAutoLayout: !!noAutoLayout,
          width: width || 1280,
          height: height || 720,
          theme: theme || 'light',
        });

        return sendJson(res, 200, result);
      }

      // POST /html-multi
      if (req.method === 'POST' && url.pathname === '/html-multi') {
        const body = await readBody(req);
        const { screens, topLayerName, noAutoLayout, width, height, theme } = body;

        if (!Array.isArray(screens) || screens.length === 0) {
          return sendJson(res, 400, { error: '`screens` (non-empty array) is required' });
        }

        const result = await converter.convertMulti(screens, {
          topLayerName,
          noAutoLayout: !!noAutoLayout,
          width: width || 1280,
          height: height || 720,
          theme: theme || 'light',
        });

        return sendJson(res, 200, result);
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      process.stderr.write(`API error: ${err.message}\n${err.stack}\n`);
      sendJson(res, 500, { error: err.message });
    }
  });

  server.listen(port, () => {
    process.stderr.write(`HTML-to-Figma API running on http://localhost:${port}\n`);
  });

  return server;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
