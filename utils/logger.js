import pino from 'pino';

// Constructs an extremely fast JSON structural logger optimized for Google Cloud Logging ingestion.
const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label }; // Maps standard Node integers back to 'info', 'error' for correct GCP Severity parsing
    },
  },
  base: {
    service: 'ai-medical-mvp',
  }
});

export default logger;
