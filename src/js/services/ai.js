// AI Service - Uses Vercel Serverless Function in production, local env.js in development

const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// For local development, try to use env.js
let localApiKey = '';
if (isLocalhost) {
    try {
        const { ENV } = await import('/src/js/env.js');
        localApiKey = ENV?.OPENAI_API_KEY || '';
    } catch (e) {
        console.log('No local env.js found');
    }
}

export const parseMeal = async (mealText) => {
    // In production, use serverless function
    if (!isLocalhost) {
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'parseMeal', data: { mealText } })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('API Error:', error);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch Error:', error);
            return null;
        }
    }

    // Local development - direct API call
    const apiKey = localApiKey || localStorage.getItem('openai_api_key') || '';
    if (!apiKey) {
        console.error('No API Key configured for local development');
        return null;
    }

    const prompt = `
        Analise esta refeição: "${mealText}".
        Estime os macronutrientes com base em porções padrão brasileiras.
        Retorne APENAS um JSON válido:
        {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "foods": ["lista", "dos", "alimentos"]
        }
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                response_format: { type: 'json_object' }
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('OpenAI Error:', data.error);
            return null;
        }
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('AI Meal Parse Error:', error);
        return null;
    }
};

export const getCoachAdvice = async (exerciseName, history, profile) => {
    // In production, use serverless function
    if (!isLocalhost) {
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getCoachAdvice',
                    data: { exerciseName, history, goal: profile?.goal }
                })
            });

            if (!response.ok) {
                return JSON.stringify({ tip: 'Erro na IA' });
            }

            return JSON.stringify(await response.json());
        } catch (error) {
            console.error('Coach API Error:', error);
            return JSON.stringify({ tip: 'Erro de conexão' });
        }
    }

    // Local development - direct API call
    const apiKey = localApiKey || localStorage.getItem('openai_api_key') || '';
    if (!apiKey) {
        return JSON.stringify({
            previous_weight: '-',
            suggested_increase: '-',
            target_weight: '-',
            tip: 'Configure sua API Key.',
            motivation: 'Sem API Key.'
        });
    }

    const historyText = history.map(h => `${h.date}: ${h.weight}kg`).join('\n');
    const goalMap = {
        'hypertrophy': 'Hipertrofia',
        'strength': 'Força Pura',
        'endurance': 'Resistência',
        'weight_loss': 'Perda de Peso'
    };
    const userGoal = profile ? goalMap[profile.goal] || 'Geral' : 'Geral';

    const prompt = `
        Você é um personal trainer de elite. O aluno vai fazer: "${exerciseName}".
        Objetivo: ${userGoal}
        Histórico: ${historyText}
        
        Retorne APENAS um JSON válido:
        {
            "previous_weight": "valor do último peso",
            "suggested_increase": "quanto aumentar",
            "target_weight": "meta para hoje",
            "tip": "dica técnica curta",
            "motivation": "frase curta motivacional"
        }
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                response_format: { type: 'json_object' }
            })
        });

        const data = await response.json();
        if (data.error) {
            return JSON.stringify({ tip: 'Erro na IA' });
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        return JSON.stringify({ tip: 'Erro de conexão' });
    }
};

export const analyzeWorkout = async (log, profile) => {
    // Simplified for now - returns null in production
    // Can be expanded later
    return null;
};
