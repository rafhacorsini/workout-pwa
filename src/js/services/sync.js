
import { supabase, getCurrentUser } from './supabase.js';
import { getAll, put, clearStore } from '../core/db.js';

// Sync Logic: Cloud is the source of truth for initial load, then we push local changes.
// For a simple MVP, we will do a "Full Sync" strategy:
// 1. Pull from Cloud (Insert/Update local).
// 2. Push to Cloud (Upsert all local data).

export const syncData = async () => {
                          const user = await getCurrentUser();
                          if (!user) return; // Can't sync if not logged in

                          console.log('🔄 Starting Sync...');
                          const userId = user.id;

                          try {
                                                    await pullFromCloud(userId);
                                                    await pushToCloud(userId);
                                                    console.log('✅ Sync Completed!');
                                                    return true;
                          } catch (error) {
                                                    console.error('❌ Sync Failed:', error);
                                                    return false;
                          }
};

const pullFromCloud = async (userId) => {
                          // 1. Profiles
                          const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
                          if (profile) {
                                                    // Map snake_case (DB) to camelCase (App)
                                                    const localProfile = {
                                                                              id: 'user',
                                                                              name: profile.full_name,
                                                                              goal: profile.goal,
                                                                              height: profile.height,
                                                                              weight: profile.weight,
                                                                              age: profile.age,
                                                                              activityLevel: profile.activity_level,
                                                                              gender: profile.gender,
                                                                              isPro: profile.is_pro // Monetization Status
                                                    };
                                                    await put('profile', localProfile);
                          }

                          // 2. Workouts
                          const { data: workouts } = await supabase.from('workouts').select('*').eq('user_id', userId);
                          if (workouts) {
                                                    for (const w of workouts) {
                                                                              await put('workouts', w.data); // We stored the pure JSON object in 'data' column
                                                    }
                          }

                          // 3. Logs (History)
                          const { data: logs } = await supabase.from('workout_logs').select('*').eq('user_id', userId);
                          if (logs) {
                                                    for (const l of logs) {
                                                                              // Reconstruct log object
                                                                              const localLog = {
                                                                                                        id: l.id,
                                                                                                        date: l.date,
                                                                                                        workoutId: l.workout_id,
                                                                                                        workoutName: l.workout_name,
                                                                                                        duration: l.duration,
                                                                                                        data: l.log_data
                                                                              };
                                                                              await put('logs', localLog);
                                                    }
                          }

                          // 4. Weight History
                          const { data: weights } = await supabase.from('weight_history').select('*').eq('user_id', userId);
                          if (weights) {
                                                    for (const w of weights) {
                                                                              await put('weight_history', { id: w.id, date: w.date, weight: w.weight });
                                                    }
                          }

                          // 5. Nutrition Logs
                          const { data: nutrition } = await supabase.from('nutrition_logs').select('*').eq('user_id', userId);
                          if (nutrition) {
                                                    for (const n of nutrition) {
                                                                              await put('nutrition_logs', {
                                                                                                        id: n.id,
                                                                                                        date: n.date,
                                                                                                        meal: n.meal_name,
                                                                                                        calories: n.calories,
                                                                                                        macros: n.macros,
                                                                                                        items: n.items
                                                                              });
                                                    }
                          }
};

const pushToCloud = async (userId) => {
                          // 1. Profile
                          const localProfile = await getAll('profile'); // Returns array, take first
                          if (localProfile.length > 0) {
                                                    const p = localProfile[0];
                                                    // Don't overwrite is_pro from client side
                                                    const { error } = await supabase.from('profiles').upsert({
                                                                              id: userId,
                                                                              full_name: p.name,
                                                                              goal: p.goal || 'hypertrophy',
                                                                              height: p.height,
                                                                              weight: p.weight,
                                                                              age: p.age,
                                                                              activity_level: p.activityLevel,
                                                                              gender: p.gender,
                                                                              updated_at: new Date()
                                                    });
                                                    if (error) console.error('Profile Push Error:', error);
                          }

                          // 2. Workouts
                          const workouts = await getAll('workouts');
                          if (workouts.length > 0) {
                                                    const payload = workouts.map(w => ({
                                                                              id: w.id || crypto.randomUUID(), // Ensure ID
                                                                              user_id: userId,
                                                                              name: w.name,
                                                                              data: w, // Store full JSON
                                                                              updated_at: new Date()
                                                    }));
                                                    const { error } = await supabase.from('workouts').upsert(payload);
                                                    if (error) console.error('Workouts Push Error:', error);
                          }

                          // 3. Logs
                          const logs = await getAll('logs');
                          if (logs.length > 0) {
                                                    const payload = logs.map(l => ({
                                                                              id: l.id || crypto.randomUUID(),
                                                                              user_id: userId,
                                                                              date: l.date,
                                                                              workout_id: l.workoutId || 'unknown',
                                                                              workout_name: l.workoutName,
                                                                              duration: l.duration,
                                                                              log_data: l.data,
                                                                              created_at: new Date()
                                                    }));
                                                    const { error } = await supabase.from('workout_logs').upsert(payload);
                                                    if (error) console.error('Logs Push Error:', error);
                          }

                          // 4. Weight History (Skip push for MVP to avoid ID conflicts)
                          /*
                          const weights = await getAll('weight_history');
                          if (weights.length > 0) {
                              // ... implementation blocked for now
                          }
                          */

                          // 5. Nutrition Logs
                          const nutrition = await getAll('nutrition_logs');
                          if (nutrition.length > 0) {
                                                    const payload = nutrition.map(n => ({
                                                                              id: n.id,
                                                                              user_id: userId,
                                                                              date: n.date,
                                                                              meal_name: n.meal,
                                                                              calories: n.calories,
                                                                              macros: n.macros,
                                                                              items: n.items || [],
                                                                              created_at: new Date()
                                                    }));
                                                    const { error } = await supabase.from('nutrition_logs').upsert(payload);
                                                    if (error) console.error('Nutrition Push Error:', error);
                          }
};
