import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { userData } = useAuth();

  const can = (_permission: string): boolean => {
    if (!userData) return false;
    
    // Super admin e admin têm acesso total
    if (userData.role === 'super_admin' || userData.role === 'admin') {
      return true;
    }
    
    // Para outros roles, pode implementar lógica específica baseada no role
    return false;
  };

  return { can };
}