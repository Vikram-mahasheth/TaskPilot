import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import commentRoutes from './routes/comments.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  'http://localhost:3000', // For Docker dev
  'http://localhost:5173', // For local dev
  process.env.FRONTEND_URL  // For production
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tickets/:ticketId/comments', commentRoutes);
app.use('/api/tickets', ticketRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is healthy and running' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Project Phoenix server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
