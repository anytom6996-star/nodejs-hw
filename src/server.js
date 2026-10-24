
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errors as celebrateErrors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';

import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middleware
app.use(logger);

app.use(
  cors({
    origin: process.env.FRONTEND_DOMAIN || true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use(authRoutes);
app.use(notesRoutes);
app.use(userRoutes);

// Error handling
app.use(notFoundHandler);
app.use(celebrateErrors());
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectMongoDB();

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
