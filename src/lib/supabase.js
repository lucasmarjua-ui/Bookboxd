import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Durante el build de Next.js las variables pueden no estar disponibles
// en el contexto de prerenderizado de páginas estáticas como /_not-found
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseKey || 'placeholder'

export const supabase = createClient(url, key)