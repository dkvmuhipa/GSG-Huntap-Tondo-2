import './src/lib/sanitize-env.ts';
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cloudinary Configuration
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Multer for file uploads - use memory storage for serverless environments (prevents read/write permission errors)
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    const isCloudinaryConfigured = !!(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY));
    res.json({ 
      status: 'ok', 
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      cloudinaryConfigured: isCloudinaryConfigured
    });
  });

  // Upload API
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    console.log('Received upload request:', req.file?.originalname);
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const isConfigured = !!(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));

      if (!isConfigured) {
        console.error('Cloudinary configuration is missing');
        return res.status(500).json({ 
          error: 'Konfigurasi Cloudinary belum lengkap di Environment Variables Vercel. Pastikan CLOUDINARY_URL atau (CLOUD_NAME, API_KEY, API_SECRET) sudah diisi.' 
        });
      }

      // Upload to Cloudinary using upload_stream (no need to write to disk /tmp)
      const uploadFromBuffer = (fileBuffer: Buffer, originalName: string) => {
        return new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'gedung_serbaguna_huntap_tondo',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(fileBuffer);
        });
      };

      const result = await uploadFromBuffer(req.file.buffer, req.file.originalname);

      let finalUrl = result.secure_url;
      const extension = result.format || req.file.originalname.split('.').pop()?.toLowerCase();
      
      if (extension === 'pdf' && result.resource_type === 'image' && !finalUrl.toLowerCase().endsWith('.pdf')) {
        finalUrl = `${finalUrl}.pdf`;
      }

      res.json({
        url: finalUrl,
        public_id: result.public_id,
      });
    } catch (error: any) {
      console.error('Upload Error:', error);
      res.status(500).json({ 
        error: 'Gagal mengupload file ke Cloudinary.',
        message: error.message 
      });
    }
  });

  // Handle 404 for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ 
      error: `API route ${req.method} ${req.url} not found`,
      message: 'Endpoint API tidak ditemukan.'
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production (Vercel), we serve from dist
    const distPath = path.join(process.cwd(), 'dist');
    // Important: check if dist exists, though Vercel build should handle it
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  // Start the server locally
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const port = Number(process.env.PORT) || PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default appPromise;

