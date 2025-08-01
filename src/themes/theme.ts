import { createTheme } from '@mui/material/styles'
import { ptBR } from '@mui/material/locale'

// Paleta de cores personalizada para ótica
const palette = {
  primary: {
    main: '#1976d2', // Azul profissional
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#dc004e', // Rosa/vermelho para destaques
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff'
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20'
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100'
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828'
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b'
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff'
  },
  text: {
    primary: '#212121',
    secondary: '#757575'
  }
}

// Tipografia personalizada
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 500,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    textTransform: 'none' as const
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    textTransform: 'uppercase' as const
  }
}

// Componentes customizados
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none' as const,
        fontWeight: 500,
        padding: '8px 16px'
      },
      contained: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
        }
      }
    }
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
        }
      }
    }
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      },
      elevation2: {
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
      }
    }
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8
        }
      }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500
      }
    }
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(0,0,0,0.12)'
      }
    }
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          backgroundColor: '#f5f5f5',
          fontWeight: 600,
          fontSize: '0.875rem'
        }
      }
    }
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.04)'
        }
      }
    }
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8
      }
    }
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 12
      }
    }
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
      }
    }
  }
}

// Breakpoints customizados
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920
  }
}

// Espaçamento customizado
const spacing = 8

// Criar o tema
export const theme = createTheme(
  {
    palette,
    typography,
    components,
    breakpoints,
    spacing,
    shape: {
      borderRadius: 8
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195
      }
    }
  },
  ptBR // Localização em português
)

// Tipos para extensão do tema
declare module '@mui/material/styles' {
  interface Theme {
    status?: {
      danger: string
    }
  }

  interface ThemeOptions {
    status?: {
      danger?: string
    }
  }
}

export default theme