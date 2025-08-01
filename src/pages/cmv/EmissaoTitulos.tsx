import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Pagination,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { supabase } from '../../services/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função utilitária para formatação de data
const formatDateToBrazilian = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

interface Titulo {
  id: number
  tipo: string
  fornecedor: string
  filial: string
  vencimento: string
  pagamento: string
  valor: string
  status: string
  numero?: string
  data_emissao?: string
  observacao?: string
}

interface TituloCompleto extends Titulo {
  fornecedor_id?: number
  filial_id?: number
  tipo_id?: number
  data_pagamento?: string
  multa?: number
  juros?: number
}



const EmissaoTitulos: React.FC = () => {
  const [titulos, setTitulos] = useState<TituloCompleto[]>([])
  const [titulosFiltrados, setTitulosFiltrados] = useState<TituloCompleto[]>([])
  const [filtros, setFiltros] = useState({ tipo: '', fornecedor: '', filial: '', dataInicial: '', dataFinal: '' })
  const [filtroTipo, setFiltroTipo] = useState({ vencimento: false, pagamento: false, todos: true })
  const [tipos, setTipos] = useState<{ id: number, nome: string }[]>([])
  const [fornecedores, setFornecedores] = useState<{ id: number, nome: string }[]>([])
  const [filiais, setFiliais] = useState<{ id: number, nome: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' })
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(20)
  
  // Estados para o modal de pagamento
  const [modalPagamento, setModalPagamento] = useState(false)
  const [tituloSelecionado, setTituloSelecionado] = useState<number | null>(null)
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10))
  const [multa, setMulta] = useState<string>('0')
  const [juros, setJuros] = useState<string>('0')
  
  // Estados para o modal de edição
  const [modalEdicao, setModalEdicao] = useState(false)
  const [tituloEdicao, setTituloEdicao] = useState<TituloCompleto | null>(null)

  // Função para carregar dados
  const carregarDados = async () => {
    setIsLoading(true)
    try {
      console.log('=== DEBUG EMISSAO TITULOS ===')
      console.log('Iniciando carregamento de dados...')
      
      // Carregar tipos de fornecedores
      const { data: dadosTipos, error: errorTipos } = await supabase
        .from('tipos_fornecedores')
        .select('*')
        .order('nome')
      
      if (errorTipos) throw errorTipos
      
      // Carregar fornecedores
      const { data: dadosFornecedores, error: errorFornecedores } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome')
      
      if (errorFornecedores) throw errorFornecedores
      
      // Carregar filiais
      const { data: dadosFiliais, error: errorFiliais } = await supabase
        .from('filiais')
        .select('*')
        .order('nome')
      
      if (errorFiliais) throw errorFiliais
      
      // Carregar títulos
      const { data: dadosTitulos, error: errorTitulos } = await supabase
        .from('titulos')
        .select(`
          *,
          fornecedores(nome),
          filiais(nome),
          tipos_fornecedores(nome)
        `)
        .order('data_vencimento', { ascending: false })
      
      if (errorTitulos) throw errorTitulos
      
      console.log('Dados carregados:', {
        tipos: dadosTipos?.length || 0,
        fornecedores: dadosFornecedores?.length || 0,
        filiais: dadosFiliais?.length || 0,
        titulos: dadosTitulos?.length || 0
      })
      
      // Mapear tipos para o formato {id, nome}
      const tiposFormatados = (dadosTipos || []).map(t => ({
        id: t.id,
        nome: t.nome
      }))
      setTipos(tiposFormatados)
      
      // Mapear fornecedores para o formato {id, nome}
      const fornecedoresFormatados = (dadosFornecedores || []).map(f => ({
        id: f.id,
        nome: f.nome
      }))
      setFornecedores(fornecedoresFormatados)
      
      // Mapear filiais para o formato {id, nome}
      const filiaisFormatadas = (dadosFiliais || []).map(f => ({
        id: f.id,
        nome: f.nome
      }))
      setFiliais(filiaisFormatadas)
      
      // Processar os títulos
      const titulosFormatados = (dadosTitulos || []).map(titulo => {
        const fornecedor = fornecedoresFormatados.find(f => f.id === titulo.fornecedor_id)
        const filial = filiaisFormatadas.find(f => f.id === titulo.filial_id)
        const tipo = tiposFormatados.find(t => t.id === titulo.tipo_id)
        
        return {
          id: titulo.id,
          numero: titulo.numero_documento || titulo.numero,
          tipo: tipo?.nome || titulo.tipo || 'Não especificado',
          fornecedor: fornecedor?.nome || 'Não especificado',
          fornecedor_id: titulo.fornecedor_id,
          filial: filial?.nome || 'Não especificada',
          filial_id: titulo.filial_id,
          vencimento: titulo.data_vencimento,
          data_emissao: titulo.data_emissao,
          pagamento: titulo.data_pagamento || '',
          data_pagamento: titulo.data_pagamento,
          valor: (titulo.valor !== undefined && titulo.valor !== null && titulo.valor !== '' && !isNaN(Number(titulo.valor))) ? titulo.valor.toString() : '0.00',
          status: titulo.status || 'pendente',
          observacao: titulo.observacoes || titulo.observacao,
          multa: titulo.multa,
          juros: titulo.juros
        }
      })
      
      console.log('Títulos formatados:', titulosFormatados)
      
      setTitulos(titulosFormatados)
      setTitulosFiltrados(titulosFormatados)
      
      console.log('=== FIM DEBUG EMISSAO TITULOS ===')
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setAlert({
        open: true,
        message: 'Erro ao carregar dados. Por favor, tente novamente.',
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosFiltros = { ...filtros, [e.target.name]: e.target.value }
    setFiltros(novosFiltros)
    aplicarFiltros(novosFiltros, filtroTipo)
  }
  
  const handleFiltroTipoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    
    // Se algum tipo for marcado, desmarca os outros
    const novoFiltroTipo = {
      vencimento: name === 'vencimento' ? checked : false,
      pagamento: name === 'pagamento' ? checked : false,
      todos: name === 'todos' ? checked : false
    }
    
    // Se todos forem desmarcados, ativa o 'todos'
    if (!novoFiltroTipo.vencimento && !novoFiltroTipo.pagamento && !novoFiltroTipo.todos) {
      novoFiltroTipo.todos = true
    }
    
    setFiltroTipo(novoFiltroTipo)
    aplicarFiltros(filtros, novoFiltroTipo)
  }
  
  const aplicarFiltros = (filtrosAtuais = filtros, tiposFiltro = filtroTipo) => {
    let resultado = [...titulos]
    
    // Filtrar por tipo
    if (filtrosAtuais.tipo) {
      resultado = resultado.filter(titulo => titulo.tipo === filtrosAtuais.tipo)
    }
    
    // Filtrar por fornecedor
    if (filtrosAtuais.fornecedor) {
      resultado = resultado.filter(titulo => titulo.fornecedor === filtrosAtuais.fornecedor)
    }
    
    // Filtrar por filial
    if (filtrosAtuais.filial) {
      resultado = resultado.filter(titulo => titulo.filial === filtrosAtuais.filial)
    }
    
    // Filtrar por período (data inicial e final) baseado no tipo de filtro selecionado
    if (filtrosAtuais.dataInicial || filtrosAtuais.dataFinal) {
      // Apenas aplica o filtro se não estiver no modo "todos"
      if (!tiposFiltro.todos) {
        const dataInicial = filtrosAtuais.dataInicial ? new Date(filtrosAtuais.dataInicial) : null
        const dataFinal = filtrosAtuais.dataFinal ? new Date(filtrosAtuais.dataFinal) : null
        
        resultado = resultado.filter(titulo => {
          // Determina qual campo de data usar baseado no tipo de filtro
          const dataCampo = tiposFiltro.vencimento 
            ? new Date(titulo.vencimento) 
            : tiposFiltro.pagamento && titulo.pagamento 
              ? new Date(titulo.pagamento) 
              : null
          
          // Se não tiver a data necessária ou for nula, não passa no filtro
          if (!dataCampo) {
            return tiposFiltro.pagamento ? false : true // Se for filtro de pagamento, só mostra os pagos
          }
          
          // Aplica o filtro baseado nas datas fornecidas
          const passaFiltroInicial = !dataInicial || dataCampo >= dataInicial
          const passaFiltroFinal = !dataFinal || dataCampo <= dataFinal
          
          return passaFiltroInicial && passaFiltroFinal
        })
      }
    }
    
    // Se o filtro for por pagamento, só mostra títulos pagos
    if (tiposFiltro.pagamento && !tiposFiltro.todos) {
      resultado = resultado.filter(titulo => titulo.pagamento !== null && titulo.pagamento !== '')
    }
    
    setTitulosFiltrados(resultado)
    setPaginaAtual(1) // Resetar para primeira página quando aplicar filtros
  }
  
  // Funções de paginação
  const totalPaginas = Math.ceil(titulosFiltrados.length / itensPorPagina)
  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina
  const titulosPaginados = titulosFiltrados.slice(indiceInicial, indiceFinal)
  
  const handleMudarPagina = (novaPagina: number) => {
    setPaginaAtual(novaPagina)
  }
  
  const handleMudarItensPorPagina = (novosItens: number) => {
    setItensPorPagina(novosItens)
    setPaginaAtual(1)
  }

  // Funções para ações
  const handlePagar = (id: number) => {
    // Em vez de processar o pagamento imediatamente, abrimos o modal
    setTituloSelecionado(id)
    setDataPagamento(new Date().toISOString().slice(0, 10))
    setMulta('0')
    setJuros('0')
    setModalPagamento(true)
  }
  
  // Função para abrir o modal de edição
  const handleEditar = (titulo: TituloCompleto) => {
    setTituloEdicao(titulo)
    setMulta(titulo.multa?.toString() || '0')
    setJuros(titulo.juros?.toString() || '0')
    setModalEdicao(true)
  }
  
  const arredondarDuasCasas = (valor: string | number) => {
    const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor
    if (isNaN(num)) return ''
    return (Math.round(num * 100) / 100).toFixed(2)
  }
  
  // Substituir setMulta e setJuros para aceitar apenas até duas casas decimais
  const handleMultaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(',', '.')
    if (/^\d*(\.\d{0,2})?$/.test(valor)) setMulta(valor)
  }
  const handleJurosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(',', '.')
    if (/^\d*(\.\d{0,2})?$/.test(valor)) setJuros(valor)
  }
  
  // Função para finalizar o pagamento normal (sem multa/juros)
  const handleFinalizarPagamento = async () => {
    if (tituloSelecionado === null) return
    
    try {
      setIsLoading(true)
      console.log('Processando pagamento para título ID:', tituloSelecionado)
      
      // Preparar dados para atualização
      const dadosAtualizacao = {
        status: 'pago' as const,
        data_pagamento: dataPagamento
      }
      
      console.log('Dados de atualização:', dadosAtualizacao)
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('titulos')
        .update(dadosAtualizacao)
        .eq('id', tituloSelecionado)
      
      if (error) throw error
      
      // Atualizar o estado local com a nova data de pagamento
      const novosTitulos = titulos.map(t => {
        if (t.id === tituloSelecionado) {
          return {
            ...t,
            status: 'pago',
            pagamento: dataPagamento,
            data_pagamento: dataPagamento
          }
        }
        return t
      })
      
      setTitulos(novosTitulos)
      
      // Atualizar os títulos filtrados também
      const novosTitulosFiltrados = titulosFiltrados.map(t => {
        if (t.id === tituloSelecionado) {
          return {
            ...t,
            status: 'pago',
            pagamento: dataPagamento,
            data_pagamento: dataPagamento
          }
        }
        return t
      })
      
      setTitulosFiltrados(novosTitulosFiltrados)
      
      // Mostrar alerta de sucesso
      setAlert({
        open: true,
        message: 'Título pago com sucesso!',
        severity: 'success'
      })
      
      // Fechar o modal
      setModalPagamento(false)
    } catch (error) {
      console.error('Erro ao pagar título:', error)
      setAlert({
        open: true,
        message: 'Erro ao pagar título. Tente novamente.',
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para confirmar pagamento com multa e juros
  const handleConfirmarPagamentoComMultaJuros = async () => {
    if (tituloSelecionado === null) return
    
    try {
      setIsLoading(true)
      console.log('Processando pagamento com multa/juros para título ID:', tituloSelecionado)
      
      const multaValor = parseFloat(arredondarDuasCasas(multa)) || 0
      const jurosValor = parseFloat(arredondarDuasCasas(juros)) || 0
      
      // Preparar dados para atualização
      const dadosAtualizacao = {
        status: 'pago' as const,
        data_pagamento: dataPagamento,
        multa: multaValor,
        juros: jurosValor
      }
      
      console.log('Dados de atualização com multa/juros:', dadosAtualizacao)
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('titulos')
        .update(dadosAtualizacao)
        .eq('id', tituloSelecionado)
      
      if (error) throw error
      
      // Atualizar o estado local
      const novosTitulos = titulos.map(t => {
        if (t.id === tituloSelecionado) {
          return {
            ...t,
            status: 'pago',
            pagamento: dataPagamento,
            data_pagamento: dataPagamento,
            multa: multaValor,
            juros: jurosValor
          }
        }
        return t
      })
      
      setTitulos(novosTitulos)
      
      // Atualizar os títulos filtrados também
      const novosTitulosFiltrados = titulosFiltrados.map(t => {
        if (t.id === tituloSelecionado) {
          return {
            ...t,
            status: 'pago',
            pagamento: dataPagamento,
            data_pagamento: dataPagamento,
            multa: multaValor,
            juros: jurosValor
          }
        }
        return t
      })
      
      setTitulosFiltrados(novosTitulosFiltrados)
      
      // Mostrar alerta de sucesso
      setAlert({
        open: true,
        message: `Título pago com sucesso! Multa: R$ ${multaValor.toFixed(2)} | Juros: R$ ${jurosValor.toFixed(2)}`,
        severity: 'success'
      })
      
      // Fechar o modal
      setModalPagamento(false)
    } catch (error) {
      console.error('Erro ao pagar título com multa e juros:', error)
      setAlert({
        open: true,
        message: 'Erro ao pagar título. Tente novamente.',
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função para salvar edição de título
  const handleSalvarEdicao = async () => {
    if (!tituloEdicao) return
    
    try {
      setIsLoading(true)
      console.log('Processando edição para título ID:', tituloEdicao.id)
      
      const multaValor = parseFloat(arredondarDuasCasas(multa)) || 0
      const jurosValor = parseFloat(arredondarDuasCasas(juros)) || 0
      
      // Preparar dados para atualização
      const valorAtualizado = tituloEdicao.valor ? parseFloat(arredondarDuasCasas(tituloEdicao.valor)) : 0
      
      const dadosAtualizacao = {
        multa: multaValor,
        juros: jurosValor,
        valor: valorAtualizado
      }
      
      console.log('Dados de atualização:', dadosAtualizacao)
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('titulos')
        .update(dadosAtualizacao)
        .eq('id', tituloEdicao.id)
      
      if (error) throw error
      
      // Atualizar o estado local
      const novosTitulos = titulos.map(t => {
        if (t.id === tituloEdicao.id) {
          return {
            ...t,
            multa: multaValor,
            juros: jurosValor,
            valor: valorAtualizado.toString()
          }
        }
        return t
      })
      
      setTitulos(novosTitulos)
      
      // Atualizar os títulos filtrados também
      const novosTitulosFiltrados = titulosFiltrados.map(t => {
        if (t.id === tituloEdicao.id) {
          return {
            ...t,
            multa: multaValor,
            juros: jurosValor,
            valor: valorAtualizado.toString()
          }
        }
        return t
      })
      
      setTitulosFiltrados(novosTitulosFiltrados)
      
      // Mostrar alerta de sucesso
      setAlert({
        open: true,
        message: 'Edição salva com sucesso!',
        severity: 'success'
      })
      
      // Fechar o modal
      setModalEdicao(false)
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
      setAlert({
        open: true,
        message: 'Erro ao salvar edição. Tente novamente.',
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este título?')) {
      return
    }
    
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('titulos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setTitulos(titulos.filter(t => t.id !== id))
      setTitulosFiltrados(titulosFiltrados.filter(t => t.id !== id))
      
      setAlert({
        open: true,
        message: 'Título excluído com sucesso!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir título:', error)
      setAlert({
        open: true,
        message: 'Erro ao excluir título. Tente novamente.',
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false })
  }

  // Função para gerar PDF
  const handleGerarPDF = () => {
    const titulosParaPDF = titulosPaginados
    
    // Criar conteúdo HTML para o PDF
    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Títulos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-pendente { color: #ff9800; }
            .status-pago { color: #4caf50; }
            .status-vencido { color: #f44336; }
          </style>
        </head>
        <body>
          <h1>Relatório de Títulos</h1>
          <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fornecedor</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Multa</th>
                <th>Juros</th>
              </tr>
            </thead>
            <tbody>
              ${titulosParaPDF.map(titulo => `
                <tr>
                  <td>${titulo.numero}</td>
                  <td>${titulo.fornecedor || 'N/A'}</td>
                  <td>${formatDateToBrazilian(titulo.vencimento)}</td>
                  <td>R$ ${parseFloat(titulo.valor).toFixed(2)}</td>
                  <td class="status-${titulo.status}">${titulo.status.toUpperCase()}</td>
                  <td>R$ ${(titulo.multa || 0).toFixed(2)}</td>
                  <td>R$ ${(titulo.juros || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    // Abrir nova janela com o conteúdo
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
      newWindow.print()
    }
  }



  return (
    <Box sx={{ p: 3 }}>
      {/* Overlay de carregamento */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Emissão de Títulos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarDados}
            disabled={isLoading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGerarPDF}
          >
            Gerar PDF
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          
          {/* Primeira linha de filtros */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Tipo"
              select
              value={filtros.tipo}
              name="tipo"
              onChange={handleFiltroChange}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {tipos.map((tipo) => (
                <MenuItem key={tipo.id} value={tipo.nome}>
                  {tipo.nome}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              size="small"
              label="Fornecedor"
              select
              value={filtros.fornecedor}
              name="fornecedor"
              onChange={handleFiltroChange}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {fornecedores.map((fornecedor) => (
                <MenuItem key={fornecedor.id} value={fornecedor.nome}>
                  {fornecedor.nome}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              size="small"
              label="Filial"
              select
              value={filtros.filial}
              name="filial"
              onChange={handleFiltroChange}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {filiais.map((filial) => (
                <MenuItem key={filial.id} value={filial.nome}>
                  {filial.nome}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          
          {/* Segunda linha de filtros */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Data Inicial"
              type="date"
              value={filtros.dataInicial}
              name="dataInicial"
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              size="small"
              label="Data Final"
              type="date"
              value={filtros.dataFinal}
              name="dataFinal"
              onChange={handleFiltroChange}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          
          {/* Terceira linha - Tipo de filtro de data */}
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtroTipo.vencimento}
                  onChange={handleFiltroTipoChange}
                  name="vencimento"
                />
              }
              label="Filtrar por Vencimento"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtroTipo.pagamento}
                  onChange={handleFiltroTipoChange}
                  name="pagamento"
                />
              }
              label="Filtrar por Pagamento"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtroTipo.todos}
                  onChange={handleFiltroTipoChange}
                  name="todos"
                />
              }
              label="Todos"
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Lista de títulos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Títulos ({titulosFiltrados.length})
          </Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <List>
                {titulosPaginados.map((titulo) => {
                  const isVencido = new Date(titulo.vencimento) < new Date() && titulo.status === 'pendente'
                  const valorTotal = parseFloat(titulo.valor) + (titulo.multa || 0) + (titulo.juros || 0)
                  
                  return (
                    <ListItem key={titulo.id} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" component="span">
                              {titulo.numero || 'S/N'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              - {titulo.fornecedor}
                            </Typography>
                            {isVencido && (
                              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                                VENCIDO
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Tipo: {titulo.tipo} | Filial: {titulo.filial}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Vencimento: {formatDateToBrazilian(titulo.vencimento)} | 
                              Valor: R$ {parseFloat(titulo.valor).toFixed(2)}
                              {((titulo.multa && titulo.multa > 0) || (titulo.juros && titulo.juros > 0)) && (
                                <span>
                                  {titulo.multa && titulo.multa > 0 && ` | Multa: R$ ${titulo.multa.toFixed(2)}`}
                                  {titulo.juros && titulo.juros > 0 && ` | Juros: R$ ${titulo.juros.toFixed(2)}`}
                                  {` | Total: R$ ${valorTotal.toFixed(2)}`}
                                </span>
                              )}
                            </Typography>
                            {titulo.pagamento && (
                              <Typography variant="body2" color="success.main">
                                Pago em: {formatDateToBrazilian(titulo.pagamento)}
                              </Typography>
                            )}
                            {titulo.observacao && (
                              <Typography variant="body2" color="text.secondary">
                                Obs: {titulo.observacao}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          {titulo.status === 'pendente' && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handlePagar(titulo.id)}
                              title="Pagar"
                            >
                              <PaymentIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditar(titulo)}
                            title="Editar"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(titulo.id)}
                            title="Excluir"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )
                })}
              </List>
              
              {/* Paginação */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, titulosFiltrados.length)} de {titulosFiltrados.length} títulos
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Por página</InputLabel>
                    <Select
                      value={itensPorPagina}
                      label="Por página"
                      onChange={(e) => handleMudarItensPorPagina(Number(e.target.value))}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Pagination
                    count={totalPaginas}
                    page={paginaAtual}
                    onChange={(_, page) => handleMudarPagina(page)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      <Dialog open={modalPagamento} onClose={() => setModalPagamento(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Pagamento</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Confirme os dados do pagamento do título.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Data do Pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <TextField
              label="Multa (R$)"
              type="text"
              value={multa}
              onChange={handleMultaChange}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
            
            <TextField
              label="Juros (R$)"
              type="text"
              value={juros}
              onChange={handleJurosChange}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalPagamento(false)}>Cancelar</Button>
          <Button onClick={handleFinalizarPagamento} variant="contained" color="success">
            Pagar sem Multa/Juros
          </Button>
          <Button onClick={handleConfirmarPagamentoComMultaJuros} variant="contained" color="warning">
            Pagar com Multa/Juros
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={modalEdicao} onClose={() => setModalEdicao(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Título</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Edite os dados do título.
          </DialogContentText>
          {tituloEdicao && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Valor (R$)"
                type="number"
                value={tituloEdicao.valor}
                onChange={(e) => setTituloEdicao({ ...tituloEdicao, valor: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
              
              <TextField
                label="Multa (R$)"
                type="text"
                value={multa}
                onChange={handleMultaChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
              
              <TextField
                label="Juros (R$)"
                type="text"
                value={juros}
                onChange={handleJurosChange}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEdicao(false)}>Cancelar</Button>
          <Button onClick={handleSalvarEdicao} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default EmissaoTitulos