import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Alert } from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  // fallbackPath = '/dashboard' // removido pois não é utilizado 
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  // Redirecionar para login se não estiver autenticado
  if (!user || !userData) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Verificar se o usuário está ativo
  if (!userData.ativo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Sua conta está inativa. Entre em contato com o administrador.
        </Alert>
      </Box>
    )
  }

  // Verificar permissões de role se especificadas
  if (requiredRoles.length > 0 && !requiredRoles.includes(userData.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Você não tem permissão para acessar esta página.
          <br />
          Seu perfil atual: <strong>{userData.role}</strong>
          <br />
          Perfis necessários: <strong>{requiredRoles.join(', ')}</strong>
        </Alert>
      </Box>
    )
  }

  // Renderizar o componente se todas as verificações passaram
  return <>{children}</>
}

// Hook para verificar permissões em componentes
export function usePermissions() {
  const { userData } = useAuth()

  const hasRole = (roles: string | string[]): boolean => {
    if (!userData?.role) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(userData.role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!userData?.role) return false
    return roles.includes(userData.role)
  }

  const hasAllRoles = (roles: string[]): boolean => {
    if (!userData?.role) return false
    return roles.every(role => role === userData.role)
  }

  const isAdmin = (): boolean => {
    return hasRole(['super_admin', 'admin'])
  }

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin')
  }

  const canManageFinancial = (): boolean => {
    return hasRole(['super_admin', 'admin', 'manager', 'financial'])
  }

  const canManageScheduling = (): boolean => {
    return hasRole(['super_admin', 'admin', 'manager', 'receptionist'])
  }

  const canViewReports = (): boolean => {
    return hasRole(['super_admin', 'admin', 'manager', 'financial'])
  }

  const canManageUsers = (): boolean => {
    return hasRole(['super_admin', 'admin'])
  }

  const canManageSettings = (): boolean => {
    return hasRole(['super_admin', 'admin', 'manager'])
  }

  return {
    userData,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isSuperAdmin,
    canManageFinancial,
    canManageScheduling,
    canViewReports,
    canManageUsers,
    canManageSettings
  }
}