import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Filial } from '@/types/database'

// Tipos para o estado da aplicação
interface AppState {
  filialSelecionada: Filial | null
  filiais: Filial[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Tipos para as ações
type AppAction =
  | { type: 'SET_FILIAL_SELECIONADA'; payload: Filial | null }
  | { type: 'SET_FILIAIS'; payload: Filial[] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

// Estado inicial
const initialState: AppState = {
  filialSelecionada: null,
  filiais: [],
  sidebarOpen: true,
  theme: 'light',
  notifications: []
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILIAL_SELECIONADA':
      return {
        ...state,
        filialSelecionada: action.payload
      }
    
    case 'SET_FILIAIS':
      return {
        ...state,
        filiais: action.payload
      }
    
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      }
    
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload
      }
    
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      }
    
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false
      }
      return {
        ...state,
        notifications: [newNotification, ...state.notifications]
      }
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      }
    
    default:
      return state
  }
}

// Contexto
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Actions helpers
  setFilialSelecionada: (filial: Filial | null) => void
  setFiliais: (filiais: Filial[]) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  // Computed values
  unreadNotificationsCount: number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action helpers
  const setFilialSelecionada = (filial: Filial | null) => {
    dispatch({ type: 'SET_FILIAL_SELECIONADA', payload: filial })
  }

  const setFiliais = (filiais: Filial[]) => {
    dispatch({ type: 'SET_FILIAIS', payload: filiais })
  }


  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open })
  }

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  }

  // Computed values
  const unreadNotificationsCount = state.notifications.filter(n => !n.read).length

  const value: AppContextType = {
    state,
    dispatch,
    setFilialSelecionada,
    setFiliais,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    addNotification,
    markNotificationRead,
    removeNotification,
    clearNotifications,
    unreadNotificationsCount
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook personalizado
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider')
  }
  return context
}

export { AppContext }
export type { AppState, AppAction, Notification }