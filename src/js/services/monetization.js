
import { getById } from '../core/db.js';
import { supabase } from './supabase.js';

export const isPro = async () => {
                          // 1. Check local cache (Fast)
                          let profile = await getById('profile', 'user');

                          // 2. If locally true, assume valid (Sync engine handles revocation)
                          if (profile && profile.isPro) {
                                                    return true;
                          }

                          // 3. Fallback: Check cloud directly if local is false (maybe sync hasn't run)
                          // This is optional but good for immediate gratification after purchase
                          if (supabase) {
                                                    const { data: { session } } = await supabase.auth.getSession();
                                                    if (session) {
                                                                              const { data } = await supabase.from('profiles').select('is_pro').eq('id', session.user.id).single();
                                                                              if (data && data.is_pro) {
                                                                                                        // Update local if we found out they are pro
                                                                                                        if (profile) {
                                                                                                                                  profile.isPro = true;
                                                                                                                                  // We would need to 'put' this back, but let's leave that to the sync engine to avoid race conditions
                                                                                                        }
                                                                                                        return true;
                                                                              }
                                                    }
                          }

                          return false;
};

export const FEATURE = {
                          AI_ANALYSIS: 'ai_analysis',
                          UNLIMITED_LOGS: 'unlimited_logs',
                          ADVANCED_CHARTS: 'advanced_charts'
};

export const gateFeature = async (feature) => {
                          // Free features
                          if (!Object.values(FEATURE).includes(feature)) return true;

                          // Premium features logic
                          const hasAccess = await isPro();
                          return hasAccess;
};
