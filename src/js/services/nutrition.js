
// AI Integration
export const parseMealWithAI = async (input, isImage = false) => {
                          try {
                                                    const payload = isImage
                                                                              ? { action: 'analyzeMealPhoto', data: { image: input } } // input is base64
                                                                              : { action: 'parseMeal', data: { mealText: input } };    // input is text

                                                    const response = await fetch('/api/ai', {
                                                                              method: 'POST',
                                                                              headers: { 'Content-Type': 'application/json' },
                                                                              body: JSON.stringify(payload)
                                                    });

                                                    if (!response.ok) throw new Error('AI Error');
                                                    return await response.json();
                          } catch (error) {
                                                    console.error('AI Parse Failed', error);
                                                    return null;
                          }
};

export const calculateMacros = (profile) => {
                          // Defaults
                          const weight = parseFloat(profile.weight) || 75;
                          const height = parseFloat(profile.height) || 175;
                          const age = parseInt(profile.age) || 25;
                          const gender = profile.gender || 'male';
                          const activity = profile.activityLevel || 'moderate';
                          const goal = profile.goal || 'hypertrophy';

                          // 1. BMR (Basal Metabolic Rate) - Mifflin-St Jeor Equation
                          let bmr = 0;
                          if (gender === 'male') {
                                                    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
                          } else {
                                                    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
                          }

                          // 2. TDEE (Total Daily Energy Expenditure)
                          const activityMultipliers = {
                                                    'sedentary': 1.2,
                                                    'light': 1.375,
                                                    'moderate': 1.55,
                                                    'active': 1.725,
                                                    'athlete': 1.9
                          };
                          const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.55));

                          // 3. Goal Adjustment
                          let targetCalories = tdee;
                          let protein = 2; // g per kg
                          let fat = 0.8; // g per kg

                          if (goal === 'hypertrophy' || goal === 'strength') {
                                                    targetCalories += 300; // Surplus
                                                    protein = 2.2;
                          } else if (goal === 'weight_loss') {
                                                    targetCalories -= 400; // Deficit
                                                    protein = 2.4; // High protein for satiety/muscle retention
                                                    fat = 0.6;
                          }

                          // 4. Macro Calculation (in grams)
                          const proteinGrams = Math.round(weight * protein);
                          const fatGrams = Math.round(weight * fat);

                          // Remaining calories for Carbs
                          const proteinCals = proteinGrams * 4;
                          const fatCals = fatGrams * 9;

                          // Ensure we don't go negative
                          let carbCals = targetCalories - proteinCals - fatCals;
                          if (carbCals < 0) carbCals = 0;

                          const carbGrams = Math.round(carbCals / 4);

                          return {
                                                    calories: targetCalories,
                                                    protein: proteinGrams,
                                                    carbs: carbGrams,
                                                    fat: fatGrams
                          };
};
