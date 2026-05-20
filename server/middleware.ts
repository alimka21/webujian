// server/middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Augment Express Request supaya TS tahu req.userId ada — di-set oleh
// extractUserId middleware di bawah, dibaca oleh rate-limit keyGenerator
// dan boleh dipakai handler lain yang butuh user ID anonymous-safe.
declare module 'express-serve-static-core' {
  interface Request { userId?: string }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET wajib di-set di environment variable dan minimal 32 karakter. Generate dengan: openssl rand -base64 48');
}

/**
 * Soft JWT decode untuk rate limiter — set req.userId kalau ada token valid,
 * silent pass-through kalau tidak ada / invalid (TIDAK return 401).
 *
 * Tujuan: rate limit bucket per user, bukan per IP. 500 siswa di balik
 * 1 NAT sekolah jadi 500 bucket terpisah, bukan 1 bucket 200/min yang
 * habis dalam 12 detik.
 */
export const extractUserId = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET!) as { userId?: string };
      if (decoded?.userId) req.userId = decoded.userId;
    }
  } catch { /* anonymous — biarkan req.userId undefined, fallback ke IP */ }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Belum login' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin.' });
    }
    next();
  };
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Terjadi kesalahan pada server.' });
};
