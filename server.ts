import express from 'express';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cloudinary Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Multer for file uploads
  const upload = multer({ dest: '/tmp' });

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Upload API
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    console.log('Received upload request:', req.file?.originalname);
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        // Fallback or error if not configured
        console.warn('Cloudinary is not configured. Please set the environment variables in the Settings menu.');
        return res.status(500).json({ 
          error: 'Cloudinary configuration is missing. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the settings.' 
        });
      }

      // Cloudinary upload
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'gsg_huntap_tondo',
        resource_type: 'auto', 
      });

      // Remove temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      let finalUrl = result.secure_url;
      const extension = result.format || req.file.originalname.split('.').pop()?.toLowerCase();
      
      if (extension === 'pdf' && result.resource_type === 'image' && !finalUrl.toLowerCase().endsWith('.pdf')) {
        finalUrl = `${finalUrl}.pdf`;
      }

      res.json({
        url: finalUrl,
        public_id: result.public_id,
      });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Handle 404 for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ 
      error: `API route ${req.method} ${req.url} not found`,
      message: 'Pastikan endpoint API sudah benar dan server sedang berjalan.'
    });
  });

  // Global Error Handler for API and Server
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err);
    
    // If headers already sent, delegate to default handler
    if (res.headersSent) {
      return next(err);
    }

    // Default to 500
    const statusCode = err.status || err.statusCode || 500;
    
    // Always return JSON for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }

    // For other routes, let next (Vite/Static) handle or send simple error
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default appPromise;
