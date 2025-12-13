import { createClient } from '@supabase/supabase-js'

// REPLACE THESE WITH YOUR KEYS FROM SUPABASE DASHBOARD -> SETTINGS -> API
const supabaseUrl = https://aitlgoljcxztolqbilki.supabase.co
const supabaseKey = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdGxnb2xqY3h6dG9scWJpbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mzc5ODMsImV4cCI6MjA4MTIxMzk4M30.DTAhRGQkmYRJSdkfQ_QlecJ6rRU21G1S82meu3IJJQU

export const supabase = createClient(supabaseUrl, supabaseKey)
