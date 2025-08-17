import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  FormHelperText
} from '@mui/material'
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
  // Ícone de PDF removido conforme centralização de relatórios
} from '@mui/icons-material'
import { supabase } from '../../services/supabase'

interface Filial {
  id: number
  nome: string
}

interface CategoriaType {
  id: number
  nome: string
}

interface DespesaDiversaCompleta {
  id: number
  filial_id: number
  categoria_id?: number
  nome: string
  valor: number
  data_despesa: string
  data_pagamento?: string
  forma_pagamento?: string
  observacao?: string
  status: 'pendente' | 'pago'
  filial_nome: string
  categoria_nome?: string
}

interface FormErrors {
  filial_id?: string
  valor?: string
  categoria_id?: string
  data_despesa?: string
}

export default function DespesasDiversas() {
  const [despesas, setDespesas] = useState<DespesaDiversaCompleta[]>([])
  const [despesasFiltradas, setDespesasFiltradas] = useState<DespesaDiversaCompleta[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' as 'success' | 'error' })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  
  // Filtros
  const [filtros, setFiltros] = useState({
    filial_id: 'todas',
    categoria_id: 'todas',
    data_inicial: '',
    data_final: ''
  })

  const [formData, setFormData] = useState({
    filial_id: '',
    categoria_id: '',
    valor: '',
    data_despesa: new Date().toISOString().split('T')[0]
  })


  useEffect(() => {
    loadDespesas()
    loadFiliais()
    loadCategorias()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [despesas, filtros])

  const loadDespesas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('despesas_diversas')
        .select(`
          *,
          filial:filiais(nome),
          categoria:categorias(nome)
        `)
        .order('data_despesa', { ascending: false })

      if (error) throw error

      const despesasFormatadas = data?.map((despesa: any) => ({
        ...despesa,
        filial_nome: despesa.filial?.nome || 'Sem filial',
        categoria_nome: despesa.categoria?.nome
      })) || []

      setDespesas(despesasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar despesas diversas:', error)
      showAlert('Erro ao carregar despesas diversas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome')
        .order('nome')

      if (error) throw error
      setFiliais(data || [])
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    }
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_despesas')
        .select('id, nome')
        .eq('tipo', 'diversa')
        .order('nome')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const aplicarFiltros = () => {
    let filtered = [...despesas]

    // Filtro por filial
    if (filtros.filial_id !== 'todas') {
      filtered = filtered.filter(d => d.filial_id.toString() === filtros.filial_id)
    }
    
    // Filtro por categoria
    if (filtros.categoria_id !== 'todas') {
      filtered = filtered.filter(d => d.categoria_id?.toString() === filtros.categoria_id)
    }

    // Filtro por data inicial
    if (filtros.data_inicial) {
      filtered = filtered.filter(d => d.data_despesa >= filtros.data_inicial)
    }

    // Filtro por data final
    if (filtros.data_final) {
      filtered = filtered.filter(d => d.data_despesa <= filtros.data_final)
    }

    setDespesasFiltradas(filtered)
  }

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ show: true, message, severity })
  }

  const formatValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const arredondarDuasCasas = (valor: string | number) => {
    const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor
    if (isNaN(num)) return ''
    return (Math.round(num * 100) / 100).toFixed(2)
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(',', '.')
    if (/^\d*(\.\d{0,2})?$/.test(valor)) setFormData({ ...formData, valor })
  }

  const handleOpenDialog = (despesa?: DespesaDiversaCompleta) => {
    if (despesa) {
      setEditingId(despesa.id)
      setFormData({
        filial_id: despesa.filial_id.toString(),
        categoria_id: despesa.categoria_id?.toString() || '',
        valor: despesa.valor.toString(),
        data_despesa: despesa.data_despesa
      })
    } else {
      setEditingId(null)
      setFormData({
        filial_id: '',
        categoria_id: '',
        valor: '',
        data_despesa: new Date().toISOString().split('T')[0]
      })
    }
    setFormErrors({})
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
    setFormErrors({})
  }


  const handleSubmit = async () => {
    // Validar formulário
    const errors: FormErrors = {}

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      errors.valor = 'Valor deve ser maior que zero'
    }

    if (!formData.filial_id) {
      errors.filial_id = 'Filial é obrigatória'
    }
    
    if (!formData.data_despesa) {
      errors.data_despesa = 'Data da despesa é obrigatória'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      // Buscar o nome da categoria selecionada
      const categoria = formData.categoria_id ? 
        categorias.find(c => c.id.toString() === formData.categoria_id) : null;
      
      // Importante: Não incluir o campo 'id' para que o banco gere automaticamente
      const despesaData = {
        filial_id: parseInt(formData.filial_id),
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        nome: 'Despesa Diversa',
        descricao: categoria ? `Despesa Diversa - ${categoria.nome}` : 'Despesa Diversa',
        valor: parseFloat(arredondarDuasCasas(formData.valor)),
        data: formData.data_despesa, // Campo obrigatório
        data_despesa: formData.data_despesa,
        data_pagamento: formData.data_despesa, // Já marca como pago na data da despesa
        status: 'pago' as const, // Sempre pago
        forma_pagamento: 'À vista' // Padrão para forma de pagamento
      }

      if (editingId) {
        const { error } = await supabase
          .from('despesas_diversas')
          .update(despesaData)
          .eq('id', editingId)

        if (error) throw error
        showAlert('Despesa diversa atualizada com sucesso!', 'success')
      } else {
        const { error } = await supabase
          .from('despesas_diversas')
          .insert(despesaData)

        if (error) throw error
        showAlert('Despesa diversa criada com sucesso!', 'success')
      }

      handleCloseDialog()
      loadDespesas()
    } catch (error) {
      console.error('Erro ao salvar despesa diversa:', error)
      showAlert('Erro ao salvar despesa diversa', 'error')
    }
  }



  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        const { error } = await supabase
          .from('despesas_diversas')
          .delete()
          .eq('id', id)

        if (error) throw error
        showAlert('Despesa excluída com sucesso!', 'success')
        loadDespesas()
      } catch (error) {
        console.error('Erro ao excluir despesa:', error)
        showAlert('Erro ao excluir despesa', 'error')
      }
    }
  }

  const clearFilters = () => {
    setFiltros({
      filial_id: 'todas',
      categoria_id: 'todas',
      data_inicial: '',
      data_final: ''
    })
  }

  const getTotalDespesas = () => {
    return despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
  }

  // A função de geração de PDF foi removida, pois a funcionalidade foi centralizada na página Extrato de Despesas
  
  return (
      
    <Box sx={{ padding: 2 }}>
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Despesa
        </Button>
      </Box>

      <Card sx={{ mb: 2, p: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <FilterListIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filial</InputLabel>
              <Select
                value={filtros.filial_id}
                onChange={(e) => setFiltros({ ...filtros, filial_id: e.target.value })}
                label="Filial"
                size="small"
              >
                <MenuItem value="todas">Todas</MenuItem>
                {filiais.map((filial) => (
                  <MenuItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filtros.categoria_id}
                onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
                label="Categoria"
                size="small"
              >
                <MenuItem value="todas">Todas</MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Data Inicial"
              type="date"
              value={filtros.data_inicial}
              onChange={(e) => setFiltros({ ...filtros, data_inicial: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label="Data Final"
              type="date"
              value={filtros.data_final}
              onChange={(e) => setFiltros({ ...filtros, data_final: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
            >
              Limpar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total de Despesas
            </Typography>
            <Typography variant="h5">
              {formatValor(getTotalDespesas())}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total
            </Typography>
            <Typography variant="h5" color="success.main">
              {formatValor(getTotalDespesas())}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Quantidade
            </Typography>
            <Typography variant="h5">
              {despesasFiltradas.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Filial</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Data da Despesa</TableCell>
                  <TableCell>Data de Pagamento</TableCell>
                  <TableCell>Forma de Pagamento</TableCell>
                  <TableCell>Observação</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : despesasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  despesasFiltradas.map((despesa) => (
                    <TableRow key={despesa.id}>
                      <TableCell>
                        <Chip
                          label="Pago"
                          color="success"
                          size="small"
                          icon={<PaymentIcon />}
                        />
                      </TableCell>
                      <TableCell>{despesa.nome}</TableCell>
                      <TableCell>{despesa.filial_nome}</TableCell>
                      <TableCell>{despesa.categoria_nome || 'Sem categoria'}</TableCell>
                      <TableCell>{formatValor(despesa.valor)}</TableCell>
                      <TableCell>{formatDate(despesa.data_despesa)}</TableCell>
                      <TableCell>
                        {despesa.data_pagamento ? formatDate(despesa.data_pagamento) : '-'}
                      </TableCell>
                      <TableCell>{despesa.forma_pagamento || '-'}</TableCell>
                      <TableCell>{despesa.observacao || '-'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton
                              onClick={() => handleOpenDialog(despesa)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              onClick={() => handleDelete(despesa.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog - Nova/Editar Despesa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Despesa' : 'Nova Despesa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Valor"
              type="number"
              value={formData.valor === '0' ? '' : formData.valor}
              onChange={handleValorChange}
              fullWidth
              required
              error={!!formErrors.valor}
              helperText={formErrors.valor}
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required error={!!formErrors.filial_id}>
                <InputLabel>Filial</InputLabel>
                <Select
                  value={formData.filial_id}
                  onChange={(e) => setFormData({ ...formData, filial_id: e.target.value })}
                  label="Filial"
                >
                  {filiais.map((filial) => (
                    <MenuItem key={filial.id} value={filial.id.toString()}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
                {!!formErrors.filial_id && (
                  <FormHelperText>{formErrors.filial_id}</FormHelperText>
                )}
              </FormControl>
              <FormControl fullWidth error={!!formErrors.categoria_id}>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                  label="Categoria"
                >
                  <MenuItem value="">Sem categoria</MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nome}
                    </MenuItem>
                  ))}
                </Select>
                {!!formErrors.categoria_id && (
                  <FormHelperText>{formErrors.categoria_id}</FormHelperText>
                )}
              </FormControl>
            </Box>
            <TextField
              label="Data da Despesa"
              type="date"
              value={formData.data_despesa}
              onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
              fullWidth
              required
              error={!!formErrors.data_despesa}
              helperText={formErrors.data_despesa}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
      >
        <Alert
          onClose={() => setAlert({ ...alert, show: false })}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}