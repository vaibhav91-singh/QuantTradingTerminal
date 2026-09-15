import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import klinesRouter from './routes/klines.js';
import walletRouter from './routes/wallet.js';
import tradesRouter from './routes/trades.js';
import mlRouter from './routes/ml.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// System Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Express API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'QuantTerminal Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', klinesRouter);
app.use('/api', walletRouter);
app.use('/api', tradesRouter);
app.use('/api', mlRouter);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`
=====================================================
🚀 QuantTerminal Backend Express Server Running!
📡 Port: http://localhost:${PORT}
💚 Health Check: http://localhost:${PORT}/api/health
=====================================================
  `);
});
