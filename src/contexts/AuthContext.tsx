import { createContext, useContext, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { toast } from 'react-toastify'

interface Usuario {
  id: string
  nome: string
  email: string
  ativo: boolean
  ultimo_login?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  userData: Usuario | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserData: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<Usuario | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false) // SEMPRE false para evitar loading infinito

  // Função para buscar dados do usuário na tabela usuarios
  const fetchUserData = async (userId: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .single()

      if (error) {
        return null
      }

      return data
    } catch (error) {
      return null
    }
  }

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Buscar dados do usuário na tabela usuarios
        const userData = await fetchUserData(data.user.id)
        
        if (!userData) {
          await supabase.auth.signOut()
          throw new Error('Usuário não encontrado ou inativo no sistema')
        }

        // Atualizar último login
        await supabase
          .from('usuarios')
          .update({ ultimo_login: new Date().toISOString() })
          .eq('id', data.user.id)

        setUser(data.user)
        setUserData(userData)
        setSession(data.session)
        
        toast.success(`Bem-vindo(a), ${userData.nome}!`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      setUserData(null)
      setSession(null)
      
      toast.info('Logout realizado com sucesso')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar dados do usuário
  const updateUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.id)
      setUserData(data)
    }
  }

  const value: AuthContextType = {
    user,
    userData,
    session,
    loading,
    signIn,
    signOut,
    updateUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export { AuthContext }