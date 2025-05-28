import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppbwflcdpznxibrbngac.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYndmbGNkcHpueGlicmJuZ2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MDYwMzYsImV4cCI6MjA2Mzk4MjAzNn0.8YW6Xj7kySX6Knc1-5_poIFePVORwhA0pEBdl-DO9lo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
