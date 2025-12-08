
// Database of Exercise Metadata
// Maps internal IDs to Muscle Groups for Heatmap Visualization

export const EXERCISE_DB = {
                          // CHEST
                          'bench_press': { name: 'Supino Reto', target: 'chest', type: 'strength' },
                          'db_bench_press': { name: 'Supino com Halteres', target: 'chest', type: 'strength' },
                          'incline_bench': { name: 'Supino Inclinado', target: 'chest', type: 'strength' },
                          'pec_deck': { name: 'Voador / Pec Deck', target: 'chest', type: 'isolation' },
                          'push_up': { name: 'Flexão de Braço', target: 'chest', type: 'calisthenics' },
                          'cable_fly': { name: 'Crossover / Fly', target: 'chest', type: 'isolation' },

                          // BACK
                          'pull_up': { name: 'Barra Fixa', target: 'back', type: 'calisthenics' },
                          'lat_pulldown': { name: 'Puxada Alta', target: 'back', type: 'strength' },
                          'barbell_row': { name: 'Remada Curvada', target: 'back', type: 'strength' },
                          'seated_row': { name: 'Remada Baixa', target: 'back', type: 'strength' },
                          'deadlift': { name: 'Levantamento Terra', target: 'back', type: 'compound' },

                          // LEGS - QUADS
                          'squat': { name: 'Agachamento Livre', target: 'quads', type: 'compound' },
                          'leg_press': { name: 'Leg Press', target: 'quads', type: 'strength' },
                          'leg_extension': { name: 'Cadeira Extensora', target: 'quads', type: 'isolation' },

                          // LEGS - HAMSTRINGS/GLUTES
                          'leg_curl': { name: 'Mesa Flexora', target: 'hamstrings', type: 'isolation' },
                          'stiff': { name: 'Stiff', target: 'hamstrings', type: 'strength' },
                          'hip_thrust': { name: 'Elevação Pélvica', target: 'glutes', type: 'strength' },

                          // SHOULDERS
                          'overhead_press': { name: 'Desenvolvimento', target: 'shoulders', type: 'strength' },
                          'lateral_raise': { name: 'Elevação Lateral', target: 'shoulders', type: 'isolation' },
                          'front_raise': { name: 'Elevação Frontal', target: 'shoulders', type: 'isolation' },

                          // ARMS
                          'bicep_curl': { name: 'Rosca Direta', target: 'biceps', type: 'isolation' },
                          'hammer_curl': { name: 'Rosca Martelo', target: 'biceps', type: 'isolation' },
                          'tricep_pushdown': { name: 'Tríceps Polia', target: 'triceps', type: 'isolation' },
                          'skull_crusher': { name: 'Tríceps Testa', target: 'triceps', type: 'isolation' },
                          'dips': { name: 'Mergulho (Dips)', target: 'triceps', type: 'calisthenics' },

                          // CORE
                          'crunch': { name: 'Abdominal', target: 'abs', type: 'isolation' },
                          'plank': { name: 'Prancha', target: 'abs', type: 'isometric' }
};

export const normalizeExerciseName = (name) => {
                          // Helper to find muscle for custom names (fuzzy match logic could go here)
                          // For MVP, we try to match keys
                          const lower = name.toLowerCase();
                          const entry = Object.entries(EXERCISE_DB).find(([id, data]) =>
                                                    lower.includes(data.name.toLowerCase()) || lower.includes(id)
                          );
                          return entry ? entry[1] : { target: 'other' };
};
