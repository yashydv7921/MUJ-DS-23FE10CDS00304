// ============================================
// Prompt Engineering Lab — Configuration
// ============================================
// Replace "YOUR_GEMINI_API_KEY" with your actual API key
// Get a free key at: https://aistudio.google.com/apikey
// ============================================

const CONFIG = {
    // Google Gemini API Key (free tier)
    API_KEY: "YOUR_GEMINI_API_KEY",

    // Model to use for analysis and generation
    MODEL: "gemini-3.8-flash",

    // Base URL for the Gemini REST API
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/",

    // Maximum tokens in the response
    MAX_TOKENS: 4096,

    // Temperature controls randomness (0 = deterministic, 1 = creative)
    TEMPERATURE: 0.7,

    // Number of history items to keep in LocalStorage
    MAX_HISTORY: 20,

    // Retry settings for API calls (increased to handle 503 errors)
    MAX_RETRIES: 4,
    RETRY_DELAY_MS: 3000
};
