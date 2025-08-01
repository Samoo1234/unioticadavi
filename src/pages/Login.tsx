import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  useTheme,
  alpha
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  RemoveRedEye
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'


interface LoginForm {
  email: string
  password: string
}

export function Login() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, user, loading: authLoading } = useAuth()
  
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect se já estiver logado
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  const handleChange = (field: keyof LoginForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!form.email || !form.password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (!form.email.includes('@')) {
      setError('Por favor, insira um email válido')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await signIn(form.email, form.password)
      
      // Navegação será feita pelo useEffect acima
    } catch (error: any) {
      console.error('Erro no login:', error)
      setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit(event as any)
    }
  }

  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: theme.shadows[4]
                }}
              >
                <RemoveRedEye sx={{ fontSize: 40, color: 'primary.contrastText' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                Gestão Ótica
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sistema Unificado de Gestão
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                onKeyPress={handleKeyPress}
                disabled={loading}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                onKeyPress={handleKeyPress}
                disabled={loading}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !form.email || !form.password}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Entrar'
                )}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Sistema de Gestão para Óticas
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Versão 2.0 - Agendamentos & Controle Financeiro
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Login