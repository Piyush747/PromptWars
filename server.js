import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './utils/logger.js';
import analyzeRouter from './routes/analyze.js';
import healthRouter from './routes/health.js';

dotenv.config();

// Dynamically resolve relative GOOGLE_APPLICATION_CREDENTIALS strings to an absolute OS-specific path for the Vertex SDK cross-platform execution
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

// Forcibly remove any fake/cached JSON paths from your active terminal session
// so that Vertex AI correctly defaults back to your gcloud CLI credentials.
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.includes('downloaded-key.json')) {
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet()); // Secure all HTTP headers by default
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger })); // Captures automated JSON structured logs for every HTTP request boundary
app.use(express.static('public'));

// Rate Limiting (Defense against automated DDoS attacks)
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: { error: 'Too many requests created from this IP, please try again after 10 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', apiLimiter); // Apply limiter explicitly to all internal API routes

app.use('/health', healthRouter);
app.use('/api/analyze', analyzeRouter);

// We export the app directly allowing testing frameworks to inject their own execution context 
// without immediately binding to a network port and throwing EADDRINUSE errors.
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`AI Medical Assistant MVP (Modular API) running on port ${port}`);
  });
}

export default app;
