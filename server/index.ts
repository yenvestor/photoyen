import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 5000;

  // Basic middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Basic API routes for PhotoStar
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PhotoStar API' });
  });

  // Simple project save/load endpoints (using local storage simulation)
  app.post('/api/projects', (req, res) => {
    // In a real app, this would save to database
    res.json({ id: Date.now().toString(), message: 'Project saved successfully' });
  });

  app.get('/api/projects/:id', (req, res) => {
    // In a real app, this would load from database
    res.json({ id: req.params.id, data: null, message: 'Project loaded' });
  });

  if (process.env.NODE_ENV === 'production') {
    // Serve static files in production
    const distPath = join(__dirname, '../dist');
    app.use(express.static(distPath));
    
    // Catch all handler: send back React's index.html file for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite
    try {
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: join(__dirname, '../client')
      });
      
      app.use(vite.ssrFixStacktrace);
      app.use('/', vite.middlewares);
    } catch (error) {
      console.error('Error setting up Vite middleware:', error);
    }
  }

  app.listen(port, () => {
    console.log(`📸 PhotoStar server running on port ${port}`);
    console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Local: http://localhost:${port}`);
    }
  });
}

startServer().catch(console.error);
