// Config with environment support
// Priority: env.js (local dev) > localStorage > empty

let _apiKey = null;

const loadApiKey = async () => {
    if (_apiKey !== null) return _apiKey;

    try {
        const { ENV } = await import('/src/js/env.js');
        _apiKey = ENV.OPENAI_API_KEY || '';
    } catch (e) {
        // env.js doesn't exist in production
        _apiKey = '';
    }
    return _apiKey;
};

// Eagerly try to load
loadApiKey();

export const config = {
    get OPENAI_API_KEY() {
        // Return cached key or fallback to localStorage
        return _apiKey || localStorage.getItem('openai_api_key') || '';
    }
};

// For async contexts that need guaranteed key
export const getApiKey = loadApiKey;
