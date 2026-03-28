import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Health Check API (GET /health)', () => {
  it('1. should return a strict 200 OK along with an UP status and uptime metric', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
  });
});
