import { GoogleGenAI } from '@google/genai';
import { GENAI_API_KEY } from '../config.js';

export const ai = new GoogleGenAI({
  apiKey: GENAI_API_KEY
});
