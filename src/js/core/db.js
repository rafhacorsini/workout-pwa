/**
 * IndexedDB Wrapper & Data Service
 */

const DB_NAME = 'WorkoutAppDB';
const DB_VERSION = 6; // Incremented for Nutrition (v5) -> Fixes (v6)

let db = null;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = request.transaction;

            createObjectStores(db);
            try {
                seedInitialData(transaction);
            } catch (e) {
                console.warn('Seeding failed, but continuing upgrade:', e);
            }
        };
    });
};

const createObjectStores = (db) => {
    // Workouts Store
    if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('type', 'type', { unique: false });
    }

    // Logs Store (History)
    if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id' });
        logStore.createIndex('date', 'date', { unique: false });
        logStore.createIndex('workoutId', 'workoutId', { unique: false });
    }

    // Gyms Store
    if (!db.objectStoreNames.contains('gyms')) {
        db.createObjectStore('gyms', { keyPath: 'id' });
    }

    // Profile Store (New in v2)
    if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
    }

    // Nutrition Logs Store
    if (!db.objectStoreNames.contains('nutrition_logs')) {
        const nutritionStore = db.createObjectStore('nutrition_logs', { keyPath: 'id' });
        nutritionStore.createIndex('date', 'date', { unique: false });
    }

    // Daily Stats (Water) - New in v4
    if (!db.objectStoreNames.contains('daily_stats')) {
        db.createObjectStore('daily_stats', { keyPath: 'date' });
    }

    // Weight History - New in v4
    if (!db.objectStoreNames.contains('weight_history')) {
        const weightStore = db.createObjectStore('weight_history', { keyPath: 'id' });
        weightStore.createIndex('date', 'date', { unique: false });
    }

    // Photos - New in v4
    if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('date', 'date', { unique: false });
    }
};

const seedInitialData = (transaction) => {
    const workouts = [
        {
            id: 'push-a',
            name: 'Push (Superior A)',
            type: 'gym',
            exercises: [
                { name: 'Supino Reto', sets: 3, reps: '8-12' },
                { name: 'Desenvolvimento Halter', sets: 3, reps: '8-12' },
                { name: 'Tríceps Corda', sets: 3, reps: '12-15' },
                { name: 'Elevação Lateral', sets: 4, reps: '12-15' }
            ]
        },
        {
            id: 'pull-b',
            name: 'Pull (Superior B)',
            type: 'gym',
            exercises: [
                { name: 'Barra Fixa', sets: 3, reps: 'Falha' },
                { name: 'Remada Curvada', sets: 3, reps: '8-12' },
                { name: 'Rosca Direta', sets: 3, reps: '10-12' },
                { name: 'Face Pull', sets: 3, reps: '15-20' }
            ]
        },
        {
            id: 'leg-day',
            name: 'Leg Day',
            type: 'gym',
            exercises: [
                { name: 'Agachamento Livre', sets: 4, reps: '6-8' },
                { name: 'Leg Press', sets: 3, reps: '10-12' },
                { name: 'Stiff', sets: 3, reps: '10-12' },
                { name: 'Cadeira Extensora', sets: 3, reps: '12-15' }
            ]
        },
        {
            id: 'bjj-tech',
            name: 'Aula Técnica',
            type: 'bjj',
            fields: ['Técnicas', 'Observações']
        },
        {
            id: 'bjj-roll',
            name: 'Roll Livre',
            type: 'bjj',
            fields: ['Rounds', 'Parceiros', 'Intensidade']
        }
    ];

    const gyms = [
        { id: 'blue-fit', name: 'Blue Fit' },
        { id: 'smart-fit', name: 'Smart Fit' },
        { id: 'building', name: 'Academia do Prédio' },
        { id: 'home', name: 'Casa' }
    ];

    const profile = [
        { id: 'user', name: 'Atleta', goal: 'hypertrophy', level: 'intermediate' }
    ];

    // Helper to check and add safely
    const safeAdd = (storeName, items) => {
        try {
            const store = transaction.objectStore(storeName);
            items.forEach(item => {
                const request = store.add(item);
                request.onerror = (event) => {
                    // Prevent transaction from aborting on constraint error (duplicate key)
                    event.preventDefault();
                    event.stopPropagation();
                };
            });
        } catch (e) {
            console.warn(`Store ${storeName} not available for seeding`, e);
        }
    };

    safeAdd('workouts', workouts);
    safeAdd('gyms', gyms);
    safeAdd('profile', profile);
};

// Generic CRUD Helpers
export const getAll = (storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getById = (storeName, id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const add = (storeName, item) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const put = (storeName, item) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const remove = (storeName, id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const clearStore = (storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};
