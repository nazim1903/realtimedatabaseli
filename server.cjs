import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import fs from 'fs';
import { initDatabase } from './server/database';
import apiRouter from './server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();

// Initialize database
initDatabase().catch(console.error);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
}));

// Enable CORS
app.use(cors());

// Parse JSON bodies with increased limit
app.use(express.json({ limit: '50mb' }));

// Enable gzip compression
app.use(compression());

// API routes
app.use('/api', apiRouter);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something broke!' });
});

// Start the server
app.listen(80, '0.0.0.0', () => {
  console.log(`Server is running on port 80`);
});