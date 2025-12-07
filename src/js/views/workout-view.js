import { getById, add, getAll, put } from '/src/js/core/db.js';
import { navigate } from '/src/js/core/router.js';
import { formatTime, generateId, formatDate } from '/src/js/core/utils.js';
import { getCoachAdvice, analyzeWorkout } from '/src/js/services/ai.js';

export const WorkoutView = async (params) => {
    const workoutId = params?.id;

    const container = document.createElement('div');
    container.className = 'container slide-up';
    container.style.paddingBottom = '160px'; // Extra padding for bottom floaters

    let workout = null;
    let gyms = [];
    let logs = [];
    let profile = null;
    let startTime = Date.now();
    let timerInterval;
    let selectedGymId = 'blue-fit';
    let logData = {};
    let restTimerInterval;

    try {
        workout = await getById('workouts', workoutId);
        gyms = await getAll('gyms');
        logs = await getAll('logs');
        profile = await getById('profile', 'user');
    } catch (e) {
        console.error('Error loading workout', e);
        return container;
    }

    // Helper: Get History
    const getExerciseHistory = (exerciseName) => {
        return logs
            .filter(l => l.data && l.data[exerciseName])
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(l => {
                const entry = l.data[exerciseName];
                const sets = Array.isArray(entry) ? entry : entry.sets || [];
                const note = !Array.isArray(entry) ? entry.note : null;
                const maxWeight = sets.reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), 0);
                return { date: l.date, weight: maxWeight, note };
            });
    };

    // Helper: Generate Sparkline SVG
    const generateSparkline = (data) => {
        if (data.length < 2) return '';
        const width = 60;
        const height = 20;
        const padding = 2;
        const maxVal = Math.max(...data.map(d => d.weight));
        const minVal = Math.min(...data.map(d => d.weight));
        const range = maxVal - minVal || 1;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((d.weight - minVal) / range) * (height - 2 * padding) - padding;
            return `${x},${y}`;
        }).join(' ');

        return `
            <svg width="${width}" height="${height}" style="overflow: visible; vertical-align: middle;">
                <polyline points="${points}" fill="none" stroke="var(--system-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="${points.split(' ').pop().split(',')[0]}" cy="${points.split(' ').pop().split(',')[1]}" r="3" fill="var(--system-green)" />
            </svg>
        `;
    };

    const calculateTrend = (data) => {
        if (data.length < 2) return null;
        const first = data[0].weight;
        const last = data[data.length - 1].weight;
        const diff = last - first;
        return diff > 0 ? `+${diff}kg` : `${diff}kg`;
    };

    // Top Bar (Premium Glassmorphism)
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.position = 'sticky';
    topBar.style.top = '0';
    topBar.style.zIndex = '100';
    topBar.style.padding = '16px 20px';
    topBar.style.margin = '0 -20px 24px -20px';
    // Advanced Glass Effect
    topBar.style.background = 'rgba(28, 28, 30, 0.75)';
    topBar.style.backdropFilter = 'blur(25px) saturate(180%)'; // Apple-style saturation
    topBar.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
    topBar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';

    const timerPill = document.createElement('div');
    timerPill.style.background = 'rgba(255, 255, 255, 0.08)';
    timerPill.style.padding = '6px 14px';
    timerPill.style.borderRadius = '100px';
    timerPill.style.display = 'flex';
    timerPill.style.alignItems = 'center';
    timerPill.style.gap = '8px';
    timerPill.style.border = '1px solid rgba(255,255,255,0.05)';
    timerPill.innerHTML = `
        <i data-lucide="clock" style="width: 14px; color: var(--accent-color);"></i>
        <span class="font-monospaced font-bold" id="main-timer" style="font-size: 15px; color: white; letter-spacing: 0.5px;">00:00</span>
    `;

    const finishBtnTop = document.createElement('button');
    finishBtnTop.className = 'btn-primary';
    finishBtnTop.style.padding = '8px 16px';
    finishBtnTop.style.fontSize = '14px';
    finishBtnTop.style.height = '34px';
    finishBtnTop.style.width = 'auto';
    finishBtnTop.style.background = 'var(--accent-color)'; // Ensure solid color
    finishBtnTop.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
    finishBtnTop.textContent = 'Concluir';

    topBar.appendChild(timerPill);
    topBar.appendChild(finishBtnTop);
    container.appendChild(topBar);

    // Header Content
    const header = document.createElement('div');
    header.style.marginBottom = '32px';

    const title = document.createElement('h1');
    title.className = 'text-title-1';
    title.style.marginBottom = '16px';
    title.style.fontSize = '34px';
    title.style.letterSpacing = '-0.8px'; // Tighter tracking for large titles
    title.style.fontWeight = '800';
    title.textContent = workout.name;
    header.appendChild(title);

    if (workout.type === 'gym') {
        const gymSelector = document.createElement('div');
        gymSelector.style.background = 'rgba(255, 255, 255, 0.04)';
        gymSelector.style.padding = '12px 16px';
        gymSelector.style.borderRadius = '14px'; // Slightly rounder
        gymSelector.style.display = 'flex';
        gymSelector.style.alignItems = 'center';
        gymSelector.style.gap = '12px';
        gymSelector.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        gymSelector.style.transition = 'background 0.2s';

        const mapIcon = document.createElement('div');
        mapIcon.innerHTML = `<i data-lucide="map-pin" style="color: var(--system-blue); width: 20px;"></i>`;

        const gymSelect = document.createElement('select');
        gymSelect.style.background = 'transparent';
        gymSelect.style.border = 'none';
        gymSelect.style.color = 'var(--text-primary)';
        gymSelect.style.fontSize = '16px';
        gymSelect.style.flex = '1';
        gymSelect.style.outline = 'none';
        gymSelect.style.fontWeight = '500';
        gymSelect.style.cursor = 'pointer';

        const renderGymOptions = () => {
            gymSelect.innerHTML = '';
            gyms.forEach(gym => {
                const option = document.createElement('option');
                option.value = gym.id;
                option.textContent = gym.name;
                if (gym.id === selectedGymId) option.selected = true;
                gymSelect.appendChild(option);
            });
        };
        renderGymOptions();
        gymSelect.addEventListener('change', (e) => selectedGymId = e.target.value);

        const addGymBtn = document.createElement('button');
        addGymBtn.style.background = 'none';
        addGymBtn.style.border = 'none';
        addGymBtn.style.color = 'var(--system-blue)';
        addGymBtn.style.padding = '4px';
        addGymBtn.innerHTML = `<i data-lucide="plus-circle" style="width: 20px;"></i>`;
        addGymBtn.addEventListener('click', async () => {
            const newName = prompt("Nome da nova academia:");
            if (newName) {
                const newGym = { id: generateId(), name: newName };
                await add('gyms', newGym);
                gyms.push(newGym);
                selectedGymId = newGym.id;
                renderGymOptions();
            }
        });

        gymSelector.appendChild(mapIcon);
        gymSelector.appendChild(gymSelect);
        gymSelector.appendChild(addGymBtn);
        header.appendChild(gymSelector);
    }
    container.appendChild(header);

    // Rest Timer Pill (Floating Bottom with Spring Animation)
    const restTimerPill = document.createElement('div');
    restTimerPill.style.position = 'fixed';
    restTimerPill.style.bottom = '40px';
    restTimerPill.style.left = '50%';
    restTimerPill.style.transform = 'translateX(-50%) scale(0.9) translateY(20px)';
    restTimerPill.style.opacity = '0';
    restTimerPill.style.background = 'rgba(0, 122, 255, 0.95)';
    restTimerPill.style.backdropFilter = 'blur(20px)';
    restTimerPill.style.color = 'white';
    restTimerPill.style.padding = '12px 24px';
    restTimerPill.style.borderRadius = '100px';
    restTimerPill.style.boxShadow = '0 12px 32px rgba(0, 122, 255, 0.4)';
    restTimerPill.style.display = 'none'; // Hidden initially
    restTimerPill.style.alignItems = 'center';
    restTimerPill.style.gap = '12px';
    restTimerPill.style.zIndex = '100';
    restTimerPill.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // Spring effect
    restTimerPill.innerHTML = `
        <i data-lucide="hourglass" style="width: 20px; height: 20px;"></i>
        <span class="font-bold font-monospaced" id="rest-timer-val" style="font-size: 17px;">00:60</span>
    `;
    container.appendChild(restTimerPill);

    const startRestTimer = () => {
        clearInterval(restTimerInterval);
        restTimerPill.style.display = 'flex';
        // Trigger reflow
        void restTimerPill.offsetWidth;
        restTimerPill.style.opacity = '1';
        restTimerPill.style.transform = 'translateX(-50%) scale(1) translateY(0)';

        let timeLeft = 60;

        const updateDisplay = () => {
            const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const secs = (timeLeft % 60).toString().padStart(2, '0');
            restTimerPill.querySelector('#rest-timer-val').textContent = `${mins}:${secs}`;
        };
        updateDisplay();

        restTimerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(restTimerInterval);
                restTimerPill.style.transform = 'translateX(-50%) scale(0.9) translateY(20px)';
                restTimerPill.style.opacity = '0';
                setTimeout(() => restTimerPill.style.display = 'none', 500);
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
        }, 1000);
    };

    // Exercises List
    const exerciseList = document.createElement('div');
    container.appendChild(exerciseList);

    const renderExerciseCard = (ex, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.position = 'relative';
        // Premium Card Style
        card.style.background = 'rgba(28, 28, 30, 0.65)';
        card.style.backdropFilter = 'blur(20px) saturate(150%)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.06)';
        card.style.padding = '24px'; // More padding
        card.style.borderRadius = '20px'; // Rounder corners
        card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)'; // Deeper shadow
        card.id = `exercise-card-${index}`;

        if (!logData[ex.name]) {
            logData[ex.name] = { sets: [], note: '', intensity: '' };
        }

        const history = getExerciseHistory(ex.name);
        const lastLog = history.length > 0 ? history[history.length - 1] : null;
        const sparklineSvg = generateSparkline(history);
        const trend = calculateTrend(history);

        const aiSuggestion = workout.nextSessionTips ? workout.nextSessionTips.find(t => t.exercise === ex.name) : null;

        // Header Row
        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'flex-start';
        headerRow.style.marginBottom = '24px';

        const titleDiv = document.createElement('div');
        titleDiv.style.flex = '1';
        titleDiv.innerHTML = `<h3 class="text-headline" style="font-size: 22px; margin-bottom: 6px; letter-spacing: -0.4px;">${ex.name}</h3>`;

        const weightText = lastLog ? `${lastLog.weight}kg` : '--';
        titleDiv.innerHTML += `<div class="text-caption-1 text-secondary" style="font-size: 13px;">Último: <span style="color: var(--text-primary); font-weight: 600;">${weightText}</span></div>`;

        if (trend) {
            titleDiv.innerHTML += `<div class="text-caption-1" style="color: var(--system-green); margin-top: 6px; display: flex; align-items: center; gap: 6px;">${trend} ${sparklineSvg}</div>`;
        }

        // Actions (Top Right)
        const actionsDiv = document.createElement('div');
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '12px';

        // Delete Exercise Button (SVG)
        const deleteExBtn = document.createElement('button');
        deleteExBtn.className = 'btn-icon';
        deleteExBtn.style.width = '36px';
        deleteExBtn.style.height = '36px';
        deleteExBtn.style.background = 'rgba(255, 59, 48, 0.12)';
        deleteExBtn.style.color = 'var(--system-red)';
        deleteExBtn.style.borderRadius = '10px';
        deleteExBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>`;
        deleteExBtn.addEventListener('click', () => {
            if (confirm(`Remover ${ex.name} deste treino?`)) {
                card.style.transition = 'all 0.3s ease';
                card.style.transform = 'scale(0.9) translateY(10px)';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    delete logData[ex.name];
                }, 300);
            }
        });

        // Note Button (Lighter)
        const noteBtn = document.createElement('button');
        noteBtn.className = 'btn-icon';
        noteBtn.style.width = '36px';
        noteBtn.style.height = '36px';
        noteBtn.style.background = 'rgba(255, 255, 255, 0.15)';
        noteBtn.style.color = 'white';
        noteBtn.style.borderRadius = '10px';
        noteBtn.innerHTML = `<i data-lucide="file-text" style="width: 18px;"></i>`;
        noteBtn.addEventListener('click', () => {
            const currentNote = logData[ex.name].note || '';
            const newNote = prompt("Observação:", currentNote);
            if (newNote !== null) logData[ex.name].note = newNote;
        });

        actionsDiv.appendChild(noteBtn);
        actionsDiv.appendChild(deleteExBtn);
        headerRow.appendChild(titleDiv);
        headerRow.appendChild(actionsDiv);
        card.appendChild(headerRow);

        // AI Suggestion Banner
        if (aiSuggestion) {
            const suggestionBox = document.createElement('div');
            suggestionBox.style.background = 'rgba(10, 132, 255, 0.12)';
            suggestionBox.style.border = '1px solid rgba(10, 132, 255, 0.25)';
            suggestionBox.style.borderRadius = '12px';
            suggestionBox.style.padding = '14px';
            suggestionBox.style.marginBottom = '20px';
            suggestionBox.style.display = 'flex';
            suggestionBox.style.gap = '14px';
            suggestionBox.style.alignItems = 'center';
            suggestionBox.innerHTML = `
                <div style="width: 32px; height: 32px; background: rgba(10, 132, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="zap" style="color: var(--system-blue); width: 18px;"></i>
                </div>
                <div>
                    <div class="text-caption-2" style="color: var(--system-blue); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Meta do Coach</div>
                    <div class="text-body" style="color: white; font-size: 14px; font-weight: 500;">${aiSuggestion.suggestion}</div>
                </div>
            `;
            card.appendChild(suggestionBox);
        }

        // AI Coach Button
        const aiBtn = document.createElement('button');
        aiBtn.style.width = '100%';
        aiBtn.style.padding = '12px';
        aiBtn.style.marginBottom = '24px';
        aiBtn.style.background = 'rgba(255, 204, 0, 0.12)';
        aiBtn.style.borderRadius = '12px';
        aiBtn.style.border = '1px solid rgba(255, 204, 0, 0.1)';
        aiBtn.style.color = 'var(--system-yellow)';
        aiBtn.style.fontSize = '13px';
        aiBtn.style.fontWeight = '600';
        aiBtn.style.display = 'flex';
        aiBtn.style.alignItems = 'center';
        aiBtn.style.justifyContent = 'center';
        aiBtn.style.gap = '8px';
        aiBtn.style.transition = 'all 0.2s';
        aiBtn.innerHTML = `<i data-lucide="sparkles" style="width: 16px;"></i> Obter Dica do Coach IA`;

        const adviceBox = document.createElement('div');
        adviceBox.style.display = 'none';
        adviceBox.style.marginBottom = '20px';
        adviceBox.style.padding = '16px';
        adviceBox.style.background = 'rgba(0,0,0,0.3)';
        adviceBox.style.borderRadius = '12px';
        adviceBox.style.border = '1px solid rgba(255, 204, 0, 0.2)';

        aiBtn.addEventListener('click', async () => {
            aiBtn.style.transform = 'scale(0.98)';
            aiBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 16px;"></i> Analisando...`;
            const historyForAI = history.slice(-5).map(h => ({ date: formatDate(h.date), weight: h.weight, reps: '?' }));
            try {
                const adviceJson = await getCoachAdvice(ex.name, historyForAI, profile);
                const advice = JSON.parse(adviceJson);
                adviceBox.style.display = 'block';
                adviceBox.innerHTML = `
                    <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <div class="text-caption-2 text-secondary">Anterior</div>
                            <div class="text-subhead" style="color: white;">${advice.previous_weight}</div>
                        </div>
                        <div style="flex: 1;">
                            <div class="text-caption-2" style="color: var(--system-blue);">Meta Sugerida</div>
                            <div class="text-subhead" style="color: var(--system-blue); font-weight: 700;">${advice.target_weight}</div>
                        </div>
                    </div>
                    <div class="text-caption-1" style="line-height: 1.4;">💡 ${advice.tip}</div>
                `;
                aiBtn.style.display = 'none';
            } catch (e) {
                console.error(e);
                aiBtn.innerHTML = `<i data-lucide="alert-circle" style="width: 16px;"></i> Tentar Novamente`;
            }
            if (window.lucide) window.lucide.createIcons();
        });

        card.appendChild(aiBtn);
        card.appendChild(adviceBox);

        // Sets Container
        const setsContainer = document.createElement('div');
        card.appendChild(setsContainer);

        // Labels Row
        const labelsRow = document.createElement('div');
        labelsRow.style.display = 'flex';
        labelsRow.style.padding = '0 52px 8px 32px'; // Align with inputs
        labelsRow.style.color = 'var(--text-secondary)';
        labelsRow.style.fontSize = '11px';
        labelsRow.style.fontWeight = '700';
        labelsRow.style.letterSpacing = '0.8px';
        labelsRow.style.textTransform = 'uppercase';
        labelsRow.innerHTML = `
            <div style="flex: 1; text-align: center;">KG</div>
            <div style="flex: 1; text-align: center;">REPS</div>
        `;
        setsContainer.appendChild(labelsRow);

        const renderSetRow = (i) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '12px';
            row.style.marginBottom = '12px';
            row.style.alignItems = 'center';
            row.id = `set-${ex.name}-${i}`;

            const num = document.createElement('span');
            num.className = 'text-caption-1 text-secondary';
            num.style.width = '20px';
            num.style.textAlign = 'center';
            num.style.fontWeight = '600';
            num.textContent = i + 1;

            // Premium Input Style
            const createInput = (placeholder, value) => {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'input-field';
                input.style.background = 'rgba(0, 0, 0, 0.25)'; // Darker
                input.style.textAlign = 'center';
                input.style.borderRadius = '10px';
                input.style.padding = '12px';
                input.style.fontSize = '17px'; // Larger font
                input.style.fontWeight = '600';
                input.style.border = '1px solid transparent';
                input.style.transition = 'all 0.2s';
                input.placeholder = placeholder;
                input.style.flex = '1';
                input.value = value;

                input.addEventListener('focus', () => {
                    input.style.background = 'rgba(0, 0, 0, 0.4)';
                    input.style.border = '1px solid var(--accent-color)';
                });
                input.addEventListener('blur', () => {
                    input.style.background = 'rgba(0, 0, 0, 0.25)';
                    input.style.border = '1px solid transparent';
                });
                return input;
            };

            const kgInput = createInput(lastLog ? lastLog.weight : '-', lastLog ? lastLog.weight : '');
            const repsInput = createInput('-', '');

            const checkBtn = document.createElement('button');
            checkBtn.style.width = '40px';
            checkBtn.style.height = '40px';
            checkBtn.style.borderRadius = '10px';
            checkBtn.style.border = 'none';
            checkBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            checkBtn.style.color = 'var(--text-secondary)';
            checkBtn.style.display = 'flex';
            checkBtn.style.alignItems = 'center';
            checkBtn.style.justifyContent = 'center';
            checkBtn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy
            checkBtn.innerHTML = `<i data-lucide="check" style="width: 20px;"></i>`;

            checkBtn.addEventListener('click', () => {
                const isChecked = checkBtn.style.background === 'var(--system-green)';
                if (!isChecked) {
                    checkBtn.style.transform = 'scale(1.1)';
                    setTimeout(() => checkBtn.style.transform = 'scale(1)', 150);
                    checkBtn.style.background = 'var(--system-green)';
                    checkBtn.style.color = 'white';
                    logData[ex.name].sets[i] = { weight: kgInput.value, reps: repsInput.value };
                    startRestTimer();
                } else {
                    checkBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                    checkBtn.style.color = 'var(--text-secondary)';
                }
            });

            // Delete Set Button (Subtle Trash)
            const deleteSetBtn = document.createElement('button');
            deleteSetBtn.style.background = 'none';
            deleteSetBtn.style.border = 'none';
            deleteSetBtn.style.padding = '6px';
            deleteSetBtn.style.color = 'var(--text-tertiary)';
            deleteSetBtn.style.opacity = '0.4';
            deleteSetBtn.style.transition = 'opacity 0.2s';
            deleteSetBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
            deleteSetBtn.addEventListener('mouseover', () => deleteSetBtn.style.opacity = '1');
            deleteSetBtn.addEventListener('mouseout', () => deleteSetBtn.style.opacity = '0.4');
            deleteSetBtn.addEventListener('click', () => {
                if (confirm('Remover esta série?')) {
                    row.style.opacity = '0';
                    setTimeout(() => {
                        row.remove();
                        if (logData[ex.name] && logData[ex.name].sets[i]) {
                            delete logData[ex.name].sets[i];
                        }
                    }, 200);
                }
            });

            row.appendChild(num);
            row.appendChild(kgInput);
            row.appendChild(repsInput);
            row.appendChild(checkBtn);
            row.appendChild(deleteSetBtn);
            setsContainer.appendChild(row);
            if (window.lucide) window.lucide.createIcons();
        };

        for (let i = 0; i < ex.sets; i++) renderSetRow(i);

        // Add Set Button
        const addSetBtn = document.createElement('button');
        addSetBtn.className = 'btn-secondary';
        addSetBtn.style.width = '100%';
        addSetBtn.style.marginTop = '12px';
        addSetBtn.style.background = 'rgba(255, 255, 255, 0.04)';
        addSetBtn.style.color = 'var(--text-secondary)';
        addSetBtn.style.fontSize = '13px';
        addSetBtn.style.fontWeight = '600';
        addSetBtn.style.padding = '12px';
        addSetBtn.textContent = '+ Adicionar Série';
        addSetBtn.addEventListener('click', () => {
            renderSetRow(ex.sets);
            ex.sets++;
        });
        card.appendChild(addSetBtn);

        return card;
    };

    if (workout.exercises) {
        workout.exercises.forEach((ex, index) => {
            exerciseList.appendChild(renderExerciseCard(ex, index));
        });
    }

    // Add New Exercise Button (Premium Dashed)
    const addExerciseBtn = document.createElement('button');
    addExerciseBtn.style.width = '100%';
    addExerciseBtn.style.padding = '20px';
    addExerciseBtn.style.marginTop = '24px';
    addExerciseBtn.style.background = 'rgba(255, 255, 255, 0.02)';
    addExerciseBtn.style.border = '1px dashed rgba(255, 255, 255, 0.2)';
    addExerciseBtn.style.borderRadius = '16px';
    addExerciseBtn.style.color = 'var(--text-secondary)';
    addExerciseBtn.style.fontSize = '15px';
    addExerciseBtn.style.fontWeight = '600';
    addExerciseBtn.style.display = 'flex';
    addExerciseBtn.style.alignItems = 'center';
    addExerciseBtn.style.justifyContent = 'center';
    addExerciseBtn.style.gap = '10px';
    addExerciseBtn.style.transition = 'all 0.2s';
    addExerciseBtn.innerHTML = `<i data-lucide="plus" style="width: 20px;"></i> Adicionar Exercício`;

    addExerciseBtn.addEventListener('mouseover', () => {
        addExerciseBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        addExerciseBtn.style.borderColor = 'var(--text-primary)';
        addExerciseBtn.style.color = 'var(--text-primary)';
    });
    addExerciseBtn.addEventListener('mouseout', () => {
        addExerciseBtn.style.background = 'rgba(255, 255, 255, 0.02)';
        addExerciseBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        addExerciseBtn.style.color = 'var(--text-secondary)';
    });

    addExerciseBtn.addEventListener('click', () => {
        // Simple Prompt for now (can be upgraded to full modal)
        const newExName = prompt("Nome do Exercício:");
        if (newExName) {
            const newEx = { name: newExName, sets: 3 }; // Default 3 sets
            if (!workout.exercises) workout.exercises = [];
            workout.exercises.push(newEx);

            // Append card
            const newCard = renderExerciseCard(newEx, workout.exercises.length - 1);
            newCard.className = 'card fade-in'; // Add animation class
            exerciseList.appendChild(newCard);

            // Scroll to it
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (window.lucide) window.lucide.createIcons();
        }
    });

    container.appendChild(addExerciseBtn);

    // Bottom Finish Button
    const finishBtnBottom = document.createElement('button');
    finishBtnBottom.className = 'btn-primary';
    finishBtnBottom.style.width = '100%';
    finishBtnBottom.style.marginTop = '40px';
    finishBtnBottom.style.padding = '18px';
    finishBtnBottom.style.fontSize = '17px';
    finishBtnBottom.style.fontWeight = '700';
    finishBtnBottom.style.borderRadius = '16px';
    finishBtnBottom.style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.3)';
    finishBtnBottom.textContent = 'Finalizar Treino';
    container.appendChild(finishBtnBottom);

    // Summary Modal Logic
    const showSummary = async (log) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.backdropFilter = 'blur(20px)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.className = 'fade-in';

        let totalLoad = 0;
        Object.values(log.data).forEach(d => {
            if (d.sets) d.sets.forEach(s => totalLoad += (s.weight * s.reps) || 0);
        });

        // Initial Content (Loading AI)
        overlay.innerHTML = `
            <div class="card" style="width: 85%; max-width: 340px; text-align: center; background: #1c1c1e; border: 1px solid rgba(255,255,255,0.1); padding: 40px 32px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="width: 72px; height: 72px; background: rgba(255, 204, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                    <i data-lucide="trophy" style="width: 36px; height: 36px; color: var(--system-yellow);"></i>
                </div>
                <h2 class="text-title-2" style="color: white; margin-bottom: 8px; font-size: 24px;">Treino Concluído!</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 32px 0;">
                    <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 16px;">
                        <div class="text-headline" style="color: white; font-size: 20px;">${(totalLoad / 1000).toFixed(1)}t</div>
                        <div class="text-caption-2 text-secondary">Volume</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 16px;">
                        <div class="text-headline" style="color: white; font-size: 20px;">${log.duration}</div>
                        <div class="text-caption-2 text-secondary">Duração</div>
                    </div>
                </div>

                <div id="ai-analysis-area" style="margin-bottom: 32px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--system-blue);">
                        <i data-lucide="loader-2" class="spin"></i>
                        <span class="text-caption-1" style="font-size: 14px;">Coach IA analisando seu treino...</span>
                    </div>
                </div>

                <button id="close-summary" class="btn-primary" style="width: 100%; padding: 16px; border-radius: 14px; font-size: 16px;">Continuar</button>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // Call AI Analysis
        const analysisJson = await analyzeWorkout(log, profile);
        const analysisArea = overlay.querySelector('#ai-analysis-area');
        let tips = [];

        if (analysisJson) {
            try {
                const analysis = JSON.parse(analysisJson);
                tips = analysis.tips || [];

                let tipsHtml = tips.map(t => `
                    <div style="text-align: left; background: rgba(0, 122, 255, 0.1); padding: 14px; border-radius: 12px; margin-bottom: 10px;">
                        <div class="text-caption-2" style="color: var(--system-blue); font-weight: 700; margin-bottom: 4px;">${t.exercise}</div>
                        <div class="text-body" style="color: white; font-size: 14px; line-height: 1.4;">${t.suggestion}</div>
                    </div>
                `).join('');

                analysisArea.innerHTML = `
                    <div style="text-align: left; margin-bottom: 16px;">
                        <div class="text-subhead" style="color: white; margin-bottom: 12px; font-size: 16px;">Sugestões para o Próximo:</div>
                        ${tipsHtml}
                    </div>
                    <button id="save-tips-btn" class="btn-secondary" style="width: 100%; margin-bottom: 16px; background: var(--system-blue); color: white; border: none; padding: 14px; border-radius: 12px;">
                        <i data-lucide="save" style="width: 18px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i> Salvar Ajustes
                    </button>
                `;
                if (window.lucide) window.lucide.createIcons();

                // Save Tips Handler
                const saveBtn = overlay.querySelector('#save-tips-btn');
                saveBtn.addEventListener('click', async () => {
                    saveBtn.innerHTML = `<i data-lucide="check"></i> Salvo!`;
                    saveBtn.style.background = 'var(--system-green)';
                    saveBtn.disabled = true;
                    // Update workout with tips
                    workout.nextSessionTips = tips;
                    await put('workouts', workout);
                });

            } catch (e) {
                console.error('Error parsing AI analysis', e);
                analysisArea.innerHTML = `<div class="text-caption-1 text-secondary">Não foi possível gerar análise.</div>`;
            }
        } else {
            analysisArea.innerHTML = `<div class="text-caption-1 text-secondary">Sem conexão com IA.</div>`;
        }

        overlay.querySelector('#close-summary').addEventListener('click', () => {
            document.body.removeChild(overlay);
            navigate('/');
        });
    };

    const finishAction = async () => {
        clearInterval(timerInterval);
        const duration = formatTime(Math.floor((Date.now() - startTime) / 1000));
        const log = {
            id: generateId(),
            workoutId: workout.id,
            workoutName: workout.name,
            date: new Date().toISOString(),
            duration: duration,
            gymId: selectedGymId,
            data: logData
        };
        await add('logs', log);
        showSummary(log);
    };

    finishBtnTop.addEventListener('click', finishAction);
    finishBtnBottom.addEventListener('click', finishAction);

    timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('main-timer').textContent = formatTime(diff);
    }, 1000);

    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
};
