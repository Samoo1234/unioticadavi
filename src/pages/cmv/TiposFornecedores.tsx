import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon
} from '@mui/icons-material'
import { supabase } from '../../services/supabase'
import { toast } from 'react-toastify'

interface TipoFornecedor {
  id: number
  nome: string
  descricao: string | null
  created_at: string
  updated_at: string
}

interface TipoFornecedorFormData {
  nome: string
  descricao: string
}

const initialFormData: TipoFornecedorFormData = {
  nome: '',
  descricao: ''
}

export default function TiposFornecedores() {
  const [tipos, setTipos] = useState<TipoFornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoFornecedor | null>(null)
  const [formData, setFormData] = useState<TipoFornecedorFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tipoToDelete, setTipoToDelete] = useState<TipoFornecedor | null>(null)

  useEffect(() => {
    loadTipos()
  }, [])

  const loadTipos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tipos_fornecedores')
        .select('*')
        .order('nome')

      if (error) throw error
      setTipos(data || [])
    } catch (error) {
      console.error('Erro ao carregar tipos de fornecedores:', error)
      toast.error('Erro ao carregar tipos de fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (tipo?: TipoFornecedor) => {
    if (tipo) {
      setEditingTipo(tipo)
      setFormData({
        nome: tipo.nome,
        descricao: tipo.descricao || ''
      })
    } else {
      setEditingTipo(null)
      setFormData(initialFormData)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingTipo(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof TipoFornecedorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome do tipo é obrigatório')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      if (editingTipo) {
        // Atualizar tipo existente
        const { data, error } = await supabase
          .from('tipos_fornecedores')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTipo.id)
          .select()
          .single()

        if (error) throw error

        setTipos(prev => prev.map(tipo => 
          tipo.id === editingTipo.id ? data : tipo
        ))
        toast.success('Tipo de fornecedor atualizado com sucesso!')
      } else {
        // Criar novo tipo
        const { data, error } = await supabase
          .from('tipos_fornecedores')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null
          })
          .select()
          .single()

        if (error) throw error

        setTipos(prev => [...prev, data])
        toast.success('Tipo de fornecedor criado com sucesso!')
      }

      handleCloseDialog()
    } catch (error: any) {
      console.error('Erro ao salvar tipo:', error)
      if (error.code === '23505') {
        toast.error('Já existe um tipo de fornecedor com este nome')
      } else {
        toast.error('Erro ao salvar tipo de fornecedor')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (tipo: TipoFornecedor) => {
    setTipoToDelete(tipo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tipoToDelete) return

    try {
      setLoading(true)

      // Verificar se há fornecedores usando este tipo
      const { data: fornecedores, error: checkError } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('tipo_id', tipoToDelete.id)
        .limit(1)

      if (checkError) throw checkError

      if (fornecedores && fornecedores.length > 0) {
        toast.error('Não é possível excluir este tipo pois há fornecedores vinculados a ele')
        setDeleteDialogOpen(false)
        setTipoToDelete(null)
        return
      }

      const { error } = await supabase
        .from('tipos_fornecedores')
        .delete()
        .eq('id', tipoToDelete.id)

      if (error) throw error

      setTipos(prev => prev.filter(tipo => tipo.id !== tipoToDelete.id))
      toast.success('Tipo de fornecedor excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir tipo:', error)
      toast.error('Erro ao excluir tipo de fornecedor')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setTipoToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setTipoToDelete(null)
  }

  // Filtrar tipos pelo termo de busca
  const filteredTipos = tipos.filter(tipo =>
    tipo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tipo.descricao && tipo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Paginação
  const paginatedTipos = filteredTipos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading && tipos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="large" />
          Tipos de Fornecedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Novo Tipo
        </Button>
      </Box>

      {/* Barra de pesquisa */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Pesquisar tipos de fornecedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabela de tipos */}
      {filteredTipos.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {searchTerm ? 'Nenhum tipo encontrado para a pesquisa.' : 'Nenhum tipo de fornecedor cadastrado'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Data de Criação</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTipos.map((tipo) => (
                  <TableRow key={tipo.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {tipo.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tipo.descricao ? (
                        <Typography variant="body2" color="text.secondary">
                          {tipo.descricao}
                        </Typography>
                      ) : (
                        <Chip label="Sem descrição" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(tipo.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(tipo)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(tipo)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTipos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Card>
      )}

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTipo ? 'Editar Tipo de Fornecedor' : 'Novo Tipo de Fornecedor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Nome do Tipo"
              fullWidth
              required
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Laboratório, Distribuidora, etc."
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição opcional do tipo de fornecedor"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingTipo ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o tipo de fornecedor "{tipoToDelete?.nome}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita. Certifique-se de que não há fornecedores vinculados a este tipo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={loading}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}