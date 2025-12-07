
import { ENV } from '../env.js';

let supabase = null;

if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
                          supabase = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
                          console.log('☁️ Supabase initialized');
} else {
                          console.warn('⚠️ Supabase credentials not found in env.js');
}

export { supabase };

// Helper to check if user is logged in
export const getCurrentUser = async () => {
                          if (!supabase) return null;
                          const { data: { session } } = await supabase.auth.getSession();
                          return session?.user || null;
};

// Sign In with Google
export const signInWithGoogle = async () => {
                          if (!supabase) return;
                          const { error } = await supabase.auth.signInWithOAuth({
                                                    provider: 'google',
                                                    options: {
                                                                              redirectTo: window.location.origin
                                                    }
                          });
                          if (error) throw error;
};

// Sign In with Email
export const signInWithEmail = async (email, password) => {
                          if (!supabase) return;
                          const { data, error } = await supabase.auth.signInWithPassword({
                                                    email,
                                                    password
                          });
                          if (error) throw error;
                          return data;
};

// Sign Up with Email
export const signUpWithEmail = async (email, password, fullName) => {
                          if (!supabase) return;
                          const { data, error } = await supabase.auth.signUp({
                                                    email,
                                                    password,
                                                    options: {
                                                                              data: {
                                                                                                        full_name: fullName
                                                                              }
                                                    }
                          });
                          if (error) throw error;
                          return data;
};

// Sign Out
export const signOut = async () => {
                          if (!supabase) return;
                          const { error } = await supabase.auth.signOut();
                          if (error) throw error;
};

// Reset Password
export const resetPassword = async (email) => {
                          if (!supabase) return;
                          const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                    redirectTo: `${window.location.origin}/`
                          });
                          if (error) throw error;
};
