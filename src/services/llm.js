const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const MODEL_NAME = 'gemini-2.5-flash';

async function transcribeAudio(recordingUrl) {
  // Twilio transcription is handled via /transcribe callback
  // This function is kept for interface compatibility only
  return '';
}

function fallbackIntent(transcript) {
  return {
    category: 'other',
    subcategory: 'general',
    ward: null,
    summary: String(transcript || '').slice(0, 100),
    urgency: 'medium',
    language_detected: 'hinglish'
  };
}

async function extractIntent(transcript) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return fallbackIntent(transcript);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are a civic grievance intake assistant for Indian municipalities.
Extract from the caller transcript:
- category: one of [water, road, electricity, sanitation, other]
- subcategory: brief descriptor
- ward: ward name or number if mentioned, else null
- summary: one sentence summary in English
- urgency: low/medium/high based on language used
- language_detected: hindi/english/hinglish
Return ONLY valid JSON, no explanation, no markdown.

Transcript:
${transcript}
`;

  try {
    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    const rawText = result.text ? result.text.trim() : '';
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '');

    return JSON.parse(cleaned);
  } catch (error) {
    logger.error({ err: error }, 'Gemini extraction failed');
    return fallbackIntent(transcript);
  }
}

module.exports = {
  transcribeAudio,
  extractIntent
};
