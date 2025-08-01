import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,

  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  InputAdornment
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { supabase } from '../../services/supabase'
import { toast } from 'react-toastify'

interface Fornecedor {
  id: number
  nome: string
  cnpj: string
  tipo_fornecedor_id: number
  endereco?: string
  telefone?: string
  email?: string
  ativo: boolean
  created_at: string
  updated_at: string
  tipos_fornecedores?: {
    nome: string
  }
}

interface TipoFornecedor {
  id: number
  nome: string
}

const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [tiposFornecedores, setTiposFornecedores] = useState<TipoFornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    tipo_fornecedor_id: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true
  })

  useEffect(() => {
    fetchFornecedores()
    fetchTiposFornecedores()
  }, [])

  const fetchFornecedores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('fornecedores')
        .select(`
          *,
          tipos_fornecedores (
            nome
          )
        `)
        .order('nome')

      if (error) throw error
      setFornecedores(data || [])
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_fornecedores')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setTiposFornecedores(data || [])
    } catch (error) {
      console.error('Erro ao buscar tipos de fornecedores:', error)
      toast.error('Erro ao carregar tipos de fornecedores')
    }
  }

  const handleOpenDialog = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
      setForm({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj,
        tipo_fornecedor_id: fornecedor.tipo_fornecedor_id.toString(),
        endereco: fornecedor.endereco || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        ativo: fornecedor.ativo
      })
    } else {
      setEditingFornecedor(null)
      setForm({
        nome: '',
        cnpj: '',
        tipo_fornecedor_id: '',
        endereco: '',
        telefone: '',
        email: '',
        ativo: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingFornecedor(null)
    setForm({
      nome: '',
      cnpj: '',
      tipo_fornecedor_id: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    if (!form.nome.trim() || !form.cnpj.trim() || !form.tipo_fornecedor_id) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      const fornecedorData = {
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim(),
        tipo_fornecedor_id: parseInt(form.tipo_fornecedor_id),
        endereco: form.endereco.trim() || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        ativo: form.ativo
      }

      if (editingFornecedor) {
        const { error } = await supabase
          .from('fornecedores')
          .update(fornecedorData)
          .eq('id', editingFornecedor.id)

        if (error) throw error
        toast.success('Fornecedor atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('fornecedores')
          .insert([fornecedorData])

        if (error) throw error
        toast.success('Fornecedor criado com sucesso!')
      }

      handleCloseDialog()
      fetchFornecedores()
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      toast.error('Erro ao salvar fornecedor')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDeleteDialog = (fornecedor: Fornecedor) => {
    setDeletingFornecedor(fornecedor)
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setDeletingFornecedor(null)
  }

  const handleDelete = async () => {
    if (!deletingFornecedor) return

    try {
      setLoading(true)
      
      // Verificar se o fornecedor está sendo usado em outras tabelas
      const { data: ordensServico, error: osError } = await supabase
        .from('ordens_servico')
        .select('id')
        .eq('fornecedor_id', deletingFornecedor.id)
        .limit(1)

      if (osError) throw osError

      if (ordensServico && ordensServico.length > 0) {
        toast.error('Não é possível excluir este fornecedor pois ele está vinculado a ordens de serviço')
        handleCloseDeleteDialog()
        return
      }

      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', deletingFornecedor.id)

      if (error) throw error

      toast.success('Fornecedor excluído com sucesso!')
      handleCloseDeleteDialog()
      fetchFornecedores()
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast.error('Erro ao excluir fornecedor')
    } finally {
      setLoading(false)
    }
  }

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj.includes(searchTerm) ||
    (fornecedor.tipos_fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedFornecedores = filteredFornecedores.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(filteredFornecedores.length / itemsPerPage)

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  if (loading && fornecedores.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Fornecedores
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Fornecedor
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Pesquisar fornecedores"
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFornecedores.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell>{fornecedor.nome}</TableCell>
                <TableCell>{fornecedor.cnpj}</TableCell>
                <TableCell>{fornecedor.tipos_fornecedores?.nome || '-'}</TableCell>
                <TableCell>{fornecedor.telefone || '-'}</TableCell>
                <TableCell>{fornecedor.email || '-'}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: fornecedor.ativo ? 'success.main' : 'error.main',
                      backgroundColor: fornecedor.ativo ? 'success.light' : 'error.light',
                    }}
                  >
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(fornecedor)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleOpenDeleteDialog(fornecedor)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Dialog para adicionar/editar fornecedor */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nome"
              name="nome"
              value={form.nome}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="CNPJ"
              name="cnpj"
              value={form.cnpj}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              select
              label="Tipo de Fornecedor"
              name="tipo_fornecedor_id"
              value={form.tipo_fornecedor_id}
              onChange={handleInputChange}
              fullWidth
              required
            >
              {tiposFornecedores.map((tipo) => (
                <MenuItem key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Endereço"
              name="endereco"
              value={form.endereco}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              select
              label="Status"
              name="ativo"
              value={form.ativo.toString()}
              onChange={(e) => setForm(prev => ({ ...prev, ativo: e.target.value === 'true' }))}
              fullWidth
            >
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {editingFornecedor ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o fornecedor "{deletingFornecedor?.nome}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Fornecedores