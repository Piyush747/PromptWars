import express from 'express';
import { analyzeSymptoms } from '../services/vertexService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Strict Text Normalization Filter
function normalizeInput(text) {
  if (!text) return '';
  // 1. Strip structural HTML injection elements
  let clean = text.replace(/<[^>]*>?/gm, '');
  // 2. Collapse excessive newlines and whitespace
  clean = clean.replace(/\s+/g, ' ');
  // 3. Purge non-printable invisible characters
  clean = clean.replace(/[^\x20-\x7E]/g, '');
  return clean.trim();
}

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Server-Side Parity Boundaries
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required and must be a string.' });
    }
    
    if (text.trim().length < 10) {
      return res.status(400).json({ error: 'Please describe the symptoms in more detail (at least 10 characters).' });
    }

    if (text.length > 1500) {
      return res.status(400).json({ error: 'Payload exceeds maximum server boundary length.' });
    }

    // Normalization Scrubbing Layer
    const sanitizedText = normalizeInput(text);

    if (sanitizedText.length < 10) {
      return res.status(400).json({ error: 'Input contains insufficient valid characters after safety sanitization.' });
    }

    const responseText = await analyzeSymptoms(sanitizedText);
    
    // Parse the JSON to ensure it's valid before sending
    const jsonOutput = JSON.parse(responseText);
    
    logger.info({ action: 'triage_successful', payloadLength: sanitizedText.length });
    res.json(jsonOutput);
  } catch (error) {
    logger.error({ err: error, action: 'vertex_triage_failure' }, "Error analyzing symptoms from Vertex AI");
    res.status(500).json({ error: 'Failed to analyze symptoms through Vertex AI.', details: error.message || error.toString() });
  }
});

export default router;
