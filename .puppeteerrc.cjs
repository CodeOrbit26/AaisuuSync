const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 * 
 * This config file is the SINGLE SOURCE OF TRUTH for the Puppeteer cache.
 * Both the CLI (npx puppeteer browsers install chrome) and the runtime
 * (puppeteer.launch()) read this file to determine where Chrome lives.
 * 
 * By using __dirname (project root), the path is identical during:
 *   - Render build phase
 *   - Render runtime phase
 *   - Local development
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
