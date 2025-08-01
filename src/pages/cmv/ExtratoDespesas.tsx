import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Chip,
  Autocomplete,
  Card,
  CardContent,

} from '@mui/material'
import {
  Search as SearchIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material'
import { supabase } from '../../services/supabase'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

interface Categoria {
  id: number
  nome: string
}

interface Fornecedor {
  id: number
  nome: string
}

interface Despesa {
  id: number
  descricao: string
  valor: number
  data_pagamento: string
  categoria_id: number
  categoria_nome?: string
  fornecedor_id?: number
  fornecedor_nome?: string
  forma_pagamento: string
  tipo: 'fixa' | 'diversa'
  observacoes?: string
}

interface DespesaPorCategoria {
  categoria_nome: string
  total: number
}

interface DespesaPorFornecedor {
  fornecedor_nome: string
  total: number
}

export default function ExtratoDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null)
  const [filtroFornecedor, setFiltroFornecedor] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<{inicio: string, fim: string}>({
    inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fim: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<DespesaPorCategoria[]>([])
  const [despesasPorFornecedor, setDespesasPorFornecedor] = useState<DespesaPorFornecedor[]>([])

  // Carregar dados iniciais
  useEffect(() => {
    fetchDespesas()
    fetchCategorias()
    fetchFornecedores()
  }, [filtroPeriodo])

  // Calcular estatísticas quando as despesas mudarem
  useEffect(() => {
    calcularDespesasPorCategoria()
    calcularDespesasPorFornecedor()
  }, [despesas])

  const fetchDespesas = async () => {
    try {
      setLoading(true)
      
      // Buscar despesas fixas
      const { data: despesasFixas, error: errorFixas } = await supabase
        .from('despesas_fixas')
        .select(`
          id,
          descricao,
          valor,
          categoria_id,
          categorias_despesas(nome),
          forma_pagamento,
          observacoes
        `)
        .eq('status', 'ativo')

      if (errorFixas) throw errorFixas

      // Buscar despesas diversas
      const { data: despesasDiversas, error: errorDiversas } = await supabase
        .from('despesas_diversas')
        .select(`
          id,
          descricao,
          valor,
          data_pagamento,
          categoria_id,
          categorias_despesas(nome),
          fornecedor_id,
          fornecedores(nome),
          forma_pagamento,
          observacoes
        `)
        .gte('data_pagamento', filtroPeriodo.inicio)
        .lte('data_pagamento', filtroPeriodo.fim)

      if (errorDiversas) throw errorDiversas

      // Formatar despesas fixas
      const formattedFixas = despesasFixas?.map(item => ({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        data_pagamento: '-', // Despesas fixas não têm data de pagamento específica
        categoria_id: item.categoria_id,
        categoria_nome: (Array.isArray(item.categorias_despesas) ? item.categorias_despesas[0]?.nome : (item.categorias_despesas as any)?.nome),
        forma_pagamento: item.forma_pagamento,
        tipo: 'fixa' as 'fixa',
        observacoes: item.observacoes
      })) || []

      // Formatar despesas diversas
      const formattedDiversas = despesasDiversas?.map(item => ({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        data_pagamento: item.data_pagamento,
        categoria_id: item.categoria_id,
        categoria_nome: (Array.isArray(item.categorias_despesas) ? item.categorias_despesas[0]?.nome : (item.categorias_despesas as any)?.nome),
        fornecedor_id: item.fornecedor_id,
        fornecedor_nome: (Array.isArray(item.fornecedores) ? item.fornecedores[0]?.nome : (item.fornecedores as any)?.nome),
        forma_pagamento: item.forma_pagamento,
        tipo: 'diversa' as 'diversa',
        observacoes: item.observacoes
      })) || []

      // Combinar os dois tipos de despesas
      setDespesas([...formattedDiversas, ...formattedFixas])
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_despesas')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (error) throw error
      setCategorias(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (error) throw error
      setFornecedores(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error)
    }
  }

  const calcularDespesasPorCategoria = () => {
    const despesasPorCat: Record<string, number> = {}
    
    filteredDespesas.forEach(despesa => {
      const categoriaNome = despesa.categoria_nome || 'Sem categoria'
      if (!despesasPorCat[categoriaNome]) {
        despesasPorCat[categoriaNome] = 0
      }
      despesasPorCat[categoriaNome] += despesa.valor
    })
    
    const result = Object.entries(despesasPorCat).map(([categoria_nome, total]) => ({
      categoria_nome,
      total
    }))
    
    // Ordenar por valor total (decrescente)
    result.sort((a, b) => b.total - a.total)
    
    setDespesasPorCategoria(result)
  }

  const calcularDespesasPorFornecedor = () => {
    const despesasPorForn: Record<string, number> = {}
    
    filteredDespesas
      .filter(despesa => despesa.fornecedor_nome) // Apenas despesas com fornecedor
      .forEach(despesa => {
        const fornecedorNome = despesa.fornecedor_nome || 'Sem fornecedor'
        if (!despesasPorForn[fornecedorNome]) {
          despesasPorForn[fornecedorNome] = 0
        }
        despesasPorForn[fornecedorNome] += despesa.valor
      })
    
    const result = Object.entries(despesasPorForn).map(([fornecedor_nome, total]) => ({
      fornecedor_nome,
      total
    }))
    
    // Ordenar por valor total (decrescente)
    result.sort((a, b) => b.total - a.total)
    
    // Limitar aos 10 principais fornecedores
    setDespesasPorFornecedor(result.slice(0, 10))
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMesAnterior = () => {
    const dataInicio = new Date(filtroPeriodo.inicio)
    const novaDataInicio = startOfMonth(subMonths(dataInicio, 1))
    const novaDataFim = endOfMonth(novaDataInicio)
    
    setFiltroPeriodo({
      inicio: format(novaDataInicio, 'yyyy-MM-dd'),
      fim: format(novaDataFim, 'yyyy-MM-dd')
    })
  }

  const handleProximoMes = () => {
    const dataInicio = new Date(filtroPeriodo.inicio)
    const novaDataInicio = startOfMonth(addMonths(dataInicio, 1))
    const novaDataFim = endOfMonth(novaDataInicio)
    
    setFiltroPeriodo({
      inicio: format(novaDataInicio, 'yyyy-MM-dd'),
      fim: format(novaDataFim, 'yyyy-MM-dd')
    })
  }

  const handleExportarCSV = () => {
    // Criar cabeçalho do CSV
    const cabecalho = ['Descrição', 'Categoria', 'Fornecedor', 'Data', 'Valor', 'Forma de Pagamento', 'Tipo', 'Observações'].join(';')
    
    // Criar linhas do CSV
    const linhas = filteredDespesas.map(despesa => {
      return [
        despesa.descricao,
        despesa.categoria_nome || '',
        despesa.fornecedor_nome || '',
        despesa.data_pagamento !== '-' ? formatDate(despesa.data_pagamento) : '-',
        despesa.valor.toString().replace('.', ','),
        despesa.forma_pagamento,
        despesa.tipo === 'fixa' ? 'Fixa' : 'Diversa',
        despesa.observacoes || ''
      ].join(';')
    })
    
    // Combinar cabeçalho e linhas
    const csv = [cabecalho, ...linhas].join('\n')
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `extrato-despesas-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrar despesas pelo termo de busca, categoria, fornecedor e tipo
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (despesa.observacoes || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategoria = filtroCategoria === null || despesa.categoria_id === filtroCategoria
    
    const matchesFornecedor = filtroFornecedor === null || despesa.fornecedor_id === filtroFornecedor
    
    const matchesTipo = filtroTipo === 'todos' || despesa.tipo === filtroTipo
    
    return matchesSearch && matchesCategoria && matchesFornecedor && matchesTipo
  })

  // Paginação
  const paginatedDespesas = filteredDespesas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Formatar valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Calcular total das despesas filtradas
  const totalDespesas = filteredDespesas.reduce((acc, despesa) => acc + despesa.valor, 0)

  // Calcular total por tipo
  const totalPorTipo = {
    fixa: filteredDespesas
      .filter(despesa => despesa.tipo === 'fixa')
      .reduce((acc, despesa) => acc + despesa.valor, 0),
    diversa: filteredDespesas
      .filter(despesa => despesa.tipo === 'diversa')
      .reduce((acc, despesa) => acc + despesa.valor, 0)
  }

  // Dados para o gráfico de pizza (categorias)
  const pieChartData = {
    labels: despesasPorCategoria.map(item => item.categoria_nome),
    datasets: [
      {
        data: despesasPorCategoria.map(item => item.total),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F94144',
          '#F3722C', '#F8961E', '#F9C74F', '#90BE6D', '#43AA8B'
        ],
        borderWidth: 1
      }
    ]
  }

  // Dados para o gráfico de barras (fornecedores)
  const barChartData = {
    labels: despesasPorFornecedor.map(item => item.fornecedor_nome),
    datasets: [
      {
        label: 'Total por Fornecedor',
        data: despesasPorFornecedor.map(item => item.total),
        backgroundColor: '#36A2EB',
        borderColor: '#2980B9',
        borderWidth: 1
      }
    ]
  }

  // Opções para o gráfico de barras
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Extrato de Despesas
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Buscar"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="filtro-tipo-label">Tipo</InputLabel>
            <Select
              labelId="filtro-tipo-label"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              label="Tipo"
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="fixa">Fixa</MenuItem>
              <MenuItem value="diversa">Diversa</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            size="small"
            options={categorias}
            getOptionLabel={(option) => option.nome}
            value={categorias.find(c => c.id === filtroCategoria) || null}
            onChange={(_event, newValue) => setFiltroCategoria(newValue?.id || null)}
            renderInput={(params) => <TextField {...params} label="Categoria" />}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            size="small"
            options={fornecedores}
            getOptionLabel={(option) => option.nome}
            value={fornecedores.find(f => f.id === filtroFornecedor) || null}
            onChange={(_event, newValue) => setFiltroFornecedor(newValue?.id || null)}
            renderInput={(params) => <TextField {...params} label="Fornecedor" />}
            sx={{ minWidth: 200 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleMesAnterior}
          >
            Mês Anterior
          </Button>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
            {format(new Date(filtroPeriodo.inicio), 'MMMM yyyy', { locale: ptBR })}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleProximoMes}
          >
            Próximo Mês
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportarCSV}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {/* Resumo dos valores */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: theme => theme.palette.background.default }}>
            <Typography variant="subtitle2" color="textSecondary">Total Geral</Typography>
            <Typography variant="h6">{formatCurrency(totalDespesas)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: theme => theme.palette.primary.light }}>
            <Typography variant="subtitle2" color="textSecondary">Despesas Fixas</Typography>
            <Typography variant="h6">{formatCurrency(totalPorTipo.fixa)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: theme => theme.palette.secondary.light }}>
            <Typography variant="subtitle2" color="textSecondary">Despesas Diversas</Typography>
            <Typography variant="h6">{formatCurrency(totalPorTipo.diversa)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Despesas por Categoria
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie data={pieChartData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 10 Fornecedores
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={barChartData} options={barChartOptions as any} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 450px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell align="center">Data</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Forma de Pagamento</TableCell>
                    <TableCell align="center">Tipo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDespesas.length > 0 ? (
                    paginatedDespesas.map((despesa, index) => (
                      <TableRow key={`${despesa.id}-${despesa.tipo}-${index}`} hover>
                        <TableCell>{despesa.descricao}</TableCell>
                        <TableCell>{despesa.categoria_nome}</TableCell>
                        <TableCell>{despesa.fornecedor_nome || '-'}</TableCell>
                        <TableCell align="center">
                          {despesa.data_pagamento !== '-' ? formatDate(despesa.data_pagamento) : '-'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(despesa.valor)}</TableCell>
                        <TableCell>{despesa.forma_pagamento}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={despesa.tipo === 'fixa' ? 'Fixa' : 'Diversa'} 
                            color={despesa.tipo === 'fixa' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Nenhuma despesa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredDespesas.length}
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

      {/* Detalhes por categoria */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Detalhamento por Categoria
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell align="right">% do Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {despesasPorCategoria.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>{item.categoria_nome}</TableCell>
                  <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                  <TableCell align="right">
                    {totalDespesas > 0 ? `${((item.total / totalDespesas) * 100).toFixed(2)}%` : '0%'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}