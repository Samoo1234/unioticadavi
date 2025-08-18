import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { supabase } from '@/services/supabase'

interface CategoriaDespesa {
  id: number
  nome: string
  tipo: 'fixa' | 'diversa'
  created_at: string
  updated_at: string
}

export default function CategoriasDespesas() {
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [currentCategoria, setCurrentCategoria] = useState<Partial<CategoriaDespesa>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Carregar categorias
  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error

      setCategorias(data || [])
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar categorias de despesas')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (categoria?: CategoriaDespesa) => {
    if (categoria) {
      setCurrentCategoria(categoria)
    } else {
      setCurrentCategoria({})
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentCategoria({})
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentCategoria(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveCategoria = async () => {
    try {
      if (!currentCategoria.nome) {
        setSnackbar({ open: true, message: 'Nome da categoria é obrigatório', severity: 'error' })
        return
      }

      if (currentCategoria.id) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({
            nome: currentCategoria.nome,
            tipo: currentCategoria.tipo || 'fixa',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCategoria.id)

        if (error) throw error
        setSnackbar({ open: true, message: 'Categoria atualizada com sucesso', severity: 'success' })
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('categorias')
          .insert([
            {
              nome: currentCategoria.nome,
              tipo: currentCategoria.tipo || 'fixa',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (error) throw error
        setSnackbar({ open: true, message: 'Categoria criada com sucesso', severity: 'success' })
      }

      handleCloseDialog()
      fetchCategorias()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Erro ao salvar categoria', severity: 'error' })
    }
  }

  const handleDeleteCategoria = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSnackbar({ open: true, message: 'Categoria excluída com sucesso', severity: 'success' })
      fetchCategorias()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Erro ao excluir categoria', severity: 'error' })
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Filtrar categorias pelo termo de busca
  const filteredCategorias = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Paginação
  const paginatedCategorias = filteredCategorias.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Categorias de Despesas
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Buscar"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 1 }}
          />
          <IconButton color="primary">
            <SearchIcon />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Categoria
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Data de Criação</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCategorias.length > 0 ? (
                    paginatedCategorias.map((categoria) => (
                      <TableRow key={categoria.id} hover>
                        <TableCell>{categoria.nome}</TableCell>
                        <TableCell>{categoria.tipo === 'fixa' ? 'Fixa' : 'Diversa'}</TableCell>
                        <TableCell>
                          {new Date(categoria.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(categoria)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCategoria(categoria.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Nenhuma categoria encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCategorias.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Itens por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Dialog para criar/editar categoria */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentCategoria.id ? 'Editar Categoria' : 'Nova Categoria'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nome"
            label="Nome da Categoria"
            type="text"
            fullWidth
            variant="outlined"
            value={currentCategoria.nome || ''}
            onChange={handleInputChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="tipo-label">Tipo de Categoria</InputLabel>
            <Select
              labelId="tipo-label"
              name="tipo"
              value={currentCategoria.tipo || 'fixa'}
              label="Tipo de Categoria"
              onChange={(e) => setCurrentCategoria(prev => ({ ...prev, tipo: e.target.value as 'fixa' | 'diversa' }))}
            >
              <MenuItem value="fixa">Fixa</MenuItem>
              <MenuItem value="diversa">Diversa</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveCategoria} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}