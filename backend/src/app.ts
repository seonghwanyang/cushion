import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { apiRouter } from './api/routes';
import { errorHandler } from './api/middleware/error.middleware';
import { logger } from './utils/logger';
import { config } from './config';

export const app: Application = express();

// Security middleware
app.use(helmet());

// CORS 설정 디버깅
console.log('[CORS] Allowed origins:', config.corsOrigins);
app.use(cors({
  origin: (origin, callback) => {
    console.log('[CORS] Request origin:', origin);
    
    // origin이 없는 경우 (같은 도메인 요청) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    // 허용된 origin인지 확인
    if (config.corsOrigins.includes(origin)) {
      console.log('[CORS] Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('[CORS] Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});