import { getAll, put, getById, add, remove } from '/src/js/core/db.js';
import { calculateTDEE, calculateMacros, generateId } from '/src/js/core/utils.js';
import { navigate } from '/src/js/core/router.js';

export const NutritionView = async (params) => {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    container.style.paddingBottom = '100px';

    // Handle Date Selection
    const today = new Date();
    let selectedDate = today;

    if (params && params.date) {
        selectedDate = new Date(params.date);
    }

    // Helper for date navigation
    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        navigate(`/nutrition?date=${newDate.toISOString().split('T')[0]}`);
    };

    // Header with Date Navigation
    const header = document.createElement('header');
    header.style.marginBottom = 'var(--spacing-lg)';
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h1 class="text-title-1">Nutrição</h1>
            <button id="today-btn" class="btn-text" style="font-size: 14px; color: var(--accent-color);">Hoje</button>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 12px;">
            <button id="prev-day" class="btn-icon" style="width: 32px; height: 32px;"><i data-lucide="chevron-left"></i></button>
            <span class="text-body" style="font-weight: 600;">${selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button id="next-day" class="btn-icon" style="width: 32px; height: 32px;"><i data-lucide="chevron-right"></i></button>
        </div>
    `;
    container.appendChild(header);

    // Check Profile Data
    let profile = await getById('profile', 'user');
    if (!profile) {
        profile = { id: 'user', name: 'Atleta', goal: 'hypertrophy' };
    }

    // If missing nutrition data, show Setup Form
    if (!profile.weight || !profile.height || !profile.age) {
        renderSetupForm(container, profile);
    } else {
        await renderDashboard(container, profile, selectedDate);
    }

    // Navigation Events
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('prev-day')?.addEventListener('click', () => changeDate(-1));
        document.getElementById('next-day')?.addEventListener('click', () => changeDate(1));
        document.getElementById('today-btn')?.addEventListener('click', () => navigate('/nutrition'));
    }, 0);

    return container;
};

const renderSetupForm = (container, profile) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <h2 class="text-title-2" style="margin-bottom: 16px;">Configurar Perfil</h2>
        <p class="text-body text-secondary" style="margin-bottom: 24px;">Para calcular sua dieta, preciso de alguns dados.</p>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
                <label class="text-caption-1 text-secondary">Peso (kg)</label>
                <input type="number" id="weight" class="input-field" placeholder="Ex: 70" value="${profile.weight || ''}">
            </div>
            <div>
                <label class="text-caption-1 text-secondary">Altura (cm)</label>
                <input type="number" id="height" class="input-field" placeholder="Ex: 175" value="${profile.height || ''}">
            </div>
            <div>
                <label class="text-caption-1 text-secondary">Idade</label>
                <input type="number" id="age" class="input-field" placeholder="Ex: 25" value="${profile.age || ''}">
            </div>
            <div>
                <label class="text-caption-1 text-secondary">Gênero</label>
                <select id="gender" class="input-field">
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                </select>
            </div>
            <div>
                <label class="text-caption-1 text-secondary">Nível de Atividade</label>
                <select id="activity" class="input-field">
                    <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
                    <option value="light">Leve (Treino 1-3 dias/semana)</option>
                    <option value="moderate">Moderado (Treino 3-5 dias/semana)</option>
                    <option value="active">Ativo (Treino 6-7 dias/semana)</option>
                    <option value="athlete">Atleta (Treino 2x por dia)</option>
                </select>
            </div>
            <button id="save-profile" class="btn btn-primary" style="margin-top: 8px;">
                Calcular Minha Dieta
            </button>
        </div>
    `;
    container.appendChild(card);

    setTimeout(() => {
        document.getElementById('save-profile').addEventListener('click', async () => {
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value);
            const age = parseFloat(document.getElementById('age').value);
            const gender = document.getElementById('gender').value;
            const activity = document.getElementById('activity').value;

            if (weight && height && age) {
                profile.weight = weight;
                profile.height = height;
                profile.age = age;
                profile.gender = gender;
                profile.activity = activity;

                await put('profile', profile);

                // Save to Weight History (Turbo Feature)
                try {
                    const weightLog = {
                        id: generateId(),
                        date: new Date().toISOString(),
                        weight: weight
                    };
                    await add('weight_history', weightLog);
                } catch (e) {
                    console.log('Error saving weight history', e);
                }

                navigate('/nutrition'); // Reload view
            } else {
                alert('Por favor, preencha todos os campos.');
            }
        });
    }, 0);
};

const renderDashboard = async (container, profile, selectedDate) => {
    // Calculate Target Macros
    const tdee = calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, profile.activity);
    const macros = calculateMacros(tdee, profile.goal, profile.weight);

    // Get Meals for Selected Date
    const dateString = selectedDate.toDateString();
    let allMeals = [];
    try {
        allMeals = await getAll('nutrition_logs');
    } catch (e) {
        console.log('nutrition_logs store may not exist yet');
    }
    const dayMeals = allMeals.filter(m => new Date(m.date).toDateString() === dateString);

    // Calculate Totals
    const totals = dayMeals.reduce((acc, meal) => {
        acc.calories += meal.calories || 0;
        acc.protein += meal.protein || 0;
        acc.carbs += meal.carbs || 0;
        acc.fats += meal.fats || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Progress Percentages
    const calPercent = Math.min((totals.calories / macros.calories) * 100, 100);
    const proteinPercent = Math.min((totals.protein / macros.protein) * 100, 100);
    const carbsPercent = Math.min((totals.carbs / macros.carbs) * 100, 100);
    const fatsPercent = Math.min((totals.fats / macros.fats) * 100, 100);

    // Progress Card with Rings
    const progressCard = document.createElement('div');
    progressCard.className = 'card';
    progressCard.style.background = 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)';
    progressCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <div class="text-caption-1 text-secondary">Consumo Diário</div>
                <div class="text-title-1" style="color: white;">${totals.calories} <span class="text-body" style="color: var(--text-secondary);">/ ${macros.calories} kcal</span></div>
            </div>
            ${renderProgressRing(calPercent, 'var(--system-blue)', 28)}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; text-align: center;">
                <div class="text-headline" style="color: ${proteinPercent >= 100 ? 'var(--system-green)' : 'var(--system-blue)'};">${totals.protein}g</div>
                <div class="text-caption-2 text-secondary">/ ${macros.protein}g Prot</div>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; text-align: center;">
                <div class="text-headline" style="color: ${carbsPercent >= 100 ? 'var(--system-green)' : 'var(--system-green)'};">${totals.carbs}g</div>
                <div class="text-caption-2 text-secondary">/ ${macros.carbs}g Carbs</div>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; text-align: center;">
                <div class="text-headline" style="color: ${fatsPercent >= 100 ? 'var(--system-green)' : 'var(--system-orange)'};">${totals.fats}g</div>
                <div class="text-caption-2 text-secondary">/ ${macros.fats}g Gord</div>
            </div>
        </div>
    `;
    container.appendChild(progressCard);

    // Water Tracker
    let waterIntake = 0;
    try {
        const dailyStats = await getById('daily_stats', dateString);
        if (dailyStats) {
            waterIntake = dailyStats.water || 0;
        }
    } catch (e) {
        // Store might not exist yet
    }

    const waterCard = document.createElement('div');
    waterCard.className = 'card';
    waterCard.style.background = 'linear-gradient(135deg, #0a84ff 0%, #0056b3 100%)';
    waterCard.style.color = 'white';
    waterCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="droplet" style="fill: white;"></i>
                <h3 class="text-headline" style="color: white;">Hidratação</h3>
            </div>
            <div class="text-title-1" style="color: white;">${(waterIntake / 1000).toFixed(1)}L</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <button id="remove-water" class="btn-icon" style="background: rgba(255,255,255,0.2); color: white; width: 40px; height: 40px;">
                <i data-lucide="minus"></i>
            </button>
            
            <div style="display: flex; gap: 4px;">
                ${Array(8).fill(0).map((_, i) => `
                    <div style="width: 8px; height: 24px; border-radius: 4px; background: ${i < (waterIntake / 250) ? 'white' : 'rgba(255,255,255,0.3)'};"></div>
                `).join('')}
            </div>

            <button id="add-water" class="btn-icon" style="background: white; color: var(--system-blue); width: 40px; height: 40px;">
                <i data-lucide="plus"></i>
            </button>
        </div>
    `;
    container.appendChild(waterCard);

    // AI Meal Logger (Only show if viewing Today)
    const isToday = selectedDate.toDateString() === new Date().toDateString();

    if (isToday) {
        const loggerCard = document.createElement('div');
        loggerCard.className = 'card';
        loggerCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: rgba(10, 132, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="sparkles" style="color: var(--system-blue); width: 20px;"></i>
                </div>
                <h3 class="text-headline">Registrar Refeição (IA)</h3>
            </div>
            <p class="text-body text-secondary" style="margin-bottom: 16px;">Descreva o que você comeu e a IA calcula os macros.</p>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="meal-input" class="input-field" placeholder="Ex: 3 ovos mexidos e café...">
                <button id="log-meal-btn" class="btn-icon" style="background: var(--accent-color); color: white; border-radius: 12px; width: 54px;">
                    <i data-lucide="send"></i>
                </button>
            </div>
        `;
        container.appendChild(loggerCard);
    }

    // Meals List
    if (dayMeals.length > 0) {
        const mealsTitle = document.createElement('h3');
        mealsTitle.className = 'text-headline';
        mealsTitle.style.margin = '24px 0 12px';
        mealsTitle.textContent = 'Refeições';
        container.appendChild(mealsTitle);

        dayMeals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'card';
            mealCard.style.marginBottom = '12px';
            mealCard.style.padding = '16px';
            mealCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div class="text-body" style="margin-bottom: 4px;">${meal.foods?.join(', ') || meal.description}</div>
                        <div class="text-caption-1 text-secondary">${new Date(meal.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style="text-align: right; margin-right: 12px;">
                        <div class="text-headline" style="color: var(--system-blue);">${meal.calories} kcal</div>
                        <div class="text-caption-2 text-secondary">P: ${meal.protein}g | C: ${meal.carbs}g | G: ${meal.fats}g</div>
                    </div>
                    <button class="btn-icon delete-meal-btn" data-id="${meal.id}" style="width: 32px; height: 32px; background: rgba(255, 69, 58, 0.1); color: var(--system-red);">
                        <i data-lucide="trash-2" style="width: 16px;"></i>
                    </button>
                </div>
            `;
            container.appendChild(mealCard);
        });
    } else {
        const emptyState = document.createElement('div');
        emptyState.style.textAlign = 'center';
        emptyState.style.padding = '40px 0';
        emptyState.innerHTML = `
            <p class="text-body text-secondary">Nenhuma refeição registrada neste dia.</p>
        `;
        container.appendChild(emptyState);
    }

    // Event Listeners
    setTimeout(() => {
        // Water Logic
        const updateWater = async (amount) => {
            const newAmount = Math.max(0, waterIntake + amount);
            await put('daily_stats', { date: dateString, water: newAmount });
            // Refresh view
            const currentUrl = window.location.hash.slice(1) || '/nutrition';
            navigate(currentUrl);
        };

        document.getElementById('add-water')?.addEventListener('click', () => updateWater(250));
        document.getElementById('remove-water')?.addEventListener('click', () => updateWater(-250));

        // Log Meal
        const btn = document.getElementById('log-meal-btn');
        const input = document.getElementById('meal-input');

        if (btn) {
            btn.addEventListener('click', async () => {
                const text = input.value;
                if (!text) return;

                const originalIcon = btn.innerHTML;
                btn.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>`;

                try {
                    const aiModule = await import('/src/js/services/ai.js');
                    const result = await aiModule.parseMeal(text);

                    if (result) {
                        const mealLog = {
                            id: generateId(),
                            date: new Date().toISOString(),
                            description: text,
                            foods: result.foods,
                            calories: result.calories,
                            protein: result.protein,
                            carbs: result.carbs,
                            fats: result.fats
                        };
                        await add('nutrition_logs', mealLog);
                        input.value = '';
                        navigate('/nutrition');
                    } else {
                        alert('Erro ao analisar refeição. Verifique sua API Key.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Erro ao conectar com a IA.');
                } finally {
                    btn.innerHTML = originalIcon;
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }

        // Delete Meal
        document.querySelectorAll('.delete-meal-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Tem certeza que deseja excluir esta refeição?')) {
                    await remove('nutrition_logs', id);
                    // Refresh current view preserving date
                    const currentUrl = window.location.hash.slice(1) || '/nutrition';
                    navigate(currentUrl);
                }
            });
        });

    }, 0);
};

// Helper to render SVG progress ring
const renderProgressRing = (percent, color, radius) => {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    const size = (radius + 6) * 2;
    const center = size / 2;

    return `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
            <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
                <circle cx="${center}" cy="${center}" r="${radius}" stroke="rgba(255,255,255,0.1)" stroke-width="6" fill="none" />
                <circle cx="${center}" cy="${center}" r="${radius}" stroke="${color}" stroke-width="6" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease;" />
            </svg>
            <span style="position: absolute; font-size: 12px; font-weight: 600; color: white;">${Math.round(percent)}%</span>
        </div>
    `;
};
