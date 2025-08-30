import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { setupErrorFixes } from './ErrorFixes'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  FormHelperText,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { ptBR } from 'date-fns/locale'
import { format, parseISO, isValid } from 'date-fns'
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Clear as ClearIcon, 
  Block as BlockIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon, 
  Pending as PendingIcon, 
  Payments as PaymentIcon, 
  AttachFile as AttachFileIcon
} from '@mui/icons-material'

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
  categoria_id: number | null
  categoria_nome?: string
  nome?: string
  credor?: string
  valor: number
  periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  dia_vencimento: number
  data_vencimento?: string
  data_vencimento_completa?: string
  observacoes?: string
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
  data_pagamento?: string
  forma_pagamento?: string
  comprovante_url?: string
}

interface FormErrors {
  filial_id?: string
  valor?: string
  data_vencimento?: string
  categoria_id?: string
  data_pagamento?: string
  forma_pagamento?: string
}

export default function DespesasFixas() {
  const [despesas, setDespesas] = useState<DespesaFixaCompleta[]>([])
  const [despesasFiltradas, setDespesasFiltradas] = useState<DespesaFixaCompleta[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [categorias, setCategorias] = useState<CategoriaType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [showInactivas, setShowInactivas] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' as 'success' | 'error' })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState({
    filial_id: 'todas',
    periodicidade: 'todas',
    data_inicial: '',
    data_final: ''
  })

  const [formData, setFormData] = useState({
    filial_id: '',
    categoria_id: '',
    credor: '',
    valor: '',
    periodicidade: 'mensal' as 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual',
    data_vencimento: null as Date | null,
    observacoes: ''
  })
  
  const [paymentFormData, setPaymentFormData] = useState({
    data_pagamento: null as Date | null,
    forma_pagamento: '',
    comprovante_url: ''
  })
  
  const [paymentFormErrors, setPaymentFormErrors] = useState<FormErrors>({})

  // Corrigir problemas de referências de funções no console
  useEffect(() => {
    setupErrorFixes();
  }, [])

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

      interface DespesaSupabase {
        id: number;
        filial_id: number;
        categoria_id: number | null;
        nome?: string;
        credor?: string;
        valor: number;
        periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
        dia_vencimento: number;
        data_vencimento?: string;
        data_vencimento_completa?: string;
        observacoes?: string;
        status: 'ativo' | 'inativo';
        created_at: string;
        updated_at: string;
        data_pagamento?: string;
        forma_pagamento?: string;
        comprovante_url?: string;
        filial?: { nome: string };
        categoria?: { nome: string };
      }

      const despesasFormatadas = data?.map((despesa: DespesaSupabase) => ({
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
        .in('tipo', ['fixa', 'despesa_fixa'])
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

  const formatarData = (dataString?: string) => {
    if (!dataString) return '-'
    const data = parseISO(dataString)
    return isValid(data) ? format(data, 'dd/MM/yyyy') : '-'
  }

  // Função para extrair e formatar a data completa das observações
  const formatarDataVencimento = (despesa: DespesaFixaCompleta): string => {
    // Usar data_vencimento_completa se disponível
    if (despesa.data_vencimento_completa) {
      const data = new Date(despesa.data_vencimento_completa);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    // Fallback: método antigo
    if (despesa.observacoes && despesa.observacoes.includes(' - ')) {
      const mesAnoMatch = despesa.observacoes.match(/- (\d{2})\/(\d{4})/);
      if (mesAnoMatch) {
        const mes = mesAnoMatch[1];
        const ano = mesAnoMatch[2];
        const dia = String(despesa.dia_vencimento).padStart(2, '0');
        return `${dia}/${mes}/${ano}`;
      }
    }
    
    // Fallback final: usar mês/ano atual
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dia = String(despesa.dia_vencimento).padStart(2, '0');
    return `${dia}/${mes}/${ano}`;
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

  const formatValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }


  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(',', '.')
    if (/^\d*(\.\d{0,2})?$/.test(valor)) setFormData({ ...formData, valor })
  }

  const handleOpenDialog = (despesa?: DespesaFixaCompleta) => {
    if (despesa) {
      setEditingId(despesa.id)
      
      // Extrair mês/ano das observações se existir (formato: "- MM/YYYY")
      let dataVencimento = new Date();
      if (despesa.observacoes && despesa.observacoes.includes(' - ')) {
        const mesAnoMatch = despesa.observacoes.match(/- (\d{2})\/(\d{4})/);
        if (mesAnoMatch) {
          const mes = parseInt(mesAnoMatch[1]) - 1; // JavaScript usa mês 0-11
          const ano = parseInt(mesAnoMatch[2]);
          dataVencimento = new Date(ano, mes, despesa.dia_vencimento);
        } else {
          // Fallback: usar data atual com o dia de vencimento
          dataVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), despesa.dia_vencimento);
        }
      } else {
        // Fallback: usar data atual com o dia de vencimento
        dataVencimento = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), despesa.dia_vencimento);
      }
      
      setFormData({
        filial_id: despesa.filial_id.toString(),
        categoria_id: despesa.categoria_id?.toString() || '',
        credor: despesa.credor || despesa.nome || '',
        valor: despesa.valor.toString(),
        periodicidade: despesa.periodicidade,
        data_vencimento: dataVencimento,
        observacoes: despesa.observacoes || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        filial_id: '',
        categoria_id: '',
        credor: '',
        valor: '',
        periodicidade: 'mensal',
        data_vencimento: null,
        observacoes: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const salvarDespesa = async () => {
    // Validar formulário
    const errors: FormErrors = {}

    if (!formData.filial_id) {
      errors.filial_id = 'Selecione a filial'
    }

    if (!formData.categoria_id) {
      errors.categoria_id = 'Selecione a categoria'
    }

    if (!formData.categoria_id) {
      errors.categoria_id = 'Selecione a categoria'
    }

    if (!formData.valor) {
      errors.valor = 'Digite o valor da despesa'
    } else if (isNaN(Number(formData.valor))) {
      errors.valor = 'O valor deve ser um número'
    }

    if (!formData.data_vencimento) {
      errors.data_vencimento = 'Selecione a data de vencimento'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      // Extrair o dia da data de vencimento
      const diaVencimento = formData.data_vencimento ? formData.data_vencimento.getDate() : 1;
      
      const categoria = categorias.find(c => c.id.toString() === formData.categoria_id);
      
      const despesaData = {
        filial_id: parseInt(formData.filial_id),
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        credor: formData.credor || (categoria ? categoria.nome : 'Despesa'),
        valor: parseFloat(formData.valor),
        periodicidade: formData.periodicidade,
        dia_vencimento: diaVencimento,
        observacoes: formData.observacoes
      }

      if (editingId) {
        // Atualizar despesa existente
        const { error } = await supabase
          .from('despesas_fixas')
          .update(despesaData)
          .eq('id', editingId)
          .select()

        if (error) throw error

        setDespesas(prevDespesas => 
          prevDespesas.map(d => d.id === editingId ? { ...d, ...despesaData, id: editingId } : d)
        )

        showAlert('Despesa atualizada com sucesso!', 'success')
      } else {
        // Criar nova despesa
        if (formData.periodicidade === 'mensal' && formData.data_vencimento) {
          // Para despesas mensais, criar 12 registros (um para cada mês a partir da data selecionada)
          const despesasParaInserir = []
          const dataBase = new Date(formData.data_vencimento)
          const diaVencimento = dataBase.getDate()
          
          for (let i = 0; i < 12; i++) {
            const dataVencimento = new Date(dataBase.getFullYear(), dataBase.getMonth() + i, diaVencimento)
            const mesAno = `${String(dataVencimento.getMonth() + 1).padStart(2, '0')}/${dataVencimento.getFullYear()}`
            
            const despesaMensal = {
              ...despesaData,
              dia_vencimento: diaVencimento,
              data_vencimento_completa: dataVencimento.toISOString().split('T')[0],
              observacoes: `${formData.observacoes || ''} - ${mesAno}`.trim(),
              status: 'ativo'
            }
            despesasParaInserir.push(despesaMensal)
          }

          const { error } = await supabase
            .from('despesas_fixas')
            .insert(despesasParaInserir)
            .select()

          if (error) throw error

          showAlert(`${despesasParaInserir.length} despesas mensais criadas com sucesso!`, 'success')
        } else {
          // Para outras periodicidades, criar apenas um registro
          const despesaUnica = {
            ...despesaData,
            data_vencimento_completa: formData.data_vencimento ? formData.data_vencimento.toISOString().split('T')[0] : null,
            status: 'ativo'
          }
          
          const { error } = await supabase
            .from('despesas_fixas')
            .insert(despesaUnica)
            .select()

          if (error) throw error

          showAlert('Despesa criada com sucesso!', 'success')
        }
      }

      handleCloseDialog()
      loadDespesas()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('Erro ao salvar despesa:', errorMessage)
      showAlert(`Erro ao salvar despesa: ${errorMessage}`, 'error')
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
        showAlert(`Erro ao excluir despesa fixa: ${(error as any)?.message || error}`, 'error')
      }
    }
  }

  // Função para selecionar/deselecionar item individual
  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  // Função para selecionar/deselecionar todos os itens
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
    } else {
      setSelectedItems(despesasFiltradas.map(d => d.id))
    }
    setSelectAll(!selectAll)
  }

  // Função para deletar itens selecionados
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      showAlert('Selecione pelo menos uma despesa para excluir', 'error')
      return
    }

    const confirmMessage = `Tem certeza que deseja excluir ${selectedItems.length} despesa(s) fixa(s) selecionada(s)?`
    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('despesas_fixas')
        .delete()
        .in('id', selectedItems)

      if (error) throw error
      
      showAlert(`${selectedItems.length} despesa(s) fixa(s) excluída(s) com sucesso!`, 'success')
      setSelectedItems([])
      setSelectAll(false)
      loadDespesas()
    } catch (error) {
      console.error('Erro ao excluir despesas fixas:', error)
      showAlert(`Erro ao excluir despesas fixas: ${(error as any)?.message || error}`, 'error')
    }
  }


  const aplicarFiltros = () => {
    let resultado = [...despesas];

    // Filtrar apenas ativas ou todas
    if (!showInactivas) {
      resultado = resultado.filter(despesa => despesa.status === 'ativo');
    }
    
    // Filtrar por filial
    if (filtros.filial_id !== 'todas') {
      resultado = resultado.filter(despesa => 
        despesa.filial_id === parseInt(filtros.filial_id)
      );
    }
    
    // Filtrar por periodicidade
    if (filtros.periodicidade !== 'todas') {
      resultado = resultado.filter(despesa => 
        despesa.periodicidade === filtros.periodicidade
      );
    }

    // Filtrar por data inicial e final
    if (filtros.data_inicial || filtros.data_final) {
      const dataInicial = filtros.data_inicial ? new Date(filtros.data_inicial) : null;
      const dataFinal = filtros.data_final ? new Date(filtros.data_final) : null;
      
      resultado = resultado.filter(despesa => {
        // Usar data_vencimento_completa se disponível, senão fallback para dia_vencimento
        let dataDespesa = null;
        
        if (despesa.data_vencimento_completa) {
          dataDespesa = new Date(despesa.data_vencimento_completa);
        } else {
          // Fallback para o método antigo
          const hoje = new Date();
          dataDespesa = new Date(hoje.getFullYear(), hoje.getMonth(), despesa.dia_vencimento);
        }
        
        // Aplicar filtros
        let passaFiltro = true;
        
        if (dataInicial) {
          passaFiltro = passaFiltro && dataDespesa >= dataInicial;
        }
        
        if (dataFinal) {
          passaFiltro = passaFiltro && dataDespesa <= dataFinal;
        }
        
        return passaFiltro;
      });
    }
    
    setDespesasFiltradas(resultado);
  }
  
  // Aplicar filtros quando despesas, filtros ou showInactivas mudam
  useEffect(() => {
    aplicarFiltros();
  }, [despesas, filtros, showInactivas]);

  const getTotalDespesas = () => {
    return despesasFiltradas.reduce((sum, d) => sum + d.valor, 0)
  }

  const getTotalPagas = () => {
    return despesasFiltradas.filter(d => d.data_pagamento).reduce((sum, d) => sum + d.valor, 0)
  }

  const getTotalPendentes = () => {
    return despesasFiltradas.filter(d => !d.data_pagamento).reduce((sum, d) => sum + d.valor, 0)
  }

  // Função para abrir o diálogo de pagamento
  const handleOpenPaymentDialog = (id: number) => {
    const despesa = despesas.find(d => d.id === id);
    if (despesa) {
      setPaymentId(id);
      setPaymentFormData({
        data_pagamento: despesa.data_pagamento ? parseISO(despesa.data_pagamento) : new Date(),
        forma_pagamento: despesa.forma_pagamento || '',
        comprovante_url: despesa.comprovante_url || ''
      });
      setOpenPaymentDialog(true);
    }
  };

  // Função para fechar o diálogo de pagamento
  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setPaymentId(null);
    setPaymentFormData({
      data_pagamento: null,
      forma_pagamento: '',
      comprovante_url: ''
    });
    setPaymentFormErrors({});
  };

  // Função para validar o formulário de pagamento
  const validatePaymentForm = () => {
    const errors: FormErrors = {};
    
    if (!paymentFormData.data_pagamento) {
      errors.data_pagamento = 'Data de pagamento é obrigatória';
    }
    
    if (!paymentFormData.forma_pagamento) {
      errors.forma_pagamento = 'Forma de pagamento é obrigatória';
    }
    
    setPaymentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para salvar o pagamento
  const handleSavePayment = async () => {
    if (!validatePaymentForm() || !paymentId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('despesas_fixas')
        .update({
          data_pagamento: paymentFormData.data_pagamento?.toISOString().split('T')[0],
          forma_pagamento: paymentFormData.forma_pagamento,
          comprovante_url: paymentFormData.comprovante_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      handleClosePaymentDialog();
      loadDespesas();
      showAlert('Pagamento registrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      showAlert('Erro ao registrar pagamento', 'error');
    }
  };

  // Função para remover o registro de pagamento
  const handleRemovePayment = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover o registro de pagamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('despesas_fixas')
        .update({
          data_pagamento: null,
          forma_pagamento: null,
          comprovante_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      loadDespesas();
      showAlert('Registro de pagamento removido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao remover registro de pagamento:', error);
      showAlert('Erro ao remover registro de pagamento', 'error');
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" color="primary">
          Despesas Fixas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedItems.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Excluir Selecionadas ({selectedItems.length})
            </Button>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Despesa Fixa
          </Button>
        </Box>
      </Box>
      
      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filial</InputLabel>
              <Select
                value={filtros.filial_id}
                onChange={(e) => setFiltros({ ...filtros, filial_id: e.target.value })}
                label="Filial"
              >
                <MenuItem value="todas">Todas</MenuItem>
                {filiais.map(filial => (
                  <MenuItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Periodicidade</InputLabel>
              <Select
                value={filtros.periodicidade}
                onChange={(e) => setFiltros({ ...filtros, periodicidade: e.target.value })}
                label="Periodicidade"
              >
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="bimestral">Bimestral</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
                <MenuItem value="semestral">Semestral</MenuItem>
                <MenuItem value="anual">Anual</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Data Inicial"
              type="date"
              size="small"
              sx={{ minWidth: 170 }}
              value={filtros.data_inicial}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltros({ ...filtros, data_inicial: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Data Final"
              type="date"
              size="small"
              sx={{ minWidth: 170 }}
              value={filtros.data_final}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltros({ ...filtros, data_final: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={showInactivas}
                  onChange={(e) => setShowInactivas(e.target.checked)}
                />
              }
              label="Mostrar inativas"
            />

            <Button
              variant="outlined"
              color="primary"
              startIcon={<ClearIcon />}
              onClick={() => setFiltros({
                filial_id: 'todas',
                periodicidade: 'todas',
                data_inicial: '',
                data_final: ''
              })}
              sx={{ ml: 1 }}
            >
              Limpar
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Carregando...</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < despesasFiltradas.length}
                      />
                    </TableCell>
                    <TableCell>Filial</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Credor</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Periodicidade</TableCell>
                    <TableCell>Dia Vencimento</TableCell>
                    <TableCell>Pagamento</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {despesasFiltradas.map(despesa => (
                    <TableRow key={despesa.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedItems.includes(despesa.id)}
                          onChange={() => handleSelectItem(despesa.id)}
                        />
                      </TableCell>
                      <TableCell>{despesa.filial_nome}</TableCell>
                      <TableCell>{despesa.categoria_nome || '-'}</TableCell>
                      <TableCell>{despesa.credor || despesa.nome || '-'}</TableCell>
                      <TableCell>{formatValor(despesa.valor)}</TableCell>
                      <TableCell>{getPeriodicidadeLabel(despesa.periodicidade)}</TableCell>
                      <TableCell>{formatarDataVencimento(despesa)}</TableCell>
                      <TableCell>
                        <Tooltip title={despesa.data_pagamento ? `Pago em ${formatarData(despesa.data_pagamento)}` : 'Não pago'}>
                          <IconButton size="small" color={despesa.data_pagamento ? 'success' : 'default'}>
                            {despesa.data_pagamento ? <CheckCircleIcon fontSize="small" /> : <PendingIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={despesa.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          color={despesa.status === 'ativo' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleOpenDialog(despesa)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {!despesa.data_pagamento && (
                            <Tooltip title="Registrar pagamento">
                              <IconButton size="small" onClick={() => handleOpenPaymentDialog(despesa.id)} color="primary">
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {despesa.data_pagamento && (
                            <Tooltip title="Remover pagamento">
                              <IconButton size="small" onClick={() => handleRemovePayment(despesa.id)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title={despesa.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                            <IconButton
                              size="small"
                              color={despesa.status === 'ativo' ? 'error' : 'success'}
                              onClick={() => handleToggleStatus(despesa.id, despesa.status)}
                            >
                              {despesa.status === 'ativo' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Excluir despesa">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(despesa.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
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
              label="Credor"
              fullWidth
              value={formData.credor}
              onChange={(e) => setFormData({ ...formData, credor: e.target.value })}
              placeholder="Nome do credor/fornecedor"
            />
            <TextField
              label="Valor"
              fullWidth
              value={formData.valor}
              onChange={handleValorChange}
              required
              error={!!formErrors.valor}
              helperText={formErrors.valor}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
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
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data de Vencimento"
                value={formData.data_vencimento}
                onChange={(date) => setFormData({ ...formData, data_vencimento: date })}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!formErrors.data_vencimento,
                    helperText: formErrors.data_vencimento || 'Selecione a data de vencimento'
                  }
                }}
              />
            </LocalizationProvider>
            <TextField
              label="Observação"
              fullWidth
              multiline
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={salvarDespesa} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para registrar pagamento */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pagamento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data de Pagamento"
                value={paymentFormData.data_pagamento}
                onChange={(newDate) => setPaymentFormData({ ...paymentFormData, data_pagamento: newDate })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!paymentFormErrors.data_pagamento,
                    helperText: paymentFormErrors.data_pagamento
                  },
                }}
              />
            </LocalizationProvider>
            
            <FormControl fullWidth required error={!!paymentFormErrors.forma_pagamento}>
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select
                value={paymentFormData.forma_pagamento}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, forma_pagamento: e.target.value })}
                label="Forma de Pagamento"
              >
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="Boleto">Boleto</MenuItem>
                <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                <MenuItem value="Transferência">Transferência Bancária</MenuItem>
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
              {!!paymentFormErrors.forma_pagamento && (
                <FormHelperText>{paymentFormErrors.forma_pagamento}</FormHelperText>
              )}
            </FormControl>
            
            <TextField
              label="URL do Comprovante"
              fullWidth
              value={paymentFormData.comprovante_url}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, comprovante_url: e.target.value })}
              placeholder="https://..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachFileIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
          <Button onClick={handleSavePayment} variant="contained" color="primary">
            Registrar Pagamento
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