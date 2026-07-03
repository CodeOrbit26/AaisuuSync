import express from 'express';
import cors from 'cors';
import { apiMiddleware, startBackgroundTasks } from './vite-api-plugin.js';

const app = express();

// Enable CORS for all routes (though apiMiddleware also sets CORS headers for /api/*)
app.use(cors());

// Serve static uploads
app.use('/uploads', express.static('public/uploads'));

// Run API middleware for all other requests
app.use(apiMiddleware);

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  startBackgroundTasks();
});
