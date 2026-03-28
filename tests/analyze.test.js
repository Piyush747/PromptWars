import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import * as vertexService from '../services/vertexService.js';

// Fully mock the external Vertex AI service so we don't make real, billable 
// API calls during our unit tests, ensuring robust isolated functionality verification.
vi.mock('../services/vertexService.js', () => ({
  analyzeSymptoms: vi.fn(),
}));

describe('Medical Triage API (POST /api/analyze)', () => {

  it('1. should return a rigid 400 Bad Request error if input text is empty or missing', async () => {
    const response = await request(app).post('/api/analyze').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Text input is required and must be a string.');
  });

  it('2. should intercept a valid text payload, securely query Vertex, and format a 200 OK JSON response', async () => {
    const mockTriage = {
      risk_level: "High",
      summary: "Simulated severity condition",
      immediate_actions: ["Call 112 safely"],
      avoid: ["Taking unprescribed medication"],
      next_steps: ["Await an ambulance"],
      confidence: "High"
    };

    // Safely override the vertex logic specifically for this test
    vertexService.analyzeSymptoms.mockResolvedValueOnce(JSON.stringify(mockTriage));

    const response = await request(app)
      .post('/api/analyze')
      .send({ text: 'I am experiencing severe shortness of breath.' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTriage);
    expect(vertexService.analyzeSymptoms).toHaveBeenCalledWith('I am experiencing severe shortness of breath.');
  });

  it('3. should safely catch a hard Vertex AI API failure and fallback to gracefully delivering a 500 error to the client', async () => {
    // Force a systemic authentication or network error from the GCP side
    vertexService.analyzeSymptoms.mockRejectedValueOnce(new Error("Vertex Backend Timeout"));

    const response = await request(app)
      .post('/api/analyze')
      .send({ text: 'Random triage scenario' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to analyze symptoms through Vertex AI.');
    expect(response.body.details).toBe('Vertex Backend Timeout');
  });

});
