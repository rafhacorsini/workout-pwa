
// Analytics Service for Volume and 1RM Calculations

import { EXERCISE_DB, normalizeExerciseName } from '../core/exercises-db.js';

/**
 * Calculates Muscle Heatmap Data from Logs
 * @param {Array} logs - History logs
 * @returns {Object} { chest: 5, back: 2, ... } (Set counts)
 */
export const calculateMuscleVolume = (logs) => {
                          const volume = {
                                                    chest: 0, back: 0, shoulders: 0,
                                                    biceps: 0, triceps: 0,
                                                    quads: 0, hamstrings: 0, glutes: 0,
                                                    abs: 0, calves: 0, other: 0
                          };

                          // Filter last 7 days for heatmap
                          const now = new Date();
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(now.getDate() - 7);

                          const recentLogs = logs.filter(l => new Date(l.date) >= oneWeekAgo);

                          recentLogs.forEach(log => {
                                                    if (!log.data) return;
                                                    Object.entries(log.data).forEach(([exerciseName, data]) => {
                                                                              const exerciseInfo = normalizeExerciseName(exerciseName);
                                                                              const target = exerciseInfo.target || 'other';
                                                                              const sets = Array.isArray(data) ? data.length : (data.sets?.length || 0);

                                                                              if (volume[target] !== undefined) {
                                                                                                        volume[target] += sets;
                                                                              }
                                                    });
                          });

                          return volume;
};

/**
 * Calculate 1RM using Brzycki Formula
 * Weight * (36 / (37 - Reps))
 */
export const calculate1RM = (weight, reps) => {
                          if (reps === 1) return weight;
                          if (reps === 0 || !reps) return 0;
                          return Math.round(weight * (36 / (37 - reps)));
};

/**
 * Get Best 1RM for specific exercise from logs
 */
export const getBest1RM = (logs, exerciseKey) => {
                          let best = 0;

                          // Find exercise name that matches key (or fuzzy match)
                          const exerciseNameMatch = EXERCISE_DB[exerciseKey]?.name || exerciseKey;

                          logs.forEach(log => {
                                                    if (!log.data) return;

                                                    // Check exact key or name match (simplified)
                                                    const entries = Object.entries(log.data).filter(([name]) =>
                                                                              name.toLowerCase().includes(exerciseNameMatch.toLowerCase())
                                                    );

                                                    entries.forEach(([_, data]) => {
                                                                              const sets = Array.isArray(data) ? data : data.sets || [];
                                                                              sets.forEach(set => {
                                                                                                        const w = parseFloat(set.weight) || 0;
                                                                                                        const r = parseFloat(set.reps) || 0;
                                                                                                        if (w > 0 && r > 0) {
                                                                                                                                  const oneRM = calculate1RM(w, r);
                                                                                                                                  if (oneRM > best) best = oneRM;
                                                                                                        }
                                                                              });
                                                    });
                          });

                          return best;
};
