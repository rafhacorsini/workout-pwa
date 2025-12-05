/**
 * Utility Functions
 */

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(date).toLocaleDateString('pt-BR', options).toUpperCase();
};

export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Gamification Helpers
export const calculateXP = (logs) => {
    let xp = 0;
    logs.forEach(log => {
        if (log.data) {
            Object.values(log.data).forEach(exercise => {
                if (exercise.sets && Array.isArray(exercise.sets)) {
                    exercise.sets.forEach(set => {
                        const weight = parseFloat(set.weight) || 0;
                        const reps = parseFloat(set.reps) || 0;
                        xp += weight * reps;
                    });
                }
            });
        }
    });
    return Math.floor(xp); // 1kg * 1rep = 1 XP
};

export const calculateLevel = (xp) => {
    if (xp < 10000) return { level: 'Iniciante', next: 10000, progress: xp / 10000 };
    if (xp < 50000) return { level: 'Intermediário', next: 50000, progress: (xp - 10000) / 40000 };
    if (xp < 100000) return { level: 'Elite', next: 100000, progress: (xp - 50000) / 50000 };
    return { level: 'Lenda', next: xp * 1.5, progress: 1 };
};

export const calculateStreak = (logs) => {
    if (!logs || logs.length === 0) return 0;

    const dates = logs.map(l => new Date(l.date).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a)); // Descending

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if streak is active (has entry today or yesterday)
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let currentDate = new Date(uniqueDates[0]);

    for (let i = 0; i < uniqueDates.length; i++) {
        const logDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(currentDate - logDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (i === 0) {
            streak++;
            continue;
        }

        // Allow 1 day gap (consecutive days)
        if (diffDays <= 1) {
            streak++;
            currentDate = logDate;
        } else {
            break;
        }
    }

    return streak;
};

// Nutrition Helpers
export const calculateTDEE = (weight, height, age, gender, activityLevel) => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    const multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'athlete': 1.9
    };

    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export const calculateMacros = (tdee, goal, weight) => {
    let targetCalories = tdee;
    let proteinPerKg = 2.0;
    let fatPerKg = 0.9;

    if (goal === 'hypertrophy') {
        targetCalories += 400; // Surplus
        proteinPerKg = 2.0;
    } else if (goal === 'weight_loss') {
        targetCalories -= 500; // Deficit
        proteinPerKg = 2.2; // Higher protein to spare muscle
    }

    const proteinGrams = Math.round(weight * proteinPerKg);
    const fatGrams = Math.round(weight * fatPerKg);

    // Remaining calories for carbs (Protein = 4kcal/g, Fat = 9kcal/g)
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = targetCalories - proteinCals - fatCals;
    const carbGrams = Math.max(0, Math.round(remainingCals / 4));

    return {
        calories: targetCalories,
        protein: proteinGrams,
        carbs: carbGrams,
        fats: fatGrams
    };
};
