import { getAll } from '/src/js/core/db.js';
import { formatDate } from '/src/js/core/utils.js';

export const ProgressView = async () => {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `<h1 class="text-large-title">Progresso</h1>`;
    container.appendChild(header);

    try {
        const logs = await getAll('logs');

        // 1. Stats Calculation
        const totalWorkouts = logs.length;
        const totalTimeSeconds = logs.reduce((acc, log) => {
            const [mins, secs] = (log.duration || '00:00').split(':').map(Number);
            return acc + (mins * 60) + secs;
        }, 0);
        const totalHours = Math.floor(totalTimeSeconds / 3600);
        const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

        // Stats Grid
        const statsGrid = document.createElement('div');
        statsGrid.style.display = 'grid';
        statsGrid.style.gridTemplateColumns = '1fr 1fr';
        statsGrid.style.gap = 'var(--spacing-md)';
        statsGrid.style.marginBottom = 'var(--spacing-lg)';

        const createStatCard = (label, value, icon, color) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'center';
            card.style.padding = 'var(--spacing-lg) var(--spacing-md)';
            card.style.marginBottom = '0';
            card.style.gap = '12px';

            card.innerHTML = `
                <div style="width: 48px; height: 48px; border-radius: 50%; background: ${color}20; display: flex; align-items: center; justify-content: center; color: ${color};">
                    <i data-lucide="${icon}" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="text-center">
                    <div class="text-title-2 font-bold">${value}</div>
                    <div class="text-caption-1 text-secondary">${label}</div>
                </div>
            `;
            return card;
        };

        statsGrid.appendChild(createStatCard('Treinos', totalWorkouts, 'dumbbell', 'var(--system-blue)'));
        statsGrid.appendChild(createStatCard('Tempo Total', `${totalHours}h ${totalMinutes}m`, 'clock', 'var(--system-orange)'));

        container.appendChild(statsGrid);

        // 2. Weight Evolution Section
        const evolutionHeader = document.createElement('div');
        evolutionHeader.className = 'section-header';
        evolutionHeader.innerHTML = `
            <h2 class="text-title-3">Evolução de Carga</h2>
            <i data-lucide="trending-up" style="color: var(--system-green);"></i>
        `;
        container.appendChild(evolutionHeader);

        const evolutionCard = document.createElement('div');
        evolutionCard.className = 'card';
        evolutionCard.style.padding = 'var(--spacing-md)';

        // Extract all unique exercises from logs
        const exercises = new Set();
        logs.forEach(log => {
            if (log.data) {
                Object.keys(log.data).forEach(exName => exercises.add(exName));
            }
        });
        const sortedExercises = Array.from(exercises).sort();

        // Exercise Selector
        const selectorWrapper = document.createElement('div');
        selectorWrapper.style.marginBottom = 'var(--spacing-md)';
        selectorWrapper.innerHTML = `
            <label class="text-caption-1 text-secondary" style="margin-bottom: 8px; display: block;">SELECIONE O EXERCÍCIO</label>
            <select id="exercise-selector" class="input-field">
                <option value="">Selecione...</option>
                ${sortedExercises.map(ex => `<option value="${ex}">${ex}</option>`).join('')}
            </select>
        `;
        evolutionCard.appendChild(selectorWrapper);

        // Evolution Display Area
        const evolutionDisplay = document.createElement('div');
        evolutionDisplay.id = 'evolution-display';
        evolutionDisplay.innerHTML = `<div class="text-center text-secondary text-caption-1">Selecione um exercício para ver o histórico.</div>`;
        evolutionCard.appendChild(evolutionDisplay);

        container.appendChild(evolutionCard);

        // Handle Selection Change
        const selector = selectorWrapper.querySelector('#exercise-selector');
        selector.addEventListener('change', (e) => {
            const exerciseName = e.target.value;
            if (!exerciseName) {
                evolutionDisplay.innerHTML = `<div class="text-center text-secondary text-caption-1">Selecione um exercício para ver o histórico.</div>`;
                return;
            }

            // Filter logs containing this exercise
            const history = logs
                .filter(log => log.data && log.data[exerciseName])
                .map(log => {
                    const sets = log.data[exerciseName];
                    // Find max weight used in this session
                    const maxWeight = sets.reduce((max, set) => Math.max(max, parseFloat(set.weight) || 0), 0);
                    return { date: log.date, weight: maxWeight };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

            if (history.length === 0) {
                evolutionDisplay.innerHTML = `<div class="text-center text-secondary">Sem dados para este exercício.</div>`;
            } else {
                // Determine trend
                let trendHtml = '';
                if (history.length >= 2) {
                    const current = history[0].weight;
                    const previous = history[1].weight;
                    if (current > previous) {
                        trendHtml = `<div style="color: var(--system-green); display: flex; align-items: center; gap: 4px; font-size: 13px;"><i data-lucide="trending-up" style="width: 14px;"></i> Subindo</div>`;
                    } else if (current < previous) {
                        trendHtml = `<div style="color: var(--system-red); display: flex; align-items: center; gap: 4px; font-size: 13px;"><i data-lucide="trending-down" style="width: 14px;"></i> Caindo</div>`;
                    } else {
                        trendHtml = `<div style="color: var(--text-secondary); display: flex; align-items: center; gap: 4px; font-size: 13px;"><i data-lucide="minus" style="width: 14px;"></i> Estável</div>`;
                    }
                }

                evolutionDisplay.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <div class="text-caption-1 text-secondary">PR ATUAL</div>
                            <div class="text-title-2 font-bold">${Math.max(...history.map(h => h.weight))} kg</div>
                        </div>
                        ${trendHtml}
                    </div>
                    <div class="list-group" style="margin-bottom: 0; box-shadow: none; border: 1px solid var(--separator);">
                        ${history.slice(0, 5).map(h => `
                            <div class="list-item" style="padding: 12px;">
                                <span class="text-caption-1 text-secondary">${formatDate(h.date)}</span>
                                <span class="text-body font-semibold">${h.weight} kg</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        });


        // 3. Recent History List
        const historyHeader = document.createElement('div');
        historyHeader.className = 'section-header';
        historyHeader.innerHTML = `
            <h2 class="text-title-3">Histórico Geral</h2>
            <i data-lucide="calendar-days" style="color: var(--text-secondary);"></i>
        `;
        container.appendChild(historyHeader);

        const list = document.createElement('div');
        list.className = 'list-group';

        if (logs.length === 0) {
            list.innerHTML = `
                <div class="list-item" style="justify-content: center; padding: 32px;">
                    <span class="text-secondary">Nenhum treino registrado ainda.</span>
                </div>
            `;
        } else {
            logs.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(log => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--system-green);"></div>
                        <div>
                            <div class="text-body font-semibold">${log.workoutName}</div>
                            <div class="text-caption-1 text-secondary">${new Date(log.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="text-callout font-monospaced text-secondary">${log.duration}</div>
                `;
                list.appendChild(item);
            });
        }
        container.appendChild(list);

    } catch (e) {
        console.error('Error loading stats', e);
    }

    // Initialize Icons
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
};
