import { getAll, put, getById } from '/src/js/core/db.js';
import { navigate } from '/src/js/core/router.js';
import { formatDate, calculateStreak } from '/src/js/core/utils.js';
import { config } from '/src/js/config.js';

export const HomeView = async () => {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    container.style.paddingBottom = '100px';

    // Header
    const header = document.createElement('header');
    header.style.marginBottom = 'var(--spacing-lg)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const date = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('pt-BR', options);

    header.innerHTML = `
        <div>
            <div class="text-caption-1 text-secondary" style="text-transform: uppercase; letter-spacing: 0.5px;">${dateStr}</div>
            <h1 class="text-title-1">Bom dia, Atleta</h1>
        </div>
        <div style="width: 40px; height: 40px; background: var(--system-gray5); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
             <i data-lucide="user" style="color: var(--accent-color);"></i>
        </div>
    `;
    container.appendChild(header);

    // API Key Check (Localhost only)
    if (!config.OPENAI_API_KEY && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const keyCard = document.createElement('div');
        keyCard.className = 'card';
        keyCard.style.border = '1px solid var(--system-red)';
        keyCard.innerHTML = `
            <h3 class="text-headline" style="color: var(--system-red); margin-bottom: 8px;">⚠️ Configuração Necessária</h3>
            <p class="text-body text-secondary" style="margin-bottom: 12px;">Para usar a IA localmente, insira sua API Key da OpenAI.</p>
            <input type="password" id="api-key-input" class="input-field" placeholder="sk-..." style="margin-bottom: 8px;">
            <button id="save-key-btn" class="btn btn-primary">Salvar Key</button>
        `;
        container.appendChild(keyCard);

        setTimeout(() => {
            const btn = document.getElementById('save-key-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    const key = document.getElementById('api-key-input').value;
                    if (key.startsWith('sk-')) {
                        localStorage.setItem('openai_api_key', key);
                        alert('Key salva! Recarregando...');
                        window.location.reload();
                    } else {
                        alert('Key inválida. Deve começar com "sk-"');
                    }
                });
            }
        }, 0);
    }

    // Gamification Card (Weekly Goal)
    const logs = await getAll('logs');
    const streak = calculateStreak(logs);

    // Calculate Weekly Progress
    const getWeeklyLogs = (logs) => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        return logs.filter(l => new Date(l.date) >= startOfWeek).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const weeklyLogs = getWeeklyLogs(logs);
    const uniqueDays = new Set(weeklyLogs.map(l => new Date(l.date).toDateString())).size;
    const weeklyGoal = 4;
    const progressPercent = Math.min(uniqueDays / weeklyGoal, 1) * 100;
    const remaining = Math.max(weeklyGoal - uniqueDays, 0);

    const gameCard = document.createElement('div');
    gameCard.className = 'card';
    gameCard.style.marginBottom = 'var(--spacing-lg)';
    gameCard.style.background = 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)';
    gameCard.style.border = '1px solid var(--separator)';
    gameCard.style.display = 'flex';
    gameCard.style.alignItems = 'center';
    gameCard.style.justifyContent = 'space-between';
    gameCard.style.padding = '20px';

    // Circular Progress SVG
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    const strokeColor = progressPercent >= 100 ? 'var(--system-green)' : 'var(--system-blue)';

    gameCard.innerHTML = `
        <div>
            <div class="text-caption-1 text-secondary" style="margin-bottom: 4px;">Meta Semanal</div>
            <div class="text-title-2" style="color: white; margin-bottom: 4px;">${uniqueDays}/${weeklyGoal} Treinos</div>
            <div class="text-caption-2" style="color: ${remaining === 0 ? 'var(--system-green)' : 'var(--text-secondary)'};">
                ${remaining === 0 ? 'Meta batida! 🎉' : `Faltam ${remaining} para a meta`}
            </div>
        </div>
        <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
            <svg width="64" height="64" style="transform: rotate(-90deg);">
                <circle cx="32" cy="32" r="${radius}" stroke="rgba(255,255,255,0.1)" stroke-width="6" fill="none" />
                <circle cx="32" cy="32" r="${radius}" stroke="${strokeColor}" stroke-width="6" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease;" />
            </svg>
            <i data-lucide="${progressPercent >= 100 ? 'trophy' : 'activity'}" style="position: absolute; width: 20px; color: ${strokeColor};"></i>
        </div>
    `;
    container.appendChild(gameCard);

    // Goal Card
    let profile = await getById('profile', 'user');
    if (!profile) {
        profile = { id: 'user', name: 'Atleta', goal: 'hypertrophy' };
        await put('profile', profile);
    }

    const goalMap = {
        'hypertrophy': { icon: 'biceps-flexed', label: 'Hipertrofia', color: 'var(--system-blue)' },
        'strength': { icon: 'dumbbell', label: 'Força Pura', color: 'var(--system-red)' },
        'endurance': { icon: 'activity', label: 'Resistência', color: 'var(--system-green)' },
        'weight_loss': { icon: 'flame', label: 'Perda de Peso', color: 'var(--system-orange)' }
    };

    const currentGoal = goalMap[profile.goal] || goalMap['hypertrophy'];

    const goalCard = document.createElement('div');
    goalCard.className = 'card';
    goalCard.style.marginBottom = 'var(--spacing-lg)';
    goalCard.style.background = 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)';
    goalCard.style.display = 'flex';
    goalCard.style.alignItems = 'center';
    goalCard.style.justifyContent = 'space-between';
    goalCard.style.cursor = 'pointer';

    goalCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: ${currentGoal.color}20; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="${currentGoal.icon}" style="color: ${currentGoal.color}; width: 24px; height: 24px;"></i>
            </div>
            <div>
                <div class="text-caption-1 text-secondary">Objetivo Atual</div>
                <div class="text-headline" style="color: var(--text-primary);">${currentGoal.label}</div>
            </div>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-secondary);"></i>
    `;

    goalCard.addEventListener('click', async () => {
        const newGoal = prompt("Escolha seu objetivo:\n1. Hipertrofia\n2. Força\n3. Resistência\n4. Perda de Peso", "1");
        if (newGoal) {
            let key = 'hypertrophy';
            if (newGoal === '2') key = 'strength';
            if (newGoal === '3') key = 'endurance';
            if (newGoal === '4') key = 'weight_loss';

            profile.goal = key;
            await put('profile', profile);
            navigate('/'); // Reload to update
        }
    });

    container.appendChild(goalCard);


    // Start Workout Card
    const startCard = document.createElement('div');
    startCard.className = 'card';
    startCard.style.background = 'linear-gradient(135deg, var(--accent-color) 0%, #0055b3 100%)';
    startCard.style.color = 'white';
    startCard.style.marginBottom = 'var(--spacing-lg)';
    startCard.style.display = 'flex';
    startCard.style.justifyContent = 'space-between';
    startCard.style.alignItems = 'center';
    startCard.style.cursor = 'pointer';
    startCard.style.boxShadow = '0 8px 16px rgba(0, 122, 255, 0.2)';

    startCard.innerHTML = `
        <div>
            <h2 class="text-title-2" style="margin-bottom: 4px;">Começar Treino</h2>
            <p class="text-body" style="opacity: 0.9;">Registrar atividade de hoje</p>
        </div>
        <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="play" fill="white"></i>
        </div>
    `;
    startCard.addEventListener('click', () => navigate('/library'));
    container.appendChild(startCard);

    // Weekly Feed (Detailed)
    const feedTitle = document.createElement('h3');
    feedTitle.className = 'text-headline';
    feedTitle.style.marginBottom = 'var(--spacing-md)';
    feedTitle.textContent = 'Treinos da Semana';
    container.appendChild(feedTitle);

    if (weeklyLogs.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'card';
        emptyState.style.textAlign = 'center';
        emptyState.style.padding = '32px';
        emptyState.innerHTML = `
            <i data-lucide="calendar-days" style="width: 48px; height: 48px; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <p class="text-body text-secondary">Nenhum treino essa semana.</p>
            <p class="text-caption-1 text-secondary" style="margin-top: 8px;">Bora começar?</p>
        `;
        container.appendChild(emptyState);
    } else {
        weeklyLogs.forEach(log => {
            // Extract exercises and max weights
            const exercises = [];
            let totalLoad = 0;

            if (log.data) {
                Object.entries(log.data).forEach(([name, data]) => {
                    let maxWeight = 0;
                    if (data.sets) {
                        data.sets.forEach(s => {
                            const w = parseFloat(s.weight) || 0;
                            const r = parseFloat(s.reps) || 0;
                            if (w > maxWeight) maxWeight = w;
                            totalLoad += w * r;
                        });
                    }
                    if (maxWeight > 0) {
                        exercises.push({ name, maxWeight });
                    }
                });
            }

            const logCard = document.createElement('div');
            logCard.className = 'card';
            logCard.style.marginBottom = '16px';
            logCard.style.padding = '0'; // Custom padding
            logCard.style.overflow = 'hidden';

            // Card Header
            const cardHeader = document.createElement('div');
            cardHeader.style.padding = '16px';
            cardHeader.style.background = 'rgba(255, 255, 255, 0.03)';
            cardHeader.style.borderBottom = '1px solid var(--separator)';
            cardHeader.style.display = 'flex';
            cardHeader.style.justifyContent = 'space-between';
            cardHeader.style.alignItems = 'center';

            cardHeader.innerHTML = `
                <div>
                    <h4 class="text-headline" style="font-size: 17px;">${log.workoutName}</h4>
                    <div class="text-caption-1 text-secondary" style="text-transform: capitalize;">
                        ${new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'long' })} • ${new Date(log.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="text-caption-2 text-secondary">Duração</div>
                    <div class="text-subhead" style="font-family: var(--font-mono);">${log.duration}</div>
                </div>
            `;
            logCard.appendChild(cardHeader);

            // Exercises List
            const exercisesList = document.createElement('div');
            exercisesList.style.padding = '12px 16px';

            if (exercises.length > 0) {
                exercises.forEach(ex => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '6px 0';
                    row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    row.lastChild && (row.style.borderBottom = 'none'); // Remove last border logic if possible, css last-child better but inline style here.

                    row.innerHTML = `
                        <div class="text-body" style="font-size: 14px; color: var(--text-secondary);">${ex.name}</div>
                        <div class="text-body" style="font-size: 14px; color: var(--text-primary); font-weight: 600;">${ex.maxWeight}kg</div>
                    `;
                    exercisesList.appendChild(row);
                });
                // Remove last border manually
                if (exercisesList.lastChild) exercisesList.lastChild.style.borderBottom = 'none';
            } else {
                exercisesList.innerHTML = `<div class="text-caption-1 text-secondary">Sem dados de exercícios.</div>`;
            }
            logCard.appendChild(exercisesList);

            // Footer (Total Load)
            const cardFooter = document.createElement('div');
            cardFooter.style.padding = '10px 16px';
            cardFooter.style.background = 'rgba(0, 0, 0, 0.2)';
            cardFooter.style.display = 'flex';
            cardFooter.style.justifyContent = 'flex-end';
            cardFooter.style.alignItems = 'center';
            cardFooter.style.gap = '6px';

            cardFooter.innerHTML = `
                <i data-lucide="weight" style="width: 14px; color: var(--text-secondary);"></i>
                <span class="text-caption-2 text-secondary">Volume Total:</span>
                <span class="text-caption-1" style="color: var(--text-primary); font-weight: 600;">${(totalLoad / 1000).toFixed(1)} ton</span>
            `;
            logCard.appendChild(cardFooter);

            container.appendChild(logCard);
        });
    }

    // Footer Credits
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '40px';
    footer.style.marginBottom = '20px';
    footer.style.opacity = '0.5';
    footer.innerHTML = `
        <p class="text-caption-2" style="letter-spacing: 1px; font-weight: 600; color: var(--text-secondary);">FEITO POR RAFHAEL CORSINI. O MONSTRO 🚀</p>
    `;
    container.appendChild(footer);

    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
};
