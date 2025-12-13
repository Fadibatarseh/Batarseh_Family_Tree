import { createClient } from '@supabase/supabase-js'

// 1. Go to Supabase Dashboard -> Project Settings (Gear icon) -> API
// 2. Copy "Project URL" and paste it below
const supabaseUrl = 'https://aitlgoljcxztolqbilki.supabase.co'

// 3. Copy "anon" / "public" key and paste it below
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdGxnb2xqY3h6dG9scWJpbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mzc5ODMsImV4cCI6MjA4MTIxMzk4M30.DTAhRGQkmYRJSdkfQ_QlecJ6rRU21G1S82meu3IJJQU'

export const supabase = createClient(supabaseUrl, supabaseKey)
