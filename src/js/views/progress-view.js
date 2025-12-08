import { getAll, add, remove } from '/src/js/core/db.js';
import { formatDate, generateId } from '/src/js/core/utils.js';
import { gateFeature, FEATURE } from '/src/js/services/monetization.js';
import { showSubscriptionModal } from '/src/js/views/subscription-view.js';
import { MuscleHeatmap } from '/src/js/components/muscle-heatmap.js';
import { calculateMuscleVolume, getBest1RM } from '/src/js/services/analytics.js';

export const ProgressView = async () => {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    container.style.paddingBottom = '100px';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `<h1 class="text-large-title">Evolução</h1>`;
    container.appendChild(header);

    // Fetch Common Data
    let logs = [];
    try {
        logs = await getAll('logs');
    } catch (e) {
        console.log('Error fetching logs');
    }

    // 0. Muscle Heatmap (NEW)
    const volumeData = calculateMuscleVolume(logs);
    container.appendChild(MuscleHeatmap(volumeData));

    // 0.5 1RM Stats (NEW)
    const statsContainer = document.createElement('div');
    statsContainer.style.display = 'grid';
    statsContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
    statsContainer.style.gap = '8px';
    statsContainer.style.marginTop = '16px';
    statsContainer.style.marginBottom = '24px';

    const big3 = [
        { id: 'bench_press', label: 'Supino', icon: 'activity' },
        { id: 'squat', label: 'Agach.', icon: 'move' },
        { id: 'deadlift', label: 'Terra', icon: 'anchor' }
    ];

    big3.forEach(lift => {
        const pr = getBest1RM(logs, lift.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '12px';
        card.style.textAlign = 'center';
        card.innerHTML = `
            <div class="text-caption-2 text-secondary" style="margin-bottom: 4px;">${lift.label}</div>
            <div class="text-headline" style="color: var(--accent-color);">${pr > 0 ? pr : '-'} <span style="font-size: 12px; color: var(--text-secondary);">kg</span></div>
        `;
        statsContainer.appendChild(card);
    });
    container.appendChild(statsContainer);

    // 1. Weight Chart Section
    const weightHeader = document.createElement('div');
    weightHeader.className = 'section-header';
    weightHeader.style.display = 'flex';
    weightHeader.style.justifyContent = 'space-between';
    weightHeader.style.alignItems = 'center';
    weightHeader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <h2 class="text-title-3">Peso Corporal</h2>
            <i data-lucide="scale" style="color: var(--system-blue);"></i>
        </div>
        <button id="add-weight-btn" class="btn-icon" style="background: var(--accent-color); color: white; width: 32px; height: 32px; border-radius: 10px;">
            <i data-lucide="plus"></i>
        </button>
    `;
    container.appendChild(weightHeader);

    // Quick Weight Input (Initially Hidden)
    const quickWeightInput = document.createElement('div');
    quickWeightInput.style.display = 'none';
    quickWeightInput.style.marginBottom = '16px';
    quickWeightInput.style.padding = '16px';
    quickWeightInput.style.background = 'var(--bg-card)';
    quickWeightInput.style.borderRadius = '12px';
    quickWeightInput.style.gap = '12px';
    quickWeightInput.style.alignItems = 'center';
    quickWeightInput.innerHTML = `
        <input type="number" id="quick-weight-value" class="input-field" placeholder="Ex: 75.5" style="flex: 1; text-align: center; font-size: 20px; font-weight: 600;">
        <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button id="cancel-weight-btn" class="btn btn-secondary" style="flex: 1;">Cancelar</button>
            <button id="save-weight-btn" class="btn btn-primary" style="flex: 1;">Salvar</button>
        </div>
    `;
    container.appendChild(quickWeightInput);

    const weightCard = document.createElement('div');
    weightCard.className = 'card';
    weightCard.style.padding = '0';
    weightCard.style.overflow = 'hidden';

    // Fetch Weight History
    let weightHistory = [];
    try {
        weightHistory = await getAll('weight_history');
        weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (e) {
        console.log('No weight history yet');
    }

    if (weightHistory.length > 1) {
        // Render SVG Chart
        const weights = weightHistory.map(w => w.weight);
        const minWeight = Math.min(...weights) - 2;
        const maxWeight = Math.max(...weights) + 2;
        const range = maxWeight - minWeight;

        const width = 600; // Internal SVG width
        const height = 200;
        const padding = 20;

        const points = weightHistory.map((entry, index) => {
            const x = (index / (weightHistory.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((entry.weight - minWeight) / range) * (height - 2 * padding) - padding;
            return `${x},${y}`;
        }).join(' ');

        weightCard.innerHTML = `
            <div style="padding: 16px;">
                <div class="text-caption-1 text-secondary">ÚLTIMO PESO</div>
                <div class="text-large-title">${weights[weights.length - 1]} kg</div>
            </div>
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
                <!-- Gradient Definition -->
                <defs>
                    <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="var(--system-blue)" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="var(--system-blue)" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <!-- Area -->
                <path d="M${points.split(' ')[0].split(',')[0]},${height} ${points} L${points.split(' ').pop().split(',')[0]},${height} Z" fill="url(#lineGradient)" />
                <!-- Line -->
                <polyline points="${points}" fill="none" stroke="var(--system-blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Dots -->
                ${weightHistory.map((entry, index) => {
            const x = (index / (weightHistory.length - 1)) * (width - 2 * padding) + padding;
            const y = height - ((entry.weight - minWeight) / range) * (height - 2 * padding) - padding;
            return `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="var(--system-blue)" stroke-width="2" />`;
        }).join('')}
            </svg>
        `;
    } else {
        weightCard.style.padding = '24px';
        weightCard.innerHTML = `
            <div class="text-center">
                <p class="text-body text-secondary">Registre seu peso na aba Nutrição para ver o gráfico.</p>
            </div>
        `;
    }
    container.appendChild(weightCard);

    // 2. Progress Photos Section
    const photosHeader = document.createElement('div');
    photosHeader.className = 'section-header';
    photosHeader.innerHTML = `
        <h2 class="text-title-3">Galeria do Shape</h2>
        <button id="add-photo-btn" class="btn-icon" style="background: var(--accent-color); color: white; width: 32px; height: 32px;">
            <i data-lucide="plus"></i>
        </button>
        <input type="file" id="photo-input" accept="image/*" style="display: none;">
    `;
    container.appendChild(photosHeader);

    // Photo Grid (Horizontal Scroll)
    const photoGrid = document.createElement('div');
    photoGrid.style.display = 'flex';
    photoGrid.style.gap = '12px';
    photoGrid.style.overflowX = 'auto';
    photoGrid.style.paddingBottom = '12px';
    photoGrid.style.scrollSnapType = 'x mandatory';

    let photos = [];
    try {
        photos = await getAll('photos');
        photos.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
    } catch (e) {
        console.log('No photos yet');
    }

    if (photos.length > 0) {
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.style.flex = '0 0 120px';
            item.style.height = '160px';
            item.style.borderRadius = '12px';
            item.style.overflow = 'hidden';
            item.style.position = 'relative';
            item.style.scrollSnapAlign = 'start';
            item.style.backgroundImage = `url(${photo.image})`;
            item.style.backgroundSize = 'cover';
            item.style.backgroundPosition = 'center';

            item.innerHTML = `
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); padding: 4px 8px;">
                    <span class="text-caption-2" style="color: white;">${new Date(photo.date).toLocaleDateString()}</span>
                </div>
                <button class="analyze-photo" data-id="${photo.id}" style="position: absolute; top: 4px; left: 4px; background: rgba(10, 132, 255, 0.9); border-radius: 12px; padding: 4px 8px; color: white; display: flex; align-items: center; gap: 4px; border: none;">
                    <i data-lucide="sparkles" style="width: 12px;"></i>
                    <span style="font-size: 10px; font-weight: 600;">IA</span>
                </button>
                <button class="delete-photo" data-id="${photo.id}" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; width: 24px; height: 24px; color: white; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="x" style="width: 14px;"></i>
                </button>
            `;
            photoGrid.appendChild(item);
        });
    } else {
        photoGrid.innerHTML = `
            <div class="card" style="flex: 1; text-align: center; padding: 24px;">
                <i data-lucide="camera" style="color: var(--text-secondary); margin-bottom: 8px;"></i>
                <p class="text-caption-1 text-secondary">Adicione sua primeira foto!</p>
            </div>
        `;
    }
    container.appendChild(photoGrid);

    // Analysis Result Modal
    const modal = document.createElement('div');
    modal.id = 'analysis-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '1000';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '24px';
    modal.innerHTML = `
        <div class="card" style="max-width: 400px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 class="text-headline">Análise do Shape</h3>
                <button id="close-modal" class="btn-icon"><i data-lucide="x"></i></button>
            </div>
            <div id="analysis-content">
                <div style="text-align: center; padding: 24px;">
                    <div class="spinner" style="width: 32px; height: 32px; border: 3px solid var(--accent-color); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                    <p class="text-body">A IA está analisando seu físico...</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 3. Workout History (Existing)
    const historyHeader = document.createElement('div');
    historyHeader.className = 'section-header';
    historyHeader.innerHTML = `
        <h2 class="text-title-3">Histórico de Treinos</h2>
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
                <div class="text-callout font-monospaced text-secondary">${log.duration || '-'}</div>
            `;
            list.appendChild(item);
        });
    }
    container.appendChild(list);

    // Events
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();

        // Quick Weight Input Logic
        const addWeightBtn = document.getElementById('add-weight-btn');
        const cancelWeightBtn = document.getElementById('cancel-weight-btn');
        const saveWeightBtn = document.getElementById('save-weight-btn');
        const weightInput = document.getElementById('quick-weight-value');

        addWeightBtn?.addEventListener('click', () => {
            quickWeightInput.style.display = 'block';
            weightInput?.focus();
        });

        cancelWeightBtn?.addEventListener('click', () => {
            quickWeightInput.style.display = 'none';
            if (weightInput) weightInput.value = '';
        });

        saveWeightBtn?.addEventListener('click', async () => {
            const value = parseFloat(weightInput?.value);
            if (!value || value < 20 || value > 300) {
                alert('Digite um peso válido (entre 20 e 300 kg)');
                return;
            }

            try {
                await add('weight_history', {
                    id: generateId(),
                    date: new Date().toISOString(),
                    weight: value
                });
                // Reload view
                const app = document.getElementById('app');
                app.innerHTML = '';
                app.appendChild(await ProgressView());
            } catch (err) {
                alert('Erro ao salvar peso.');
            }
        });

        // Photo Upload Logic
        const addBtn = document.getElementById('add-photo-btn');
        const input = document.getElementById('photo-input');

        if (addBtn && input) {
            addBtn.addEventListener('click', () => input.click());

            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64 = event.target.result;
                    try {
                        await add('photos', {
                            id: generateId(),
                            date: new Date().toISOString(),
                            image: base64
                        });
                        // Reload view
                        const app = document.getElementById('app');
                        app.innerHTML = '';
                        app.appendChild(await ProgressView());
                    } catch (err) {
                        alert('Erro ao salvar foto. Talvez seja muito grande.');
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // Delete Photo Logic
        document.querySelectorAll('.delete-photo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Apagar foto?')) {
                    await remove('photos', id);
                    const app = document.getElementById('app');
                    app.innerHTML = '';
                    app.appendChild(await ProgressView());
                }
            });
        });

        // Analyze Photo Logic
        document.querySelectorAll('.analyze-photo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Feature Flag Check
                const allowed = await gateFeature(FEATURE.AI_ANALYSIS);
                if (!allowed) {
                    showSubscriptionModal();
                    return;
                }

                const id = e.currentTarget.dataset.id;
                const photo = photos.find(p => p.id === id);
                if (!photo) return;

                const modal = document.getElementById('analysis-modal');
                const content = document.getElementById('analysis-content');
                modal.style.display = 'flex';
                content.innerHTML = `
                    <div style="text-align: center; padding: 24px;">
                        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid var(--accent-color); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                        <p class="text-body">A IA está analisando seu físico...</p>
                    </div>
                `;

                try {
                    const aiModule = await import('/src/js/services/ai.js');
                    const result = await aiModule.analyzeShape(photo.image);

                    if (result) {
                        content.innerHTML = `
                            <div style="margin-bottom: 16px;">
                                <div class="text-caption-1 text-secondary">GORDURA CORPORAL</div>
                                <div class="text-title-2" style="color: var(--system-blue);">${result.bodyFat}</div>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <div class="text-caption-1 text-secondary">PONTOS FORTES</div>
                                <p class="text-body">${result.strengths}</p>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <div class="text-caption-1 text-secondary">A MELHORAR</div>
                                <p class="text-body">${result.weaknesses}</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                                <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                                    <i data-lucide="lightbulb" style="color: var(--system-orange); width: 16px;"></i>
                                    <span class="text-caption-1 font-bold" style="color: var(--system-orange);">DICA DO COACH</span>
                                </div>
                                <p class="text-caption-1">${result.tip}</p>
                            </div>
                        `;
                    } else {
                        content.innerHTML = `<p class="text-body text-center" style="color: var(--system-red);">Erro na análise. Tente novamente.</p>`;
                    }
                } catch (err) {
                    content.innerHTML = `<p class="text-body text-center" style="color: var(--system-red);">Erro ao conectar.</p>`;
                }
                if (window.lucide) window.lucide.createIcons();
            });
        });

        document.getElementById('close-modal')?.addEventListener('click', () => {
            document.getElementById('analysis-modal').style.display = 'none';
        });

    }, 0);

    return container;
};
