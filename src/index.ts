import "./utils/load_env.js";  //load the  environment  variables at  first 
import express from 'express';
import type { Request, Response } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser' 

import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';
import attemptRoutes from './routes/attempt.js';
import couponRoutes from './routes/coupon.js';
import payoutRoutes from './routes/payout.js';
import { connectDB } from './config/mongodb.js';
import { connectRedis } from './config/redis.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Strip trailing slash to prevent CORS mismatch (e.g. "https://example.com/" vs "https://example.com")
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Middlewares
app.use(cors({
    origin: clientUrl,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payouts', payoutRoutes);


app.use((req: Request, res: Response) => {
   res.status(404).json({
    success: false, message: "Not Found!"
   })
})

// Global Error Handler MUST be the last middleware
app.use(globalErrorHandler);


Init();

async function Init() {

  try{   
    await Promise.all([connectDB(),connectRedis()])
    app.listen(PORT, () => {
      console.log("server running at", PORT);
    })

  }catch(err) {
    console.error("failed to start the serrver");
    process.exit(1);
  }
}