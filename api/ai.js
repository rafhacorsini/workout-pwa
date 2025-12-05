// Vercel Serverless Function for OpenAI API Proxy
// The API key is stored in Vercel Environment Variables (never exposed to frontend)

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    try {
        const { action, data } = req.body;

        let messages = [];

        if (action === 'parseMeal') {
            const prompt = `
                Analise esta refeição: "${data.mealText}".
                
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
            messages = [{ role: 'user', content: prompt }];

        } else if (action === 'getCoachAdvice') {
            const historyText = data.history?.map(h => `${h.date}: ${h.weight}kg`).join('\n') || 'Sem histórico';
            const goalMap = {
                'hypertrophy': 'Hipertrofia',
                'strength': 'Força Pura',
                'endurance': 'Resistência',
                'weight_loss': 'Perda de Peso'
            };
            const userGoal = goalMap[data.goal] || 'Geral';

            const prompt = `
                Você é um personal trainer de elite. O aluno vai fazer: "${data.exerciseName}".
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
            messages = [{ role: 'user', content: prompt }];
        } else if (action === 'analyzeShape') {
            messages = [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analise este físico com foco em musculação.
                            IMPORTANTE: Analise APENAS as partes do corpo que estão VISÍVEIS na foto.
                            NÃO faça suposições sobre pernas ou costas se não estiverem aparecendo.
                            
                            Retorne APENAS um JSON válido:
                            {
                                "bodyFat": "estimativa de % de gordura (ex: 15-18%)",
                                "strengths": "pontos fortes VISÍVEIS",
                                "weaknesses": "pontos a melhorar (apenas do que dá pra ver)",
                                "tip": "dica técnica específica para o que está na foto"
                            }`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: data.image
                            }
                        }
                    ]
                }
            ];
        }
    } else {
        return res.status(400).json({ error: 'Unknown action' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 300,
            response_format: { type: 'json_object' }
        })
    });

    const result = await response.json();

    if (result.error) {
        return res.status(500).json({ error: result.error.message });
    }

    const content = JSON.parse(result.choices[0].message.content);
    return res.status(200).json(content);

} catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ error: 'Failed to process AI request' });
}
}
