import { HtmlToFigmaConverter } from './src/figma-export/html-to-figma-converter.js';
import { createApiServer } from './src/api-server.js';

async function main() {
  const converter = new HtmlToFigmaConverter();

  process.stderr.write('Launching Chrome...\n');
  await converter.init();
  process.stderr.write('Chrome ready.\n');

  const port = parseInt(process.env.PORT || '3333', 10);
  const server = createApiServer(converter, port);

  async function shutdown() {
    process.stderr.write('\nShutting down...\n');
    server.close();
    await converter.close();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
