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
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Pending as PendingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  PictureAsPdf as PictureAsPdfIcon
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

export default function DespesasDiversas() {
  const [despesas, setDespesas] = useState<DespesaDiversaCompleta[]>([])
  const [despesasFiltradas, setDespesasFiltradas] = useState<DespesaDiversaCompleta[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [payingDespesa, setPayingDespesa] = useState<DespesaDiversaCompleta | null>(null)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Filtros
  const [filtros, setFiltros] = useState({
    filial_id: 'todas',
    data_inicial: '',
    data_final: ''
  })

  const [formData, setFormData] = useState({
    filial_id: '',
    categoria_id: '',
    valor: '',
    data_despesa: new Date().toISOString().split('T')[0]
  })

  const [paymentData, setPaymentData] = useState({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: ''
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
        .from('categorias')
        .select('id, nome')
        .eq('tipo', 'despesa_diversa')
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
    return date.toLocaleDateString('pt-BR')
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
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const handleOpenPaymentDialog = (despesa: DespesaDiversaCompleta) => {
    setPayingDespesa(despesa)
    setPaymentData({
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: ''
    })
    setOpenPaymentDialog(true)
  }

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false)
    setPayingDespesa(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.valor || parseFloat(formData.valor) <= 0) {
        showAlert('Valor deve ser maior que zero', 'error')
        return
      }

      if (!formData.filial_id) {
        showAlert('Filial é obrigatória', 'error')
        return
      }

      const despesaData = {
        filial_id: parseInt(formData.filial_id),
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        nome: 'Despesa Diversa',
        valor: parseFloat(arredondarDuasCasas(formData.valor)),
        data_despesa: formData.data_despesa,
        status: 'pendente' as const
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

  const handlePayment = async () => {
    if (!payingDespesa) return

    try {
      const { error } = await supabase
        .from('despesas_diversas')
        .update({
          status: 'pago',
          data_pagamento: paymentData.data_pagamento,
          forma_pagamento: paymentData.forma_pagamento || null
        })
        .eq('id', payingDespesa.id)

      if (error) throw error
      
      showAlert('Despesa marcada como paga!', 'success')
      handleClosePaymentDialog()
      loadDespesas()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      showAlert('Erro ao marcar como pago', 'error')
    }
  }

  const handleMarkAsPending = async (id: number) => {
    try {
      const { error } = await supabase
        .from('despesas_diversas')
        .update({
          status: 'pendente',
          data_pagamento: null,
          forma_pagamento: null
        })
        .eq('id', id)

      if (error) throw error
      showAlert('Despesa marcada como pendente!', 'success')
      loadDespesas()
    } catch (error) {
      console.error('Erro ao marcar como pendente:', error)
      showAlert('Erro ao marcar como pendente', 'error')
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
      data_inicial: '',
      data_final: ''
    })
  }

  const getTotalDespesas = () => {
    return despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
  }

  const getTotalPagas = () => {
    return despesasFiltradas.filter(d => d.status === 'pago').reduce((sum, d) => sum + d.valor, 0)
  }

  const getTotalPendentes = () => {
    return despesasFiltradas.filter(d => d.status === 'pendente').reduce((sum, d) => sum + d.valor, 0)
  }

  const handleGerarPDF = () => {
    try {
      const doc = document.createElement('div')
      doc.innerHTML = `
        <html>
          <head>
            <title>Relatório de Despesas Diversas</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .status-pago { color: green; font-weight: bold; }
              .status-pendente { color: orange; font-weight: bold; }
              .resumo { margin: 20px 0; padding: 15px; background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Relatório de Despesas Diversas</h1>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')}</p>
            <div class="resumo">
              <h3>Resumo</h3>
              <p><strong>Total de Despesas:</strong> ${formatValor(getTotalDespesas())}</p>
              <p><strong>Total Pago:</strong> ${formatValor(getTotalPagas())}</p>
              <p><strong>Total Pendente:</strong> ${formatValor(getTotalPendentes())}</p>
              <p><strong>Quantidade:</strong> ${despesasFiltradas.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nome</th>
                  <th>Filial</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Data Despesa</th>
                  <th>Data Pagamento</th>
                  <th>Forma Pagamento</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                ${despesasFiltradas.map(despesa => `
                  <tr>
                    <td class="status-${despesa.status}">${despesa.status}</td>
                    <td>${despesa.nome}</td>
                    <td>${despesa.filial_nome}</td>
                    <td>${despesa.categoria_nome || 'Sem categoria'}</td>
                    <td>${formatValor(despesa.valor)}</td>
                    <td>${formatDate(despesa.data_despesa)}</td>
                    <td>${despesa.data_pagamento ? formatDate(despesa.data_pagamento) : '-'}</td>
                    <td>${despesa.forma_pagamento || '-'}</td>
                    <td>${despesa.observacao || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `
      
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(doc.innerHTML)
        newWindow.document.close()
        newWindow.print()
      }
      
      showAlert('Relatório PDF gerado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      showAlert('Erro ao gerar relatório PDF', 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" color="primary">
          Despesas Diversas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGerarPDF}
            disabled={despesasFiltradas.length === 0}
          >
            Gerar PDF
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Despesa
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filial</InputLabel>
              <Select
                value={filtros.filial_id}
                onChange={(e) => setFiltros({ ...filtros, filial_id: e.target.value })}
                label="Filial"
              >
                <MenuItem value="todas">Todas</MenuItem>
                {filiais.map((filial) => (
                  <MenuItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Data Inicial"
              type="date"
              size="small"
              value={filtros.data_inicial}
              onChange={(e) => setFiltros({ ...filtros, data_inicial: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Data Final"
              type="date"
              size="small"
              value={filtros.data_final}
              onChange={(e) => setFiltros({ ...filtros, data_final: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
            >
              Limpar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
              Total Pago
            </Typography>
            <Typography variant="h5" color="success.main">
              {formatValor(getTotalPagas())}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Pendente
            </Typography>
            <Typography variant="h5" color="warning.main">
              {formatValor(getTotalPendentes())}
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
                  <TableCell>Data Despesa</TableCell>
                  <TableCell>Data Pagamento</TableCell>
                  <TableCell>Forma Pagamento</TableCell>
                  <TableCell>Observação</TableCell>
                  <TableCell align="center">Ações</TableCell>
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
                          label={despesa.status}
                          color={despesa.status === 'pago' ? 'success' : 'warning'}
                          size="small"
                          icon={despesa.status === 'pago' ? <PaymentIcon /> : <PendingIcon />}
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
                          {despesa.status === 'pendente' ? (
                            <Tooltip title="Marcar como Pago">
                              <IconButton
                                onClick={() => handleOpenPaymentDialog(despesa)}
                                size="small"
                                color="success"
                              >
                                <PaymentIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Marcar como Pendente">
                              <IconButton
                                onClick={() => handleMarkAsPending(despesa.id)}
                                size="small"
                                color="warning"
                              >
                                <PendingIcon />
                              </IconButton>
                            </Tooltip>
                          )}
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
              inputProps={{ step: '0.01', min: '0' }}
              InputProps={{
                startAdornment: 'R$'
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
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
              </FormControl>
              <FormControl fullWidth>
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
              </FormControl>
            </Box>
            <TextField
              label="Data da Despesa"
              type="date"
              value={formData.data_despesa}
              onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
              fullWidth
              required
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

      {/* Dialog - Pagamento */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Marcar como Pago
        </DialogTitle>
        <DialogContent>
          {payingDespesa && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Despesa:</strong> {payingDespesa.nome}
              </Typography>
              <Typography variant="body1">
                <strong>Valor:</strong> {formatValor(payingDespesa.valor)}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Data do Pagamento"
              type="date"
              value={paymentData.data_pagamento}
              onChange={(e) => setPaymentData({ ...paymentData, data_pagamento: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Forma de Pagamento"
              value={paymentData.forma_pagamento}
              onChange={(e) => setPaymentData({ ...paymentData, forma_pagamento: e.target.value })}
              fullWidth
              placeholder="Ex: Dinheiro, Cartão, PIX, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
          <Button onClick={handlePayment} variant="contained" color="success">
            Marcar como Pago
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