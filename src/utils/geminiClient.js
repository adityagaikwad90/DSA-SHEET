import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache discovered working model name in memory to avoid repeated ListModels calls
let cachedModelName = null;

const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp",
  "gemini-pro"
];

/**
 * Discovers which models are enabled for this API key via Google's ListModels endpoint.
 * @param {string} apiKey 
 * @returns {Promise<string>} Working model name
 */
export async function discoverWorkingModel(apiKey) {
  if (cachedModelName) return cachedModelName;

  try {
    const url = apiKey.startsWith('AQ.')
      ? 'https://generativelanguage.googleapis.com/v1beta/models'
      : `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey.startsWith('AQ.')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const contentModels = models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );

      // Prioritize flash models, then pro
      const preferred = contentModels.find(m => m.name.includes('flash')) || contentModels[0];
      if (preferred) {
        cachedModelName = preferred.name.replace(/^models\//, '');
        console.log(`[Gemini Discovery] Auto-selected model: ${cachedModelName}`);
        return cachedModelName;
      }
    }
  } catch (err) {
    console.warn('[Gemini Discovery] ListModels query failed, falling back to candidate list:', err);
  }

  // Fallback to primary candidate
  return CANDIDATE_MODELS[0];
}

/**
 * Executes a Gemini prompt with automatic model cascade fallback.
 * Works seamlessly with both Standard Keys (AIzaSy...) and Auth Keys (AQ...).
 */
export async function executeGeminiPrompt({
  apiKey,
  prompt,
  systemInstruction = '',
  history = [],
  temperature = 0.7
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is missing. Please configure your key in settings.');
  }

  const cleanKey = apiKey.trim();
  const isAuthKey = cleanKey.startsWith('AQ.');

  // Try discovered model first, then remaining candidates
  const initialModel = await discoverWorkingModel(cleanKey);
  const modelsToTry = [initialModel, ...CANDIDATE_MODELS.filter(m => m !== initialModel)];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      if (isAuthKey) {
        // Direct REST API call with Bearer authentication
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        const body = {
          contents: [
            ...history,
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: { temperature }
        };

        if (systemInstruction) {
          body.system_instruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          throw new Error(errMsg);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          cachedModelName = modelName;
          return text;
        }
      } else {
        // Standard GoogleGenerativeAI SDK call
        const genAI = new GoogleGenerativeAI(cleanKey);
        const modelConfig = { model: modelName };
        if (systemInstruction) {
          modelConfig.systemInstruction = systemInstruction;
        }

        const model = genAI.getGenerativeModel(modelConfig);

        let result;
        if (history && history.length > 0) {
          const chat = model.startChat({ history });
          result = await chat.sendMessage(prompt);
        } else {
          result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const text = response.text();
        if (text) {
          cachedModelName = modelName;
          return text;
        }
      }
    } catch (err) {
      lastError = err;
      const errStr = String(err).toLowerCase();
      // If error is 404 (model not found), continue trying the next candidate model
      if (errStr.includes('404') || errStr.includes('not found')) {
        console.warn(`[Gemini Cascade] Model ${modelName} not found, trying next candidate...`);
        continue;
      }
      // If error is auth (401/403/invalid), re-throw immediately so user gets proper prompt
      throw err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to generate content.');
}

