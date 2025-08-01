// import React from 'react' // removido pois não é utilizado
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,

  Logout,
  Settings,
  Person
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useApp } from '@/contexts/AppContext'
import { Sidebar } from './Sidebar'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DRAWER_WIDTH = 280

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  
  const { userData, signOut } = useAuth()
  const { state, toggleSidebar, setSidebarOpen, unreadNotificationsCount } = useApp()
  
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null)
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null)

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget)
  }

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null)
  }

  const handleLogout = async () => {
    handleCloseUserMenu()
    await signOut()
    navigate('/login')
  }

  const handleProfile = () => {
    handleCloseUserMenu()
    navigate('/perfil')
  }

  const handleSettings = () => {
    handleCloseUserMenu()
    navigate('/configuracoes')
  }

  const handleDrawerToggle = () => {
    if (isMobile) {
      setSidebarOpen(!state.sidebarOpen)
    } else {
      toggleSidebar()
    }
  }

  const drawer = (
    <Sidebar />
  )

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: state.sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { md: state.sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestão Ótica
          </Typography>

          {/* Filial selecionada */}
          {state.filialSelecionada && (
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
              {state.filialSelecionada.nome}
            </Typography>
          )}

          {/* Notificações */}
          <Tooltip title="Notificações">
            <IconButton
              color="inherit"
              onClick={handleOpenNotifications}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadNotificationsCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menu do usuário */}
          <Tooltip title="Conta">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
                alt={userData?.nome || 'Usuário'}
                // src={userData?.avatar_url || undefined} // avatar_url não existe no tipo
                sx={{ width: 32, height: 32 }}
              >
                {userData?.nome?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Menu do usuário */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {userData?.nome}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userData?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userData?.role}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <Person sx={{ mr: 1 }} />
          Perfil
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <Settings sx={{ mr: 1 }} />
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Sair
        </MenuItem>
      </Menu>

      {/* Menu de notificações */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-notifications"
        anchorEl={anchorElNotifications}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElNotifications)}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6">Notificações</Typography>
        </Box>
        <Divider />
        {state.notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </MenuItem>
        ) : (
          state.notifications.slice(0, 5).map((notification) => (
            <MenuItem key={notification.id} onClick={handleCloseNotifications}>
              <Box>
                <Typography variant="subtitle2">
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.timestamp.toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
        {state.notifications.length > 5 && (
          <MenuItem onClick={() => navigate('/notificacoes')}>
            <Typography variant="body2" color="primary">
              Ver todas as notificações
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: state.sidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={state.sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="persistent"
          open={state.sidebarOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: state.sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  )
}

export default Layout
export { DRAWER_WIDTH }