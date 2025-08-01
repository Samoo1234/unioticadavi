import { Fragment } from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Collapse,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  LocalHospital as DoctorIcon,
  LocationCity as CityIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Assignment as OrderIcon,
  BarChart as ReportIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Business as BusinessIcon
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
  roles?: string[]
  badge?: string | number
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['admin', 'atendente', 'medico', 'financeiro']
  },
  {
    id: 'sistema-agendamento',
    label: 'Sistema de Agendamento',
    icon: <CalendarIcon />,
    children: [
      {
        id: 'dashboard-agendamento',
        label: 'Dashboard',
        icon: <DashboardIcon />,
        path: '/sistema-agendamento/dashboard',
        roles: ['super_admin', 'admin', 'atendente', 'medico', 'manager', 'receptionist']
      },
      {
        id: 'datas-disponiveis',
        label: 'Datas Disponíveis',
        icon: <CalendarIcon />,
        path: '/sistema-agendamento/datas-disponiveis',
        roles: ['super_admin', 'admin', 'atendente', 'manager', 'receptionist']
      },
      {
        id: 'medicos-agendamento',
        label: 'Médicos',
        icon: <DoctorIcon />,
        path: '/sistema-agendamento/medicos',
        roles: ['super_admin', 'admin', 'atendente', 'manager', 'receptionist']
      },
      {
        id: 'cidades-agendamento',
        label: 'Filiais',
        icon: <CityIcon />,
        path: '/sistema-agendamento/cidades',
        roles: ['super_admin', 'admin', 'atendente', 'manager', 'receptionist']
      },
      {
        id: 'clientes-agendamento',
        label: 'Clientes',
        icon: <PeopleIcon />,
        path: '/sistema-agendamento/clientes',
        roles: ['super_admin', 'admin', 'atendente', 'medico', 'manager', 'receptionist']
      },
      {
        id: 'agendamentos',
        label: 'Agendamentos',
        icon: <CalendarIcon />,
        path: '/sistema-agendamento/agendamentos',
        roles: ['super_admin', 'admin', 'atendente', 'medico', 'manager', 'receptionist']
      },
      {
        id: 'financeiro-agendamento',
        label: 'Financeiro',
        icon: <MoneyIcon />,
        path: '/sistema-agendamento/financeiro',
        roles: ['super_admin', 'admin', 'financeiro', 'manager', 'financial']
      },
      {
        id: 'historico-agendamento',
        label: 'Histórico',
        icon: <CalendarIcon />,
        path: '/sistema-agendamento/historico',
        roles: ['super_admin', 'admin', 'atendente', 'medico', 'manager', 'receptionist']
      },
      {
        id: 'gerenciar-usuarios',
        label: 'Gerenciar Usuários',
        icon: <PeopleIcon />,
        path: '/sistema-agendamento/usuarios',
        roles: ['super_admin', 'admin']
      }
    ],
    roles: ['super_admin', 'admin', 'atendente', 'medico', 'financeiro', 'manager', 'receptionist', 'financial']
  },
  // Menu Cadastros removido
  // Menu Financeiro removido
  // Menu Ordens de Serviço removido
  {
    id: 'cmv',
    label: 'CMV',
    icon: <ReceiptIcon />,
    children: [
      {        id: 'medicos',        label: 'Médicos',        icon: <DoctorIcon />,        path: '/cmv/medicos',        roles: ['super_admin', 'admin', 'manager', 'financial']      },
      {
        id: 'tipos-fornecedores',
        label: 'Tipos de Fornecedores',
        icon: <BusinessIcon />,
        path: '/cmv/tipos-fornecedores',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'fornecedores',
        label: 'Fornecedores',
        icon: <BusinessIcon />,
        path: '/cmv/fornecedores',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'titulos',
        label: 'Títulos',
        icon: <ReceiptIcon />,
        path: '/cmv/titulos',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'extrato-titulos',
        label: 'Extrato de Títulos',
        icon: <ReceiptIcon />,
        path: '/cmv/extrato-titulos',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'categorias-despesas',
        label: 'Categorias de Despesas',
        icon: <ReceiptIcon />,
        path: '/cmv/categorias-despesas',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'despesas-fixas',
        label: 'Despesas Fixas',
        icon: <ReceiptIcon />,
        path: '/cmv/despesas-fixas',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'despesas-diversas',
        label: 'Despesas Diversas',
        icon: <ReceiptIcon />,
        path: '/cmv/despesas-diversas',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'extrato-despesas',
        label: 'Extrato Despesas',
        icon: <ReceiptIcon />,
        path: '/cmv/extrato-despesas',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'custo-os',
        label: 'Custo de OS',
        icon: <OrderIcon />,
        path: '/cmv/custo-os',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      },
      {
        id: 'relatorio-os',
        label: 'Relatório de OS',
        icon: <ReportIcon />,
        path: '/cmv/relatorio-os',
        roles: ['super_admin', 'admin', 'manager', 'financial']
      }
    ],
    roles: ['super_admin', 'admin', 'manager', 'financial']
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <SettingsIcon />,
    children: [
      {
        id: 'usuarios',
        label: 'Usuários',
        icon: <PeopleIcon />,
        path: '/configuracoes/usuarios',
        roles: ['super_admin', 'admin']
      }
      
    ],
    roles: ['super_admin', 'admin', 'manager']
  }
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userData } = useAuth()
  const [openMenus, setOpenMenus] = useState<string[]>(['sistema-agendamento', 'cmv'])

  const hasPermission = (roles?: string[]) => {
    if (!roles || !userData?.role) return true
    return roles.includes(userData.role)
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      setOpenMenus(prev => 
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      )
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const isActive = (path?: string) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasPermission(item.roles)) {
      return null
    }

    const isOpen = openMenus.includes(item.id)
    const active = isActive(item.path)

    return (
      <Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuClick(item)}
            selected={active}
            sx={{
              pl: 2 + level * 2,
              minHeight: 48,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: active ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: level > 0 ? '0.875rem' : '1rem',
                fontWeight: active ? 600 : 400,
              }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                color="error"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
            {item.children && (
              isOpen ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {item.children && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Fragment>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
              GO
            </Typography>
          </Box>
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            Gestão Ótica
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>
      
      <Divider />
      
      {/* Informações do usuário */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Usuário: {userData?.nome}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Perfil: {userData?.role}
        </Typography>
        {/* {userData?.filiais && (
          <Typography variant="caption" color="text.secondary" display="block">
            Filial: {userData.filiais.nome}
          </Typography>
        )} */}
      </Box>
    </Box>
  )
}

export default Sidebar