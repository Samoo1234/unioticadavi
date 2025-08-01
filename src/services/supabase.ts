import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não encontradas. ' +
    'Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Tipos para facilitar o uso
export type SupabaseClient = typeof supabase
export type { Database } from '@/types/database'

// Helper para verificar se o usuário está autenticado
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
  return user
}

// Helper para fazer logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Erro ao fazer logout:', error)
    throw error
  }
}

// Helper para verificar se o usuário tem permissão
export const checkUserPermission = async (requiredRole: string[]) => {
  const user = await getCurrentUser()
  if (!user) return false

  const { data: userData, error } = await supabase
    .from('usuarios')
    .select('role, ativo')
    .eq('id', user.id)
    .single()

  if (error || !userData || !userData.ativo) {
    return false
  }

  return requiredRole.includes(userData.role)
}

export default supabase