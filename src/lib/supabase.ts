import { createClient } from '@supabase/supabase-js'

// Debug: check if environment variables are loaded
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL)
console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded" : "Missing")

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("supabaseUrl is required.")
}
if (!supabaseAnonKey) {
  throw new Error("supabaseAnonKey is required.")
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
