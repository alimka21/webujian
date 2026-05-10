// server.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { logger, errorHandler } from './server/middleware';
import authRoutes from './server/routes/auth';
import adminRoutes from './server/routes/admin';
import guruRoutes from './server/routes/guru';
import siswaRoutes from './server/routes/siswa';
import publicRoutes from './server/routes/public';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(logger);

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/guru', guruRoutes);
  app.use('/api/siswa', siswaRoutes);
  app.use('/api', publicRoutes); // /api/berita, /api/alumni/stats

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Determine dist path for production
    const rootPath = path.resolve(__dirname, '..'); 
    const distPath = path.join(rootPath, 'dist');
    const servePath = __dirname.endsWith('dist') ? __dirname : distPath;

    app.use(express.static(servePath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(servePath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
