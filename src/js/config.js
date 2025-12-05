// Config with environment support
// Priority: env.js (local dev) > localStorage > empty

let _apiKey = '';

// Try to load from env.js (local dev only)
// Using dynamic import with catch to avoid blocking on 404
(async () => {
    try {
        const { ENV } = await import('/src/js/env.js');
        _apiKey = ENV?.OPENAI_API_KEY || '';
    } catch (e) {
        // env.js doesn't exist in production - that's expected
        console.log('Running in production mode (no local env.js)');
    }
})();

export const config = {
    get OPENAI_API_KEY() {
        return _apiKey || localStorage.getItem('openai_api_key') || '';
    }
};

export const getApiKey = () => _apiKey || localStorage.getItem('openai_api_key') || '';
