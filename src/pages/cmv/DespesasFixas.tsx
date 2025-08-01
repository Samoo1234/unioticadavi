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
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
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

interface DespesaFixaCompleta {
  id: number
  filial_id: number
  filial_nome: string
  categoria_id?: number
  categoria_nome?: string
  nome: string
  valor: number
  periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  dia_vencimento: number
  observacao?: string
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}

export default function DespesasFixas() {
  const [despesas, setDespesas] = useState<DespesaFixaCompleta[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showInactivas, setShowInactivas] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' as 'success' | 'error' })

  const [formData, setFormData] = useState({
    filial_id: '',
    categoria_id: '',
    nome: '',
    valor: '',
    periodicidade: 'mensal' as 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual',
    dia_vencimento: '',
    observacao: ''
  })

  useEffect(() => {
    loadDespesas()
    loadFiliais()
    loadCategorias()
  }, [])

  const loadDespesas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('despesas_fixas')
        .select(`
          *,
          filial:filiais(nome),
          categoria:categorias(nome)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const despesasFormatadas = data?.map((despesa: any) => ({
        ...despesa,
        filial_nome: despesa.filial?.nome || 'Sem filial',
        categoria_nome: despesa.categoria?.nome || 'Sem categoria'
      })) || []

      setDespesas(despesasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar despesas fixas:', error)
      showAlert('Erro ao carregar despesas fixas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
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
        .select('*')
        .eq('tipo', 'despesa_fixa')
        .order('nome')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ show: true, message, severity })
  }

  const formatValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const getPeriodicidadeLabel = (periodicidade: string) => {
    const labels = {
      mensal: 'Mensal',
      bimestral: 'Bimestral',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    }
    return labels[periodicidade as keyof typeof labels] || periodicidade
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

  const handleOpenDialog = (despesa?: DespesaFixaCompleta) => {
    if (despesa) {
      setEditingId(despesa.id)
      setFormData({
        filial_id: despesa.filial_id.toString(),
        categoria_id: despesa.categoria_id?.toString() || '',
        nome: despesa.nome,
        valor: despesa.valor.toString(),
        periodicidade: despesa.periodicidade,
        dia_vencimento: despesa.dia_vencimento.toString(),
        observacao: despesa.observacao || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        filial_id: '',
        categoria_id: '',
        nome: '',
        valor: '',
        periodicidade: 'mensal',
        dia_vencimento: '',
        observacao: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.nome.trim()) {
        showAlert('Nome é obrigatório', 'error')
        return
      }

      if (!formData.valor || parseFloat(formData.valor) <= 0) {
        showAlert('Valor deve ser maior que zero', 'error')
        return
      }

      if (!formData.filial_id) {
        showAlert('Filial é obrigatória', 'error')
        return
      }

      if (!formData.dia_vencimento || parseInt(formData.dia_vencimento) < 1 || parseInt(formData.dia_vencimento) > 31) {
        showAlert('Dia de vencimento deve estar entre 1 e 31', 'error')
        return
      }

      const despesaData = {
        filial_id: parseInt(formData.filial_id),
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        nome: formData.nome.trim(),
        valor: parseFloat(arredondarDuasCasas(formData.valor)),
        periodicidade: formData.periodicidade,
        dia_vencimento: parseInt(formData.dia_vencimento),
        observacao: formData.observacao.trim() || null,
        status: 'ativo' as const
      }

      if (editingId) {
        const { error } = await supabase
          .from('despesas_fixas')
          .update({ ...despesaData, updated_at: new Date().toISOString() })
          .eq('id', editingId)

        if (error) throw error
        showAlert('Despesa fixa atualizada com sucesso!', 'success')
      } else {
        const { error } = await supabase
          .from('despesas_fixas')
          .insert(despesaData)

        if (error) throw error
        showAlert('Despesa fixa criada com sucesso!', 'success')
      }

      handleCloseDialog()
      loadDespesas()
    } catch (error) {
      console.error('Erro ao salvar despesa fixa:', error)
      showAlert('Erro ao salvar despesa fixa', 'error')
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'
      const { error } = await supabase
        .from('despesas_fixas')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      showAlert(`Despesa fixa ${newStatus === 'ativo' ? 'ativada' : 'desativada'} com sucesso!`, 'success')
      loadDespesas()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      showAlert('Erro ao alterar status', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta despesa fixa?')) {
      try {
        const { error } = await supabase
          .from('despesas_fixas')
          .delete()
          .eq('id', id)

        if (error) throw error
        showAlert('Despesa fixa excluída com sucesso!', 'success')
        loadDespesas()
      } catch (error) {
        console.error('Erro ao excluir despesa fixa:', error)
        showAlert('Erro ao excluir despesa fixa', 'error')
      }
    }
  }

  const handleGenerateVencimentos = async () => {
    try {
      const despesasAtivas = despesas.filter(d => d.status === 'ativo')
      let totalGerados = 0
      
      for (const despesa of despesasAtivas) {
        // Gerar vencimentos dos próximos 3 meses
        const hoje = new Date()
        for (let i = 0; i < 3; i++) {
          const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, despesa.dia_vencimento)
          
          // Verificar se já existe um vencimento para esta data
          const { data: existente } = await supabase
            .from('despesas_diversas')
            .select('id')
            .eq('despesa_fixa_id', despesa.id)
            .eq('data', dataVencimento.toISOString().split('T')[0])
            .single()

          if (!existente) {
            const { error } = await supabase
              .from('despesas_diversas')
              .insert({
                despesa_fixa_id: despesa.id,
                data: dataVencimento.toISOString().split('T')[0],
                descricao: despesa.nome,
                valor: despesa.valor,
                categoria_id: despesa.categoria_id,
                forma_pagamento: 'Boleto',
                observacoes: `Gerado automaticamente de: ${despesa.nome}`
              })

            if (!error) totalGerados++
          }
        }
      }
      
      if (totalGerados > 0) {
        showAlert(`${totalGerados} vencimentos gerados com sucesso!`, 'success')
      } else {
        showAlert('Nenhum vencimento gerado (podem já existir)', 'success')
      }
    } catch (error) {
      console.error('Erro ao gerar vencimentos:', error)
      showAlert('Erro ao gerar vencimentos', 'error')
    }
  }

  const handleGerarPDF = () => {
    try {
      const doc = document.createElement('div')
      doc.innerHTML = `
        <html>
          <head>
            <title>Relatório de Despesas Fixas</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .status-ativo { color: green; font-weight: bold; }
              .status-inativo { color: red; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Relatório de Despesas Fixas</h1>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')}</p>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Filial</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Periodicidade</th>
                  <th>Dia Vencimento</th>
                  <th>Status</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                ${despesasFiltradas.map(despesa => `
                  <tr>
                    <td>${despesa.nome}</td>
                    <td>${despesa.filial_nome}</td>
                    <td>${despesa.categoria_nome || 'Sem categoria'}</td>
                    <td>${formatValor(despesa.valor)}</td>
                    <td>${getPeriodicidadeLabel(despesa.periodicidade)}</td>
                    <td>${despesa.dia_vencimento}</td>
                    <td class="status-${despesa.status}">${despesa.status}</td>
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

  const despesasFiltradas = despesas.filter(despesa => 
    showInactivas ? true : despesa.status === 'ativo'
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Despesas Fixas
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showInactivas}
                onChange={(e) => setShowInactivas(e.target.checked)}
              />
            }
            label="Mostrar inativas"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDespesas}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={handleGenerateVencimentos}
          >
            Gerar Vencimentos
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGerarPDF}
          >
            Relatório PDF
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Despesa Fixa
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Carregando...</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Filial</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Periodicidade</TableCell>
                    <TableCell>Dia Vencimento</TableCell>
                    <TableCell>Observação</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {despesasFiltradas.length > 0 ? (
                    despesasFiltradas.map((despesa) => (
                      <TableRow key={despesa.id} hover>
                        <TableCell>
                          <Chip 
                            label={despesa.status === 'ativo' ? 'Ativo' : 'Inativo'} 
                            color={despesa.status === 'ativo' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{despesa.nome}</TableCell>
                        <TableCell>{despesa.filial_nome}</TableCell>
                        <TableCell>{despesa.categoria_nome || 'Sem categoria'}</TableCell>
                        <TableCell>{formatValor(despesa.valor)}</TableCell>
                        <TableCell>{getPeriodicidadeLabel(despesa.periodicidade)}</TableCell>
                        <TableCell>{despesa.dia_vencimento}</TableCell>
                        <TableCell>{despesa.observacao || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(despesa)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={despesa.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                            <IconButton
                              size="small"
                              color={despesa.status === 'ativo' ? 'warning' : 'success'}
                              onClick={() => handleToggleStatus(despesa.id, despesa.status)}
                            >
                              {despesa.status === 'ativo' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(despesa.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        Nenhuma despesa fixa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar despesa fixa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              autoFocus
              label="Nome"
              fullWidth
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
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
                <MenuItem value="">
                  <em>Sem categoria</em>
                </MenuItem>
                {categorias.map((categoria) => (
                  <MenuItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Valor"
              fullWidth
              value={formData.valor}
              onChange={handleValorChange}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Periodicidade</InputLabel>
              <Select
                value={formData.periodicidade}
                onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value as any })}
                label="Periodicidade"
              >
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="bimestral">Bimestral</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
                <MenuItem value="semestral">Semestral</MenuItem>
                <MenuItem value="anual">Anual</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Dia de Vencimento"
              type="number"
              fullWidth
              value={formData.dia_vencimento}
              onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
              inputProps={{ min: 1, max: 31 }}
              required
            />
            <TextField
              label="Observação"
              fullWidth
              multiline
              rows={3}
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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