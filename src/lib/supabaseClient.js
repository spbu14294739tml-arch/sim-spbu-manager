// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqfzzfswrxswftvewkzz.supabase.co';

// Kunci asli dari Bapak
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZnp6ZnN3cnhzd2Z0dmV3a3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NjY0MTMsImV4cCI6MjEwODA0MjQxM30.X5i2sWcQBv0_Ad5FXLwvFtpsDNA8PHLUbAQzywLeGlo'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);