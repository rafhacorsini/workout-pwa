import { config } from '/src/js/config.js';

export const getCoachAdvice = async (exerciseName, history, profile) => {
    if (!config.OPENAI_API_KEY) {
        return JSON.stringify({
            previous_weight: "-",
            suggested_increase: "-",
            target_weight: "-",
            tip: "Configure sua API Key.",
            motivation: "Sem API Key."
        });
    }

    const historyText = history.map(h => `${h.date}: ${h.weight}kg`).join('\n');

    const goalMap = {
        'hypertrophy': 'Hipertrofia (Foco em volume e controle)',
        'strength': 'Força Pura (Foco em carga alta e menos reps)',
        'endurance': 'Resistência (Foco em mais reps e menos descanso)',
        'weight_loss': 'Perda de Peso (Foco em intensidade e gasto calórico)'
    };

    const userGoal = profile ? goalMap[profile.goal] || 'Geral' : 'Geral';

    const prompt = `
        Você é um personal trainer de elite. O aluno vai fazer: "${exerciseName}".
        
        Perfil do Aluno:
        - Objetivo: ${userGoal}
        
        Histórico recente:
        ${historyText}
        
        Analise o histórico e o objetivo. Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com o seguinte formato:
        {
            "previous_weight": "valor do último peso (ex: 20kg)",
            "suggested_increase": "quanto aumentar (ex: +2kg ou 'Manter')",
            "target_weight": "meta para hoje (ex: 22kg)",
            "tip": "dica técnica curta ou estratégia de micro-progressão (ex: 'Aumente 1kg na última série')",
            "motivation": "frase curta motivacional (máx 5 palavras)"
        }
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('OpenAI Error:', data.error);
            return JSON.stringify({ tip: "Erro na IA" });
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        return JSON.stringify({ tip: "Erro de conexão" });
    }
};

export const analyzeWorkout = async (log, profile) => {
    if (!config.OPENAI_API_KEY) return null;

    const exercisesText = Object.entries(log.data).map(([name, data]) => {
        const sets = data.sets.map(s => `${s.weight}kg x ${s.reps}`).join(', ');
        return `- ${name}: ${sets} (Intensidade: ${data.intensity || 'N/A'})`;
    }).join('\n');

    const prompt = `
        Analise este treino realizado:
        ${exercisesText}

        Duração: ${log.duration}
        
        Gere um JSON com sugestões para o PRÓXIMO treino. Formato:
        {
            "tips": [
                { "exercise": "Nome do Exercicio", "suggestion": "Aumentar para 24kg", "reason": "Fez 12 reps fácil" }
            ],
            "general_feedback": "Bom volume, mas tente descansar menos."
        }
        Foque em progressão de carga.
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Analysis Error:', error);
        return null;
    }
};

export const parseMeal = async (mealText) => {
    const apiKey = config.OPENAI_API_KEY;
    console.log('API Key check:', apiKey ? 'Key exists (length: ' + apiKey.length + ')' : 'NO KEY');

    if (!apiKey) {
        console.error('No API Key configured. Check localStorage.getItem("openai_api_key")');
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
            "foods": ["lista", "dos", "alimentos", "identificados"]
        }
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
                response_format: { type: "json_object" }
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
