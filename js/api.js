/**
 * Prompt Engineering Lab - API Module
 * Uses the global CONFIG object defined in config.js
 */

const ANALYSIS_PROMPT = `You are an expert Prompt Engineer and AI alignment specialist.
Your task is to analyze a given user prompt based on 6 key dimensions. 
For each dimension, provide a score from 1 to 10 (where 1 is entirely absent/poor and 10 is excellent/comprehensive) and a brief, constructive feedback note.

The 6 dimensions are:
1. Clarity: Is the prompt unambiguous, clear, and easy for the AI to understand?
2. Specificity: Is the task well-scoped? Are there specific details rather than vague requests?
3. Context: Does the prompt provide sufficient background information or context?
4. Constraints: Are there boundaries set (e.g., length, format, tone, restrictions)?
5. Role Setting: Does the prompt assign a specific persona or role to the AI?
6. Output Format: Is the expected structure of the output clearly defined?

You MUST respond strictly with valid JSON. Do not include markdown code blocks. The JSON must exactly match this structure:
{
  "scores": {
    "clarity": { "score": 7, "feedback": "..." },
    "specificity": { "score": 5, "feedback": "..." },
    "context": { "score": 3, "feedback": "..." },
    "constraints": { "score": 2, "feedback": "..." },
    "roleSetting": { "score": 1, "feedback": "..." },
    "outputFormat": { "score": 4, "feedback": "..." }
  },
  "overallScore": 3.7,
  "summary": "A brief overall assessment of the prompt's quality.",
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"]
}`;

const IMPROVEMENT_PROMPT = `You are an expert Prompt Engineer.
You will be provided with an original prompt and an analysis of its strengths and weaknesses across 6 dimensions: Clarity, Specificity, Context, Constraints, Role Setting, and Output Format.
Your task is to rewrite and significantly improve the original prompt based on this analysis, elevating it to an expert level.

You MUST respond strictly with valid JSON. Do not include markdown code blocks. The JSON must exactly match this structure:
{
  "improvedPrompt": "The rewritten, highly effective prompt...",
  "changes": [
    { "aspect": "Clarity", "description": "What was changed and why" }
  ],
  "expectedImprovement": "A brief explanation of how the improved prompt will yield better results from an LLM."
}`;

const COMPARISON_PROMPT = `You are an AI tasked with answering two different prompts: an Original Prompt and an Improved Prompt.
First, generate the best possible response to the Original Prompt.
Second, generate the best possible response to the Improved Prompt.
Third, compare the two outputs and explain why the Improved Prompt resulted in a better or more targeted response.

You MUST respond strictly with valid JSON. Do not include markdown code blocks. The JSON must exactly match this structure:
{
  "originalOutput": "Your complete response to the Original Prompt...",
  "improvedOutput": "Your complete response to the Improved Prompt...",
  "comparison": "A brief analysis of the differences in quality, depth, or formatting between the two outputs."
}`;

const API = {
  /**
   * Internal helper to call the Gemini API with retry logic and JSON parsing.
   * @param {string} systemPrompt - The system instructions for the LLM.
   * @param {string} userMessage - The specific content/prompt to process.
   * @param {number} retries - Current retry count.
   * @returns {Promise<Object>} The parsed JSON response.
   */
  async _callGemini(systemPrompt, userMessage, retries = 0) {
    if (typeof CONFIG === 'undefined' || !CONFIG.API_KEY) {
      throw new Error("API key is not configured. Please check CONFIG object.");
    }

    const url = `${CONFIG.API_URL}${CONFIG.MODEL}:generateContent?key=${CONFIG.API_KEY}`;
    
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n---\n\nUSER INPUT:\n${userMessage}` }]
        }
      ],
      generationConfig: {
        temperature: CONFIG.TEMPERATURE,
        maxOutputTokens: CONFIG.MAX_TOKENS,
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {};
        }
        throw new Error(`API Request failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates returned from the API.");
      }
      
      let textResponse = data.candidates[0].content.parts[0].text;
      
      // Strip potential markdown formatting
      textResponse = textResponse.trim();
      if (textResponse.startsWith('```')) {
        const firstNewline = textResponse.indexOf('\n');
        textResponse = textResponse.substring(firstNewline + 1);
        if (textResponse.endsWith('```')) {
          textResponse = textResponse.substring(0, textResponse.length - 3);
        }
      }
      
      return JSON.parse(textResponse);
      
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        console.warn(`API call failed. Retrying in ${CONFIG.RETRY_DELAY_MS}ms... (Attempt ${retries + 1} of ${CONFIG.MAX_RETRIES})`, error);
        await new Promise(res => setTimeout(res, CONFIG.RETRY_DELAY_MS));
        return this._callGemini(systemPrompt, userMessage, retries + 1);
      }
      console.error("API call failed after max retries", error);
      throw error;
    }
  },

  /**
   * Analyzes a user prompt based on 6 dimensions.
   * @param {string} promptText - The prompt to analyze.
   * @returns {Promise<Object>} Analysis results in JSON format.
   */
  async analyzePrompt(promptText) {
    if (!promptText || promptText.trim() === '') {
      throw new Error("Prompt text cannot be empty.");
    }
    return this._callGemini(ANALYSIS_PROMPT, promptText);
  },

  /**
   * Improves a prompt based on previous analysis.
   * @param {string} promptText - The original prompt.
   * @param {Object} analysisResult - The analysis from analyzePrompt.
   * @returns {Promise<Object>} The improved prompt and changes.
   */
  async improvePrompt(promptText, analysisResult) {
    if (!promptText || promptText.trim() === '') {
      throw new Error("Prompt text cannot be empty.");
    }
    if (!analysisResult) {
      throw new Error("Analysis results are required to improve the prompt.");
    }
    
    const userMessage = `ORIGINAL PROMPT:
${promptText}

ANALYSIS RESULTS:
${JSON.stringify(analysisResult, null, 2)}`;

    return this._callGemini(IMPROVEMENT_PROMPT, userMessage);
  },

  /**
   * Compares the outputs of the original and improved prompts.
   * @param {string} originalPrompt - The original prompt.
   * @param {string} improvedPrompt - The improved prompt.
   * @returns {Promise<Object>} Outputs and comparison analysis.
   */
  async compareOutputs(originalPrompt, improvedPrompt) {
    if (!originalPrompt || !improvedPrompt) {
      throw new Error("Both original and improved prompts are required.");
    }

    const userMessage = `ORIGINAL PROMPT:
${originalPrompt}

IMPROVED PROMPT:
${improvedPrompt}`;

    return this._callGemini(COMPARISON_PROMPT, userMessage);
  }
};
