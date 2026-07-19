import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// CRITICAL: Set Puppeteer cache directory BEFORE importing puppeteer.
// ES module static imports are hoisted, so we must set env vars first,
// then use dynamic import() to load modules that depend on puppeteer.
const __dirname = dirname(fileURLToPath(import.meta.url));
process.env.PUPPETEER_CACHE_DIR = join(__dirname, '.cache', 'puppeteer');

// Now dynamically import everything else AFTER env var is set
const express = (await import('express')).default;
const cors = (await import('cors')).default;
const { apiMiddleware, startBackgroundTasks } = await import('./vite-api-plugin.js');

const app = express();

// Enable CORS for all routes (though apiMiddleware also sets CORS headers for /api/*)
app.use(cors());

// Serve static uploads
app.use('/uploads', express.static('public/uploads'));

// Friendly health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AaisuuSync Backend API is running successfully on Render! 🚀'
  });
});

// Run API middleware for all other requests
app.use(apiMiddleware);

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`PUPPETEER_CACHE_DIR = ${process.env.PUPPETEER_CACHE_DIR}`);
  startBackgroundTasks();
});
