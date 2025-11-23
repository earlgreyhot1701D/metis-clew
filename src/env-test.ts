// ENV DIAGNOSTIC TEST
console.log('=== ENVIRONMENT VARIABLE DIAGNOSTIC ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
console.log('VITE_SUPABASE_PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log('All import.meta.env:', import.meta.env);
console.log('====================================');

export {};
