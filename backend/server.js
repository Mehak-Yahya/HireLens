import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import jobRoutes from "./routes/jobRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
// Add security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// RATE LIMITING MIDDLEWARE (Enhanced)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.MAX_REQUESTS_PER_MINUTE || 30,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later."
    });
  }
});

// Apply rate limiting to all routes
app.use(limiter);
// CORS CONFIGURATION
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5000').split(',').map(o => o.trim());
    
    if (!origin) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (allowedOrigins.includes('chrome-extension://*') && origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// BODY PARSER & INPUT VALIDATION
app.use(express.json({ limit: '1mb' }));

// Input validation middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().substring(0, 1000);
      }
    }
  }
  next();
});
// DATABASE
connectDB();
// ROUTES
app.use("/api/jobs", jobRoutes);
app.use("/api/search", searchRoutes);

// HOME / HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HireLens API is running"
  });
});
// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
// ERROR HANDLER
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message: err.message,
    path: req.path,
    method: req.method
  });

  res.status(status).json({
    success: false,
    message
  });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`HireLens server running on port ${PORT}`);
});
