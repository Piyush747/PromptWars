import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing. API calls will fail.");
}
const genAI = new GoogleGenerativeAI(apiKey || 'dummy');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: `You are an AI Medical First-Response Triage Assistant. Your role is purely triage and harm-reduction. 
You MUST NOT diagnose conditions or prescribe medications. 
Analyze the user's messy symptom input and return a strictly formatted JSON object.

# INSTRUCTIONS
1. Evaluate the urgency (High, Medium, Low) based on standard triage principles.
2. Outline immediate, safe actions the user should take right now.
3. List things the user must absolutely AVOID doing.
4. Recommend actionable next steps (e.g., "Go to ER immediately", "Consult a doctor tomorrow", "Rest and monitor").
5. Assess your confidence level based on the clarity of the input.
6. **IMPORTANT:** The user is located in India. All recommendations, emergency protocols, and contact numbers MUST be grounded in the Indian medical context (e.g., recommend calling 112 or 108 for medical emergencies).

# JSON SCHEMA
Respond ONLY with a valid JSON object matching this exact structure:
{
  "risk_level": "High | Medium | Low",
  "summary": "Brief summary of symptoms",
  "immediate_actions": ["step 1", "step 2"],
  "avoid": ["avoid 1", "avoid 2"],
  "next_steps": ["next step 1"],
  "confidence": "Low | Medium | High"
}`,
  generationConfig: {
    responseMimeType: "application/json",
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const result = await model.generateContent(text);
    const responseText = result.response.text();

    // Parse the JSON to ensure it's valid before sending
    const jsonOutput = JSON.parse(responseText);
    res.json(jsonOutput);
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    res.status(500).json({ error: 'Failed to analyze symptoms. Please try again later.' });
  }
});

app.listen(port, () => {
  console.log(`AI Medical Assistant MVP running on port ${port}`);
});
