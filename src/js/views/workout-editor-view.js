import { getById, put, add, remove } from '../core/db.js';
import { navigate } from '../core/router.js';
import { generateId } from '../core/utils.js';

export const WorkoutEditorView = async (params) => {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    container.style.paddingBottom = '100px';

    const isEditing = params && params.id;
    let workout = {
        id: generateId(),
        name: '',
        type: 'gym',
        exercises: []
    };

    if (isEditing) {
        try {
            workout = await getById('workouts', params.id);
        } catch (e) {
            console.error('Error loading workout', e);
        }
    }

    // Header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="text-large-title">${isEditing ? 'Editar Treino' : 'Novo Treino'}</h1>
        ${isEditing ? `
            <button id="delete-btn" class="btn-icon" style="color: var(--system-red); background: var(--bg-card);">
                <i data-lucide="trash-2"></i>
            </button>
        ` : ''}
    `;
    container.appendChild(header);

    // Form
    const form = document.createElement('div');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--spacing-md)';

    // Name Input
    const nameGroup = document.createElement('div');
    nameGroup.innerHTML = `
        <label class="text-caption-1 text-secondary" style="margin-left: 4px; margin-bottom: 4px; display: block;">NOME DO TREINO</label>
        <input type="text" id="workout-name" class="input-field" value="${workout.name}" placeholder="Ex: Treino A - Peito">
    `;
    form.appendChild(nameGroup);

    // Type Selector (Only for new workouts to simplify logic for now)
    if (!isEditing) {
        const typeGroup = document.createElement('div');
        typeGroup.innerHTML = `
            <label class="text-caption-1 text-secondary" style="margin-left: 4px; margin-bottom: 4px; display: block;">TIPO</label>
            <select id="workout-type" class="input-field">
                <option value="gym" ${workout.type === 'gym' ? 'selected' : ''}>Musculação</option>
                <option value="bjj" ${workout.type === 'bjj' ? 'selected' : ''}>Jiu-Jitsu</option>
            </select>
        `;
        form.appendChild(typeGroup);
    }

    // Exercises Section
    const exercisesHeader = document.createElement('div');
    exercisesHeader.style.display = 'flex';
    exercisesHeader.style.justifyContent = 'space-between';
    exercisesHeader.style.alignItems = 'center';
    exercisesHeader.style.marginTop = 'var(--spacing-lg)';
    exercisesHeader.innerHTML = `
        <h2 class="text-title-3">Exercícios</h2>
        <button id="add-exercise-btn" class="btn-icon" style="background: var(--accent-color); color: white; width: 32px; height: 32px;">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        </button>
    `;
    form.appendChild(exercisesHeader);

    const exercisesContainer = document.createElement('div');
    exercisesContainer.id = 'exercises-list';
    exercisesContainer.style.display = 'flex';
    exercisesContainer.style.flexDirection = 'column';
    exercisesContainer.style.gap = 'var(--spacing-sm)';
    form.appendChild(exercisesContainer);

    // Render Exercises
    const renderExercises = () => {
        exercisesContainer.innerHTML = '';
        if (workout.exercises && workout.exercises.length > 0) {
            workout.exercises.forEach((ex, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '0';
                card.style.padding = '16px';
                card.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <div style="flex: 1;">
                            <input type="text" class="input-field" placeholder="Nome do Exercício" value="${ex.name}" data-index="${index}" data-field="name" style="margin-bottom: 8px; font-weight: 600;">
                            <div style="display: flex; gap: 8px;">
                                <input type="number" class="input-field" placeholder="Séries" value="${ex.sets}" data-index="${index}" data-field="sets" style="flex: 1;">
                                <input type="text" class="input-field" placeholder="Reps" value="${ex.reps}" data-index="${index}" data-field="reps" style="flex: 1;">
                            </div>
                        </div>
                        <button class="btn-icon remove-ex-btn" data-index="${index}" style="color: var(--system-red); width: 32px; height: 32px;">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                `;
                exercisesContainer.appendChild(card);
            });
        } else {
            exercisesContainer.innerHTML = `
                <div class="text-center text-secondary" style="padding: 20px; border: 1px dashed var(--separator); border-radius: var(--radius-md);">
                    Nenhum exercício adicionado.
                </div>
            `;
        }

        // Re-attach listeners
        exercisesContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.index;
                const field = e.target.dataset.field;
                workout.exercises[idx][field] = e.target.value;
            });
        });

        exercisesContainer.querySelectorAll('.remove-ex-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index); // Ensure integer
                workout.exercises.splice(idx, 1);
                renderExercises();
                // Re-initialize icons after re-render
                if (window.lucide) window.lucide.createIcons();
            });
        });

        if (window.lucide) window.lucide.createIcons();
    };

    renderExercises();

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.style.marginTop = 'var(--spacing-xl)';
    saveBtn.innerHTML = `<i data-lucide="save"></i> Salvar Treino`;
    form.appendChild(saveBtn);

    container.appendChild(form);

    // Event Listeners
    container.querySelector('#add-exercise-btn').addEventListener('click', () => {
        if (!workout.exercises) workout.exercises = [];
        workout.exercises.push({ name: '', sets: 3, reps: '10' });
        renderExercises();
    });

    container.querySelector('#workout-name').addEventListener('input', (e) => {
        workout.name = e.target.value;
    });

    if (!isEditing) {
        container.querySelector('#workout-type').addEventListener('change', (e) => {
            workout.type = e.target.value;
        });
    }

    if (isEditing) {
        container.querySelector('#delete-btn').addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir este treino?')) {
                await remove('workouts', workout.id);
                navigate('/library');
            }
        });
    }

    saveBtn.addEventListener('click', async () => {
        if (!workout.name) {
            alert('Por favor, dê um nome ao treino.');
            return;
        }

        try {
            if (isEditing) {
                await put('workouts', workout);
            } else {
                await add('workouts', workout);
            }
            navigate('/library');
        } catch (e) {
            console.error('Error saving workout', e);
            alert('Erro ao salvar.');
        }
    });

    // Initialize Icons
    setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
    }, 0);

    return container;
};
