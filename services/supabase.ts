// services/supabase.ts

// @ts-nocheck

const { createClient } = window.supabase;

// These are your Supabase credentials.
const SUPABASE_URL = 'https://hqmmhczzrjmzlmsuoibe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbW1oY3p6cmptemxtc3VvaWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjE3NDgsImV4cCI6MjA3NDMzNzc0OH0.fBL56GaYBwr9EB_rDvtTfnstD2tvo9o6b0oi4rqM06A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
