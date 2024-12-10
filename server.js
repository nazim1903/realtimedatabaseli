import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, 'backups');
const tempDir = path.join(__dirname, 'temp');

try {
  await fs.mkdir(backupsDir, { recursive: true });
  await fs.mkdir(tempDir, { recursive: true });
} catch (error) {
  console.error('Error creating directories:', error);
}

// Clean up temporary files older than 1 hour
async function cleanupTempFiles() {
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > oneHour) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// Handle backup API routes
app.post('/api/backup/chunk', async (req, res) => {
  try {
    const { chunk, index, total, timestamp } = req.body;
    const chunkId = `chunk_${timestamp}_${index}`;
    const chunkPath = path.join(tempDir, chunkId);
    
    await fs.writeFile(chunkPath, chunk);
    
    res.json({ success: true, chunkId });
  } catch (error) {
    console.error('Error saving chunk:', error);
    res.status(500).json({ success: false, message: 'Failed to save chunk' });
  }
});

app.post('/api/backup/combine', async (req, res) => {
  try {
    const { chunkIds, timestamp } = req.body;
    let combinedData = '';
    
    // Combine chunks
    for (const chunkId of chunkIds) {
      const chunkPath = path.join(tempDir, chunkId);
      const chunk = await fs.readFile(chunkPath, 'utf8');
      combinedData += chunk;
      await fs.unlink(chunkPath);
    }

    // Save combined backup
    const data = JSON.parse(combinedData);
    const filename = `backup_${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'Backup saved successfully' });
  } catch (error) {
    console.error('Error combining chunks:', error);
    res.status(500).json({ success: false, message: 'Failed to combine chunks' });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const data = req.body;
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'Backup saved successfully' });
  } catch (error) {
    console.error('Error saving backup:', error);
    res.status(500).json({ success: false, message: 'Failed to save backup' });
  }
});

app.get('/api/backup', async (req, res) => {
  try {
    const files = await fs.readdir(backupsDir);
    if (!files.length) {
      return res.status(404).json({ success: false, message: 'No backups found' });
    }

    // Get the latest backup file
    const latestFile = files
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()[0];

    if (!latestFile) {
      return res.status(404).json({ success: false, message: 'No backup files found' });
    }

    const filepath = path.join(backupsDir, latestFile);
    const data = await fs.readFile(filepath, 'utf8');
    
    res.json({ success: true, data: JSON.parse(data) });
  } catch (error) {
    console.error('Error loading backup:', error);
    res.status(500).json({ success: false, message: 'Failed to load backup' });
  }
});

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});