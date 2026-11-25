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
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Jenis file tidak diizinkan. Hanya file PDF, PNG, dan JPEG/JPG yang diperbolehkan.'));
      }
    }
  });

  // Security Headers Middleware
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const pruneExpiredEntries = (map: Map<string, { count: number; resetTime: number }>, now: number) => {
    if (map.size > 500) {
      for (const [key, val] of map.entries()) {
        if (now > val.resetTime) {
          map.delete(key);
        }
      }
    }
  };

  // Upload Rate Limiter (sliding window per IP: max 25 uploads per 15 minutes)
  const uploadRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const UPLOAD_WINDOW_MS = 15 * 60 * 1000;
  const MAX_UPLOADS_PER_WINDOW = 25;

  const rateLimitUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    pruneExpiredEntries(uploadRateLimitMap, now);
    const entry = uploadRateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
      uploadRateLimitMap.set(ip, { count: 1, resetTime: now + UPLOAD_WINDOW_MS });
      return next();
    }

    if (entry.count >= MAX_UPLOADS_PER_WINDOW) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan unggah file. Mohon tunggu beberapa saat sebelum mencoba lagi.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    entry.count += 1;
    next();
  };

  // Notify Admin Rate Limiter (sliding window per IP: max 15 requests per 15 minutes)
  const notifyRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const NOTIFY_WINDOW_MS = 15 * 60 * 1000;
  const MAX_NOTIFY_PER_WINDOW = 15;

  const rateLimitNotify = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    pruneExpiredEntries(notifyRateLimitMap, now);
    const entry = notifyRateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
      notifyRateLimitMap.set(ip, { count: 1, resetTime: now + NOTIFY_WINDOW_MS });
      return next();
    }

    if (entry.count >= MAX_NOTIFY_PER_WINDOW) {
      return res.status(429).json({
        error: 'Terlalu banyak permintaan notifikasi. Mohon tunggu beberapa saat.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    entry.count += 1;
    next();
  };

  const hasValidUploadMagicBytes = (buf: Buffer, mimeType: string): boolean => {
    if (!buf || buf.length < 4) return false;
    if (mimeType === 'image/png') {
      return buf.length >= 8 &&
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
        buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;
    }
    if (mimeType === 'image/jpeg') {
      return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    }
    if (mimeType === 'application/pdf') {
      return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
    }
    return false;
  };

  app.use(express.json({ limit: '100kb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    const isCloudinaryConfigured = !!(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY));
    res.json({ 
      status: 'ok', 
      vercel: !!process.env.VERCEL,
      cloudinaryConfigured: isCloudinaryConfigured
    });
  });

  // Upload API
  app.post('/api/upload', rateLimitUpload, (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('Multer upload error:', err.message);
        let errMsg = err.message;
        if (err.code === 'LIMIT_FILE_SIZE') {
          errMsg = 'Ukuran file melebihi batas maksimal 5MB.';
        }
        return res.status(400).json({ error: errMsg });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!hasValidUploadMagicBytes(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
          error: 'Isi berkas tidak valid. Pastikan file benar-benar PNG, JPEG, atau PDF asli.'
        });
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
        error: 'Gagal mengupload file ke Cloudinary.'
      });
    }
  });

  // Server-side Automated Notification to Admin (keeps gateway secrets off client)
  app.post('/api/notify-admin', rateLimitNotify, async (req, res) => {
    try {
      const { type, bookingData, paymentProofUrl } = req.body || {};
      if (!type || !bookingData) {
        return res.status(400).json({ error: 'Data notifikasi tidak lengkap.' });
      }

      if (type === 'payment_proof' && (typeof paymentProofUrl !== 'string' || !/^https:\/\//i.test(paymentProofUrl))) {
        return res.status(400).json({ error: 'Tautan bukti pembayaran tidak valid.' });
      }

      const adminPhone = (process.env.ADMIN_NOTIFICATION_PHONE || '').trim();
      const secretKey = (process.env.SIDOBE_SECRET_KEY || '').trim();

      if (!secretKey || !adminPhone) {
        return res.status(200).json({ 
          success: false, 
          message: 'Server WhatsApp Gateway belum dikonfigurasi.' 
        });
      }

      let message = '';
      if (type === 'new_booking') {
        const customerName = String(bookingData.customerName || 'Warga').slice(0, 100);
        const purpose = String(bookingData.purpose || 'Acara Warga').slice(0, 150);
        const dateStr = String(bookingData.startDate || '-').slice(0, 30);
        const amount = Number(bookingData.amount || 0).toLocaleString('id-ID');
        const phone = String(bookingData.phone || '-').slice(0, 30);

        message = `🔔 *PENGAJUAN SEWA GEDUNG BARU*\n*Gedung Serbaguna Huntap Tondo 2*\n----------------------------------------\nAda permohonan reservasi baru yang memerlukan persetujuan:\n\n• *Nama Pemohon:* ${customerName}\n• *No. WhatsApp:* ${phone}\n• *Keperluan:* ${purpose}\n• *Tanggal Acara:* ${dateStr}\n• *Estimasi Biaya:* Rp ${amount}\n\nSilakan buka Dashboard Pengurus untuk memeriksa dan menyetujui jadwal:\n👉 https://gsght2.vercel.app/admin/bookings`;
      } else if (type === 'payment_proof') {
        const customerName = String(bookingData.customerName || 'Warga').slice(0, 100);
        const purpose = String(bookingData.purpose || 'Acara Warga').slice(0, 150);
        const dateStr = String(bookingData.startDate || '-').slice(0, 30);
        const amount = Number(bookingData.amount || 0).toLocaleString('id-ID');
        const dpAmount = Math.round(Number(bookingData.amount || 0) * 0.3).toLocaleString('id-ID');
        const phone = String(bookingData.phone || '-').slice(0, 30);
        const proofUrl = String(paymentProofUrl || '-').slice(0, 500);

        message = `🔔 *BUKTI TRANSFER PEMBAYARAN MASUK*\n*Gedung Serbaguna Huntap Tondo 2*\n----------------------------------------\nPenyewa telah mengunggah bukti pembayaran sewa gedung:\n\n• *Nama Pemohon:* ${customerName}\n• *No. WhatsApp:* ${phone}\n• *Keperluan:* ${purpose}\n• *Tanggal Acara:* ${dateStr}\n• *Estimasi DP (30%):* Rp ${dpAmount} (Total: Rp ${amount})\n• *Tautan Bukti Struk:* ${proofUrl}\n\nSilakan periksa mutasi rekening dan verifikasi status pembayaran:\n👉 https://gsght2.vercel.app/admin/bookings`;
      } else {
        return res.status(400).json({ error: 'Tipe notifikasi tidak didukung.' });
      }

      let formattedPhone = adminPhone.replace(/[^0-9]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }
      const phoneE164 = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

      const response = await fetch('https://api.sidobe.com/wa/v1/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': secretKey
        },
        body: JSON.stringify({
          phone: phoneE164,
          message: message,
          is_async: true
        })
      });

      const resData: any = await response.json();
      return res.json({
        success: resData.is_success === true || response.ok,
        message: resData.message || (response.ok ? 'Notifikasi admin terkirim via server' : 'Gagal mengirim pesan')
      });
    } catch (err: any) {
      console.error('Server Notify Error:', err);
      return res.status(500).json({ error: 'Gagal memproses notifikasi gateway server.' });
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
    
    let status = err.status || 500;
    let errorMessage = err.message || 'Internal Server Error';

    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 400;
      errorMessage = 'Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.';
    } else if (err.message && err.message.includes('Jenis file tidak diizinkan')) {
      status = 400;
      errorMessage = err.message;
    }

    res.status(status).json({
      error: errorMessage
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

