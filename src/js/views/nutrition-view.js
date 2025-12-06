
import { getAll, add, getById, remove } from '/src/js/core/db.js';
import { calculateMacros, parseMealWithAI } from '/src/js/services/nutrition.js';
import { generateId } from '/src/js/core/utils.js';
import { showSubscriptionModal } from '/src/js/views/subscription-view.js';
import { isPro } from '/src/js/services/monetization.js';

export const NutritionView = async () => {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    // 1. Fetch Data
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const targets = calculateMacros(profile);

    const date = new Date().toISOString().split('T')[0];
    const allLogs = await getAll('nutrition_logs');
    const todayLogs = allLogs.filter(log => log.date.startsWith(date));

    // Calculate Consumed
    const consumed = todayLogs.reduce((acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.macros?.protein || 0;
        acc.carbs += log.macros?.carbs || 0;
        acc.fat += log.macros?.fat || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Dashboard Card
    const card = document.createElement('div');
    card.className = 'card';

    const createRing = (label, current, target, color) => {
        const pct = Math.min(100, Math.round((current / target) * 100));
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="position: relative; width: 60px; height: 60px;">
                    <svg width="60" height="60" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#444" stroke-width="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${pct}, 100" />
                    </svg>
                    <div class="text-caption-1" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-primary);">${pct}%</div>
                </div>
                <div class="text-caption-2 text-secondary" style="font-size: 10px;">${label}</div>
            </div>
        `;
    };

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
                <div class="text-caption-1 text-secondary">CALORIAS</div>
                <div class="text-large-title">${Math.round(consumed.calories)} <span style="font-size: 16px; color: var(--text-secondary);">/ ${targets.calories}</span></div>
            </div>
             <div style="text-align: right;">
                <div class="text-caption-1 text-secondary">SALDO</div>
                <div class="text-headline" style="color: ${consumed.calories > targets.calories ? 'var(--system-red)' : 'var(--system-green)'};">
                    ${targets.calories - Math.round(consumed.calories)}
                </div>
            </div>
        </div>

        <div style="display: flex; justify-content: space-around;">
            ${createRing('PROT', consumed.protein, targets.protein, 'var(--system-blue)')}
            ${createRing('CARB', consumed.carbs, targets.carbs, 'var(--system-green)')}
            ${createRing('GORD', consumed.fat, targets.fat, 'var(--system-orange)')}
        </div>
    `;
    container.appendChild(card);

    // 1.5 Water Tracker (Minimalist)
    // ----------------------------------------------------------------
    const waterGoal = 3000; // ml
    const dateKey = `water_${date}`;
    let currentWater = parseInt(localStorage.getItem(dateKey) || '0');

    const waterCard = document.createElement('div');
    waterCard.className = 'card';
    waterCard.style.padding = '16px';
    waterCard.style.display = 'flex';
    waterCard.style.alignItems = 'center';
    waterCard.style.justifyContent = 'space-between';
    waterCard.style.marginBottom = '24px';
    waterCard.style.background = 'linear-gradient(135deg, rgba(50,173,230,0.1) 0%, rgba(50,173,230,0.05) 100%)';
    waterCard.style.border = '1px solid rgba(50,173,230,0.2)';

    const updateWaterUI = () => {
        localStorage.setItem(dateKey, currentWater);

        waterCard.innerHTML = `
            <div style="display: flex; alignItems: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--system-blue); display: flex; align-items: center; justify-content: center; color: white;">
                    <i data-lucide="droplet" style="width: 20px;"></i>
                </div>
                <div>
                     <div class="text-caption-1" style="color: var(--system-blue);">HIDRATAÇÃO</div>
                     <div class="text-body font-semibold">${currentWater}ml <span class="text-secondary" style="font-weight: 400;">/ ${waterGoal}ml</span></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="btn-icon add-water" data-amount="250" style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border: 1px solid var(--system-blue); color: var(--system-blue);">
                    <span style="font-size: 10px; font-weight: 700;">+250</span>
                </button>
                 <button class="btn-icon add-water" data-amount="500" style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border: 1px solid var(--system-blue); color: var(--system-blue);">
                    <span style="font-size: 10px; font-weight: 700;">+500</span>
                </button>
            </div>
        `;
        // Re-bind
        waterCard.querySelectorAll('.add-water').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.currentTarget.dataset.amount);
                currentWater += amount;
                updateWaterUI();
            });
        });
        if (window.lucide) window.lucide.createIcons();
    };

    updateWaterUI(); // Initial render
    container.appendChild(waterCard);

    // 2. Meal Logger Input (Meal Builder)
    const loggerCard = document.createElement('div');
    loggerCard.className = 'card';
    loggerCard.style.marginBottom = '24px';

    // Internal State for Builder
    let builderItems = [];

    const renderBuilder = () => {
        const list = document.getElementById('builder-list');
        const totalDiv = document.getElementById('builder-total');
        if (!list || !totalDiv) return;

        list.innerHTML = '';
        let totalCals = 0;

        builderItems.forEach((item, index) => {
            totalCals += item.calories;
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.padding = '8px 0';
            row.style.borderBottom = '1px solid var(--separator)';
            row.innerHTML = `
                <div class="text-caption-1">${item.name} <span class="text-secondary">(${item.weight}g)</span></div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div class="text-caption-1">${item.calories} kcal</div>
                    <i data-index="${index}" class="remove-item" data-lucide="x-circle" style="width: 14px; color: var(--system-red); cursor: pointer;"></i>
                </div>
            `;
            list.appendChild(row);
        });

        totalDiv.textContent = `${totalCals} kcal`;

        // Re-attach listeners
        list.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                builderItems.splice(idx, 1);
                renderBuilder();
            });
        });

        if (window.lucide) window.lucide.createIcons();
    };

    loggerCard.innerHTML = `
        <h3 class="text-headline" style="margin-bottom: 12px;">Registrar Refeição</h3>
        
        <!-- Builder Inputs -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--separator);">
            
            <!-- AI Input -->
            <div style="background: rgba(var(--app-accent-color), 0.1); padding: 12px; border-radius: 12px; border: 1px solid var(--system-blue);">
                <label class="text-caption-1" style="color: var(--system-blue); display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
                    <i data-lucide="sparkles" style="width: 14px;"></i> IA MÁGICA (Texto ou Foto)
                </label>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="ai-input" class="input-field" placeholder="Ex: 2 ovos e 1 pão..." style="width: 100%;">
                    
                    <!-- Smart Action Button (Camera by default, Send when typing) -->
                    <input type="file" id="ai-camera-input" accept="image/*" capture="environment" style="display: none;">
                    <button id="ai-action-btn" class="btn btn-secondary" style="width: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; padding: 0;">
                        <i data-lucide="camera" style="width: 22px;"></i>
                    </button>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                <div style="flex: 1; height: 1px; background: var(--separator);"></div>
                <span class="text-caption-2 text-secondary">OU MANUAL</span>
                <div style="flex: 1; height: 1px; background: var(--separator);"></div>
            </div>

            <div>
                <label class="text-caption-1 text-secondary">NOME DO ITEM</label>
                <input type="text" id="item-name" class="input-field" placeholder="Ex: Arroz" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 4px;">
                 <label class="text-caption-1 text-secondary">PESO (g)</label>
                 <input type="number" id="item-weight" class="input-field" placeholder="0" style="width: 100%;">
            </div>

            <button id="add-item-btn" class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i data-lucide="plus-circle" style="width: 18px;"></i> 
                <span>Adicionar à Lista</span>
            </button>
        </div>

        <!-- Builder List -->
        <div style="margin-bottom: 16px;">
            <div class="text-caption-2 text-secondary" style="margin-bottom: 4px;">ITENS DA REFEIÇÃO</div>
            <div id="builder-list" style="min-height: 20px;">
                <div class="text-caption-1 text-secondary" style="font-style: italic;">Nenhum item adicionado.</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-weight: 700;">
                <span class="text-body">TOTAL</span>
                <span id="builder-total" class="text-body">0 kcal</span>
            </div>
        </div>

        <!-- Meal Info -->
         <div>
            <label class="text-caption-1 text-secondary">NOME DA REFEIÇÃO</label>
            <input type="text" id="meal-title" class="input-field" placeholder="Ex: Almoço" style="width: 100%; margin-bottom: 12px;">
        </div>

        <button id="save-meal-btn" class="btn btn-primary" style="width: 100%;">
            <i data-lucide="check" style="width: 18px; margin-right: 8px;"></i> Salvar Refeição
        </button>
    `;
    container.appendChild(loggerCard);

    // 3. History
    const historyHeader = document.createElement('div');
    historyHeader.className = 'section-header';
    historyHeader.innerHTML = `<h2 class="text-title-3">Hoje</h2>`;
    container.appendChild(historyHeader);

    const historyList = document.createElement('div');
    historyList.style.display = 'flex';
    historyList.style.flexDirection = 'column';
    historyList.style.gap = '12px';

    if (todayLogs.length === 0) {
        historyList.innerHTML = `<div class="text-center text-secondary" style="padding: 20px;">Nenhuma refeição hoje.</div>`;
    } else {
        todayLogs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'card';
            item.style.padding = '12px 16px';
            item.style.marginBottom = '0';

            // Format Items List if present
            let itemsHtml = '';
            if (log.items && log.items.length > 0) {
                itemsHtml = `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    ${log.items.map(i => `<div class="text-caption-2 text-secondary">• ${i.name} (${i.weight}g) - ${i.calories}kcal</div>`).join('')}
                </div>`;
            }

            item.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                             <div class="text-body font-semibold">${log.meal}</div>
                             <div class="text-caption-1 text-secondary">
                                ${log.calories} kcal • P: ${log.macros?.protein || 0}g C: ${log.macros?.carbs || 0}g G: ${log.macros?.fat || 0}g
                             </div>
                        </div>
                         <button class="delete-meal btn-icon" data-id="${log.id}" style="color: var(--system-red);">
                            <i data-lucide="trash-2" style="width: 16px;"></i>
                        </button>
                    </div>
                   ${itemsHtml}
                </div>
            `;
            historyList.appendChild(item);
        });
    }
    container.appendChild(historyList);

    // Event Listeners
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();

        // ------------------
        // AI Logic
        // ------------------
        const aiInput = document.getElementById('ai-input');
        const actionBtn = document.getElementById('ai-action-btn');
        const cameraInput = document.getElementById('ai-camera-input');

        const handleAIResult = (result) => {
            if (result && result.items) {
                result.items.forEach(i => {
                    builderItems.push({
                        name: i.name,
                        weight: i.weight || 0,
                        calories: i.calories || 0,
                        macros: { protein: 0, carbs: 0, fat: 0 }
                    });
                });
                aiInput.value = '';
                // Reset to camera
                actionBtn.innerHTML = '<i data-lucide="camera" style="width: 22px;"></i>';
                actionBtn.className = 'btn btn-secondary';
                if (window.lucide) window.lucide.createIcons();

                renderBuilder();
            } else {
                alert('Não consegui identificar... Tente descrever melhor.');
            }
        };

        // 1. Toggle Icon on Input
        aiInput?.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            if (hasText) {
                actionBtn.innerHTML = '<i data-lucide="send-horizontal" style="width: 22px;"></i>';
                actionBtn.className = 'btn btn-primary'; // Highlight when valid
            } else {
                actionBtn.innerHTML = '<i data-lucide="camera" style="width: 22px;"></i>';
                actionBtn.className = 'btn btn-secondary';
            }
            if (window.lucide) window.lucide.createIcons();
        });

        // 2. Action Button Click
        actionBtn?.addEventListener('click', async () => {
            // -----------------------
            // MONETIZATION CHECK
            // -----------------------
            const userIsPro = await isPro();
            if (!userIsPro) {
                showSubscriptionModal();
                return;
            }

            const text = aiInput.value.trim();

            if (text.length > 0) {
                // SEND MODE
                actionBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px;"></div>';
                const result = await parseMealWithAI(text, false);
                handleAIResult(result);
                actionBtn.innerHTML = '<i data-lucide="send-horizontal" style="width: 22px;"></i>';
                if (window.lucide) window.lucide.createIcons();
            } else {
                // CAMERA MODE
                cameraInput.click();
            }
        });

        // 3. File Selected
        cameraInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Double check (redundant but safe)
            const userIsPro = await isPro();
            if (!userIsPro) return;

            // Show loading
            const originalIcon = actionBtn.innerHTML;
            actionBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-color: var(--accent-color) transparent transparent transparent;"></div>';

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                const result = await parseMealWithAI(base64, true);

                actionBtn.innerHTML = originalIcon;
                if (window.lucide) window.lucide.createIcons();
                handleAIResult(result);
            };
            reader.readAsDataURL(file);
        });

        // ------------------
        // Builder Logic
        // ------------------
        const addItemBtn = document.getElementById('add-item-btn');
        const itemName = document.getElementById('item-name');
        const itemWeight = document.getElementById('item-weight');

        addItemBtn?.addEventListener('click', () => {
            const name = itemName.value;
            if (!name) return;

            const weight = parseFloat(itemWeight.value) || 0;
            let cals = 0;

            // Auto-calculate (Mock Logic - Expanded)
            const n = name.toLowerCase();
            if (n.includes('arroz')) cals = Math.round(weight * 1.3);
            else if (n.includes('frango') || n.includes('peito')) cals = Math.round(weight * 1.65);
            else if (n.includes('ovo')) cals = Math.round((weight / 50) * 70);
            else if (n.includes('carne') || n.includes('patinho')) cals = Math.round(weight * 2.5);
            else if (n.includes('batata')) cals = Math.round(weight * 0.86);
            else if (n.includes('aveia')) cals = Math.round(weight * 3.8);
            else cals = Math.round(weight * 2);

            builderItems.push({
                name,
                weight,
                calories: cals,
                macros: { protein: 0, carbs: 0, fat: 0 }
            });

            // Clear inputs
            itemName.value = '';
            itemWeight.value = '';
            itemName.focus();

            renderBuilder();
        });

        // ------------------
        // Save Logic
        // ------------------
        const saveBtn = document.getElementById('save-meal-btn');
        saveBtn?.addEventListener('click', async () => {
            if (builderItems.length === 0) return alert('Adicione itens primeiro!');

            const titleInput = document.getElementById('meal-title');
            const title = titleInput.value || 'Refeição';

            // Sum everything
            const totalCals = builderItems.reduce((acc, i) => acc + i.calories, 0);
            const totalP = Math.round(totalCals * 0.3 / 4);
            const totalC = Math.round(totalCals * 0.4 / 4);
            const totalF = Math.round(totalCals * 0.3 / 9);

            const mealLog = {
                id: generateId(),
                date: new Date().toISOString(),
                meal: title,
                calories: totalCals,
                macros: { protein: totalP, carbs: totalC, fat: totalF },
                items: builderItems
            };

            await add('nutrition_logs', mealLog);

            // Refresh
            const app = document.getElementById('app');
            app.innerHTML = '';
            app.appendChild(await NutritionView());
        });

        // ------------------
        // Delete Logic
        // ------------------
        document.querySelectorAll('.delete-meal').forEach(b => {
            b.addEventListener('click', async (e) => {
                if (confirm('Apagar refeição?')) {
                    await remove('nutrition_logs', e.currentTarget.dataset.id);
                    const app = document.getElementById('app');
                    app.innerHTML = '';
                    app.appendChild(await NutritionView());
                }
            });
        });

    }, 0);

    return container;
};
