import { getAll } from '../core/db.js';
import { navigate } from '../core/router.js';

export const LibraryView = async () => {
    const container = document.createElement('div');
    container.className = 'container fade-in';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="text-large-title">Meus Treinos</h1>
        <button id="add-workout-btn" class="btn-icon" style="color: var(--accent-color); background: var(--bg-card); box-shadow: var(--shadow-sm);">
            <i data-lucide="plus"></i>
        </button>
    `;
    container.appendChild(header);

    // Add listener for new workout
    header.querySelector('#add-workout-btn').addEventListener('click', () => {
        navigate('/workout/new');
    });

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr';
    grid.style.gap = 'var(--spacing-md)';

    try {
        const workouts = await getAll('workouts');

        const gymWorkouts = workouts.filter(w => w.type === 'gym');
        const bjjWorkouts = workouts.filter(w => w.type === 'bjj');

        const createSection = (title, items, icon) => {
            if (items.length === 0) return;

            const sectionTitle = document.createElement('div');
            sectionTitle.style.display = 'flex';
            sectionTitle.style.alignItems = 'center';
            sectionTitle.style.gap = '8px';
            sectionTitle.style.marginTop = 'var(--spacing-lg)';
            sectionTitle.style.marginBottom = 'var(--spacing-sm)';
            sectionTitle.innerHTML = `
                <i data-lucide="${icon}" style="width: 20px; height: 20px; color: var(--text-secondary);"></i>
                <h2 class="text-title-3">${title}</h2>
            `;
            grid.appendChild(sectionTitle);

            items.forEach(workout => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '0';
                card.style.display = 'flex';
                card.style.justifyContent = 'space-between';
                card.style.alignItems = 'center';
                card.style.cursor = 'pointer';

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                        <div style="width: 40px; height: 40px; background: var(--system-gray6); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent-color);">
                            <i data-lucide="${workout.type === 'gym' ? 'dumbbell' : 'swords'}" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <h3 class="text-headline">${workout.name}</h3>
                            <p class="text-subhead text-secondary">${workout.exercises ? workout.exercises.length + ' Exercícios' : 'Jiu-Jitsu'}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn-icon edit-btn" style="width: 32px; height: 32px; color: var(--text-secondary); z-index: 10;">
                            <i data-lucide="edit-2" style="width: 18px; height: 18px;"></i>
                        </button>
                        <div style="color: var(--text-tertiary);">
                            <i data-lucide="chevron-right"></i>
                        </div>
                    </div>
                `;

                // Prevent bubbling for edit button
                const editBtn = card.querySelector('.edit-btn');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigate(`/workout/edit/${workout.id}`);
                });

                card.addEventListener('click', () => {
                    navigate(`/workout/${workout.id}`);
                });
                grid.appendChild(card);
            });
        };

        createSection('Musculação', gymWorkouts, 'dumbbell');
        createSection('Jiu-Jitsu', bjjWorkouts, 'swords');

    } catch (e) {
        console.error('Error loading workouts', e);
    }

    container.appendChild(grid);

    // Initialize Icons
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
};
