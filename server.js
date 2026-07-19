import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync, chmodSync } from 'fs';
import { execSync } from 'child_process';

// CRITICAL: Set Puppeteer cache directory BEFORE importing puppeteer.
const __dirname = dirname(fileURLToPath(import.meta.url));
const puppeteerCacheDir = join(__dirname, '.cache', 'puppeteer');
process.env.PUPPETEER_CACHE_DIR = puppeteerCacheDir;

// Recursively find the Chrome binary in the cache directory
function findChromeBinary(dir) {
  if (!existsSync(dir)) return null;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile() && entry.name === 'chrome') {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = findChromeBinary(fullPath);
        if (found) return found;
      }
    }
  } catch (e) {}
  return null;
}

// Check if Chrome exists, if not, install it NOW before starting the server
let chromePath = findChromeBinary(puppeteerCacheDir);
if (!chromePath) {
  console.log('[STARTUP] Chrome not found in cache. Installing Chrome now...');
  try {
    execSync(`PUPPETEER_CACHE_DIR=${puppeteerCacheDir} npx puppeteer browsers install chrome`, {
      stdio: 'inherit',
      cwd: __dirname,
      timeout: 120000 // 2 minute timeout
    });
    chromePath = findChromeBinary(puppeteerCacheDir);
    console.log('[STARTUP] Chrome installed at:', chromePath || 'NOT FOUND AFTER INSTALL');
  } catch (e) {
    console.error('[STARTUP] Failed to install Chrome:', e.message);
  }
}

if (chromePath) {
  try { chmodSync(chromePath, 0o755); } catch (e) {}
  // Set explicit path so puppeteer.launch() can find it
  process.env.PUPPETEER_EXECUTABLE_PATH = chromePath;
  console.log('[STARTUP] Chrome binary found at:', chromePath);
}

// Now dynamically import everything else AFTER env var is set
const express = (await import('express')).default;
const cors = (await import('cors')).default;
const { apiMiddleware, startBackgroundTasks } = await import('./vite-api-plugin.js');

const app = express();

app.use(cors());
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AaisuuSync Backend API is running successfully on Render! 🚀',
    chrome: chromePath || 'not installed'
  });
});

app.use(apiMiddleware);

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`PUPPETEER_CACHE_DIR = ${puppeteerCacheDir}`);
  console.log(`Chrome binary = ${chromePath || 'NOT FOUND'}`);
  startBackgroundTasks();
});
