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
  CardContent
} from '@mui/material'
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material'
import jsPDF from 'jspdf'
import { supabase } from '../../services/supabase'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler)

interface Categoria {
  id: number
  nome: string
}


interface Filial {
  id: number
  nome: string
  ativa: boolean
}

interface Despesa {
  id: number
  descricao: string
  valor: number
  data_pagamento: string
  categoria_id: number
  categoria_nome?: string
  forma_pagamento: string
  tipo: 'fixa' | 'diversa'
  filial_id?: number
  filial_nome?: string
  observacoes?: string
}

interface DespesaPorCategoria {
  categoria_nome: string
  total: number
}


export default function ExtratoDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroFilial, setFiltroFilial] = useState<number | null>(null)
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [filtroPeriodo, setFiltroPeriodo] = useState<{inicio: string, fim: string}>({
    inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fim: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<DespesaPorCategoria[]>([])
  
  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      const parsedDate = new Date(dateString);

      if (isNaN(parsedDate.getTime())) {
        console.error('Data inválida:', dateString);
        return dateString;
      }
      
      return format(parsedDate, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  // Função para filtrar despesas com base nos critérios selecionados
  const handleFilterDespesas = (despesa: Despesa) => {
    // Filtro de texto (busca em descrição, observações, categoria)
    const textMatch = searchTerm ? 
      (despesa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.categoria_nome?.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    
    // Filtro de categoria
    const categoriaMatch = filtroCategoria !== null ? despesa.categoria_id === filtroCategoria : true;
    
    
    // Filtro de forma de pagamento
    const formaPagamentoMatch = filtroFormaPagamento ? despesa.forma_pagamento === filtroFormaPagamento : true;
    
    // Filtro de tipo de despesa
    const tipoMatch = filtroTipo !== 'todos' ? despesa.tipo === filtroTipo : true;
    
    // Filtro de filial
    const filialMatch = filtroFilial !== null ? despesa.filial_id === filtroFilial : true;
    
    // Filtro de data removido - já aplicado na busca do banco
    const dataMatch = true;
    
    return textMatch && categoriaMatch && formaPagamentoMatch && tipoMatch && filialMatch && dataMatch;
  };

  // Obter despesas filtradas
  const despesasFiltradas = despesas.filter(handleFilterDespesas);
  
  // Calcular totais
  const totalDespesas = despesasFiltradas.reduce((acc, despesa) => acc + despesa.valor, 0);
  
  const totalPorTipo = despesasFiltradas.reduce((acc, despesa) => {
    acc[despesa.tipo] = (acc[despesa.tipo] || 0) + despesa.valor;
    return acc;
  }, { fixa: 0, diversa: 0 } as Record<string, number>);

  // Paginação das despesas filtradas
  const paginatedDespesas = despesasFiltradas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Carregar dados iniciais
  useEffect(() => {
    fetchDespesas()
    fetchCategorias()
    fetchFiliais()
  }, [filtroPeriodo, filtroFilial])

  // Calcular estatísticas quando as despesas mudarem
  useEffect(() => {
    calcularDespesasPorCategoria()
  }, [despesas])

  const fetchDespesas = async () => {
    try {
      setLoading(true)

      // Buscar despesas fixas
      let query = supabase
        .from('despesas_fixas')
        .select(`
          id,
          nome,
          valor,
          categoria_id,
          forma_pagamento,
          observacoes,
          filial_id
        `)
        .eq('status', 'ativo')

      if (filtroFilial !== null) {
        query = query.eq('filial_id', filtroFilial)
      }

      const { data: despesasFixas, error: errorFixas } = await query

      if (errorFixas) throw errorFixas

      // Extrair o ano e mês do período selecionado para garantir a busca correta
      const dataInicio = new Date(filtroPeriodo.inicio)
      const dataFim = new Date(filtroPeriodo.fim)

      const anoInicio = dataInicio.getFullYear()
      const mesInicio = dataInicio.getMonth() + 1 // JavaScript meses são 0-11
      const anoFim = dataFim.getFullYear()
      const mesFim = dataFim.getMonth() + 1

      // Formatar as datas para incluir o primeiro e último dia do mês completo
      // Formatando no padrão ISO para garantir compatibilidade com Supabase
      const inicioPeriodo = `${anoInicio}-${mesInicio.toString().padStart(2, '0')}-01`
      // Último dia do mês
      const ultimoDiaMes = new Date(anoFim, mesFim, 0).getDate()
      const fimPeriodo = `${anoFim}-${mesFim.toString().padStart(2, '0')}-${ultimoDiaMes.toString().padStart(2, '0')}`
      
      // Período de busca formatado para o banco de dados

      // Buscar despesas diversas com o período ajustado

      let queryDiversas = supabase
        .from('despesas_diversas')
        .select(`
          id,
          descricao,
          nome,
          valor,
          data_despesa,
          data_pagamento,
          categoria_id,
          forma_pagamento,
          observacoes,
          filial_id
        `)
        .gte('data_despesa', inicioPeriodo) // Primeiro dia do mês
        .lte('data_despesa', fimPeriodo)    // Último dia do mês

      if (filtroFilial !== null) {
        queryDiversas = queryDiversas.eq('filial_id', filtroFilial)
      }

      const { data: despesasDiversas, error: errorDiversas } = await queryDiversas

      if (errorDiversas) throw errorDiversas
      
      // Processar despesas diversas encontradas

      // Obter os IDs de categorias e filiais das despesas fixas para buscar os nomes depois
      const categoriaIds = despesasFixas?.map(item => item.categoria_id).filter(Boolean) || []
      const filialIdsFixas = despesasFixas?.map(item => item.filial_id).filter(Boolean) || []
      
      // Buscar os nomes das categorias
      let categoriasData: Array<{id: number, nome: string}> = [];
      if (categoriaIds.length > 0) {
        const { data, error } = await supabase
          .from('categorias_despesas')
          .select('id, nome')
          .in('id', categoriaIds)
        
        if (error) throw error
        categoriasData = data || []
      }
        
      // Buscar nomes das filiais
      let filiaisData: Array<{id: number, nome: string}> = [];
      if (filialIdsFixas.length > 0) {
        const { data, error } = await supabase
          .from('filiais')
          .select('id, nome')
          .in('id', filialIdsFixas)
        
        if (error) throw error
        filiaisData = data || []
      }
      
      // Criar um mapa de ID -> nome para as categorias e filiais
      const categoriasMap = (categoriasData || []).reduce((map, categoria) => {
        map[categoria.id] = categoria.nome
        return map
      }, {} as Record<number, string>)
      
      const filiaisMap = (filiaisData || []).reduce((map, filial) => {
        map[filial.id] = filial.nome
        return map
      }, {} as Record<number, string>)
      
      // Formatar despesas fixas
      const formattedFixas = despesasFixas?.map(item => ({
        id: item.id,
        descricao: item.nome || 'Sem descrição',
        valor: item.valor,
        data_pagamento: '-', // Despesas fixas não têm data de pagamento específica
        categoria_id: item.categoria_id,
        categoria_nome: categoriasMap[item.categoria_id] || 'Categoria não encontrada',
        forma_pagamento: item.forma_pagamento,
        tipo: 'fixa' as 'fixa',
        filial_id: item.filial_id,
        filial_nome: filiaisMap[item.filial_id] || 'Filial não encontrada',
        observacoes: item.observacoes
      })) || []

      // Obter os IDs de categorias e filiais das despesas diversas
      const categoriaIdsDiversas = despesasDiversas?.map(item => item.categoria_id).filter(Boolean) || []
      const filialIdsDiversas = despesasDiversas?.map(item => item.filial_id).filter(Boolean) || []
      
      // Buscar os nomes das categorias para despesas diversas
      let categoriasDiversasData: Array<{id: number, nome: string}> = [];
      if (categoriaIdsDiversas.length > 0) {
        const { data, error } = await supabase
          .from('categorias_despesas')
          .select('id, nome')
          .in('id', categoriaIdsDiversas)
        
        if (error) throw error
        categoriasDiversasData = data || []
      }
        
      // Não precisamos buscar fornecedores para despesas diversas neste caso
        
      // Atualizar lista de filiais com as das despesas diversas
      const allFilialIds = [...new Set([...filialIdsFixas, ...filialIdsDiversas])]
      
      // Se temos novas filiais para buscar que não foram buscadas anteriormente
      if (filialIdsDiversas.some(id => !filialIdsFixas.includes(id))) {
        let filialDiversasData: Array<{id: number, nome: string}> = [];
        if (allFilialIds.length > 0) {
          const { data, error } = await supabase
            .from('filiais')
            .select('id, nome')
            .in('id', allFilialIds)
          
          if (error) throw error
          filialDiversasData = data || []
        }
          
        // Atualizar o mapa de filiais
        filialDiversasData?.forEach(filial => {
          filiaisMap[filial.id] = filial.nome
        })
      }
      
      // Criar mapas de ID -> nome
      const categoriasDiversasMap = (categoriasDiversasData || []).reduce((map, categoria) => {
        map[categoria.id] = categoria.nome
        return map
      }, {} as Record<number, string>)
      
      // Formatar despesas diversas
      const formattedDiversas = despesasDiversas?.map(item => ({
        id: item.id,
        descricao: item.descricao || item.nome || 'Sem descrição',
        valor: item.valor,
        data_pagamento: item.data_despesa,
        categoria_id: item.categoria_id,
        categoria_nome: categoriasDiversasMap[item.categoria_id] || 'Categoria não encontrada',
        forma_pagamento: item.forma_pagamento,
        tipo: 'diversa' as 'diversa',
        filial_id: item.filial_id,
        filial_nome: filiaisMap[item.filial_id] || 'Filial não encontrada',
        observacoes: item.observacoes
      })) || []

      // Combinar os dois tipos de despesas
      setDespesas([...formattedDiversas, ...formattedFixas])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar despesas'
      setError(errorMessage)
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
    } catch (error: unknown) {
      // Erro silencioso para não interromper o fluxo
    }
  }


  const fetchFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome, ativa')
        .eq('ativa', true)
        .order('nome', { ascending: true })

      if (error) throw error
      setFiliais(data || [])
    } catch (error: unknown) {
      // Erro silencioso para não interromper o fluxo
    }
  }

  const calcularDespesasPorCategoria = () => {
    const despesasPorCat: Record<string, number> = {}
    
    despesas.filter(handleFilterDespesas).forEach(despesa => {
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


  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleMesAnterior = () => {
    try {
      // Converter a string de data para objeto Date de forma mais segura
      const [ano, mes, dia] = filtroPeriodo.inicio.split('-').map(Number)
      const dataInicio = new Date(ano, mes - 1, dia) // Mês em JavaScript começa do 0
      
      // Retroceder para o mês anterior
      const novaDataInicio = startOfMonth(subMonths(dataInicio, 1))
      const novaDataFim = endOfMonth(novaDataInicio)
      
      setFiltroPeriodo({
        inicio: format(novaDataInicio, 'yyyy-MM-dd'),
        fim: format(novaDataFim, 'yyyy-MM-dd')
      })
      
      // Navegação para mês anterior realizada
    } catch (error) {
      // Erro ao navegar para mês anterior
    }
  }

  const handleProximoMes = () => {
    try {
      // Converter a string de data para objeto Date de forma mais segura
      const [ano, mes, dia] = filtroPeriodo.inicio.split('-').map(Number)
      const dataInicio = new Date(ano, mes - 1, dia) // Mês em JavaScript começa do 0
      
      // Avançar para o próximo mês
      const novaDataInicio = startOfMonth(addMonths(dataInicio, 1))
      const novaDataFim = endOfMonth(novaDataInicio)
      
      setFiltroPeriodo({
        inicio: format(novaDataInicio, 'yyyy-MM-dd'),
        fim: format(novaDataFim, 'yyyy-MM-dd')
      })
      
      // Navegação para próximo mês realizada
    } catch (error) {
      // Erro ao navegar para próximo mês
    }
  }


  // Função para visualizar os resultados (rola para a tabela)
  const handleVisualizarResultados = () => {
    const tabelaElement = document.querySelector('#tabela-resultados')
    if (tabelaElement) {
      tabelaElement.scrollIntoView({ behavior: 'smooth' })
    }
    setRowsPerPage(25)
    setPage(0)
  }

  // Função para gerar PDF dos resultados
  const handleGerarPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const dataAtual = new Date();
      const dataFormatada = format(dataAtual, "dd/MM/yyyy 'às' HH:mm");
      
      // Título do relatório
      doc.setFontSize(18);
      doc.text('RELATÓRIO DE DESPESAS', 149, 15, { align: 'center' });
      
      // Subtítulo com o período
      doc.setFontSize(12);
      doc.text(
        `Período: ${format(new Date(filtroPeriodo.inicio), 'dd/MM/yyyy')} a ${format(new Date(filtroPeriodo.fim), 'dd/MM/yyyy')}`,
        149, 22, { align: 'center' }
      );
      
      // Informações dos filtros aplicados
      doc.setFontSize(10);
      let filtrosTexto = 'Filtros aplicados: ';
      
      if (filtroCategoria !== null) {
        const categoria = categorias.find(c => c.id === filtroCategoria);
        if (categoria) {
          filtrosTexto += `Categoria: ${categoria.nome}, `;
        }
      }
      
      if (filtroFilial !== null) {
        const filial = filiais.find(f => f.id === filtroFilial);
        if (filial) {
          filtrosTexto += `Filial: ${filial.nome}, `;
        }
      }
      
      if (filtroFormaPagamento) {
        filtrosTexto += `Forma de Pagamento: ${filtroFormaPagamento}, `;
      }
      
      
      // Remover a última vírgula e espaço se houver filtros
      if (filtrosTexto !== 'Filtros aplicados: ') {
        filtrosTexto = filtrosTexto.slice(0, -2);
      } else {
        filtrosTexto += 'Nenhum';
      }
      
      doc.text(filtrosTexto, 15, 30);
      
      // Tabela com os dados usando jsPDF nativo
      let startY = 40;
      const lineHeight = 7;
      const colWidths = [40, 30, 30, 25, 20, 20, 30, 20];
      const margin = 15;
      
      // Cabeçalho da tabela
      doc.setFillColor(0, 123, 255);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.rect(margin, startY, 267, lineHeight, 'F');
      
      let xPos = margin;
      const headers = ['Descrição', 'Categoria', 'Filial', 'Data', 'Valor', 'Forma de Pagamento', 'Tipo'];
      
      headers.forEach((header, i) => {
        doc.text(header, xPos + 3, startY + 5);
        xPos += colWidths[i];
      });
      
      startY += lineHeight;
      
      // Conteúdo da tabela
      doc.setTextColor(0, 0, 0);
      
      // Limitar o número de linhas para não ultrapassar o tamanho da página
      const maxRows = 20; 
      const totalPages = Math.ceil(despesasFiltradas.length / maxRows);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          doc.addPage();
          startY = 15;
          
          // Redesenhar o cabeçalho da tabela em novas páginas
          doc.setFillColor(0, 123, 255);
          doc.setTextColor(255, 255, 255);
          doc.rect(margin, startY, 267, lineHeight, 'F');
          
          xPos = margin;
          headers.forEach((header, i) => {
            doc.text(header, xPos + 3, startY + 5);
            xPos += colWidths[i];
          });
          
          doc.setTextColor(0, 0, 0);
          startY += lineHeight;
        }
        
        const start = page * maxRows;
        const end = Math.min(start + maxRows, despesasFiltradas.length);
        
        for (let i = start; i < end; i++) {
          const despesa = despesasFiltradas[i];
          const isGray = i % 2 === 1;
          
          if (isGray) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, startY, 267, lineHeight, 'F');
          }
          
          xPos = margin;
          
          // Descrição
          doc.text(despesa.descricao?.substring(0, 18) || 'N/A', xPos + 3, startY + 5);
          xPos += colWidths[0];
          
          // Categoria
          doc.text(despesa.categoria_nome?.substring(0, 15) || 'N/A', xPos + 3, startY + 5);
          xPos += colWidths[1];
          
          
          // Filial
          doc.text(despesa.filial_nome?.substring(0, 12) || 'N/A', xPos + 3, startY + 5);
          xPos += colWidths[3];
          
          // Data
          const dataTexto = despesa.data_pagamento !== '-' ? formatDate(despesa.data_pagamento) : '-';
          doc.text(dataTexto, xPos + 3, startY + 5);
          xPos += colWidths[4];
          
          // Valor
          doc.text(formatCurrency(despesa.valor), xPos + 3, startY + 5);
          xPos += colWidths[5];
          
          // Forma de Pagamento
          doc.text(despesa.forma_pagamento?.substring(0, 15) || 'N/A', xPos + 3, startY + 5);
          xPos += colWidths[6];
          
          // Tipo
          doc.text(despesa.tipo === 'fixa' ? 'Fixa' : 'Diversa', xPos + 3, startY + 5);
          
          startY += lineHeight;
        }
      }
      
      // Resumo financeiro
      let finalY = startY + 10;
      doc.setFontSize(14);
      doc.text('Resumo Financeiro', 15, finalY);
      doc.setFontSize(10);
      doc.text(`Total de Despesas: ${despesasFiltradas.length}`, 15, finalY + 8);
      doc.text(`Valor Total: ${formatCurrency(totalDespesas)}`, 15, finalY + 15);

      // Resumo por categorias
      doc.setFontSize(12);
      doc.text('Detalhamento por Categoria', 15, finalY + 25);
      doc.setFontSize(10);

      let yPos = finalY + 35;
      const categoriasPorPagina = 20;
      // Listar as principais categorias
      for (let i = 0; i < despesasPorCategoria.length; i++) {
        const item = despesasPorCategoria[i];

        if (i > 0 && i % categoriasPorPagina === 0) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`${item.categoria_nome}: ${formatCurrency(item.total)}`, 15, yPos);
        yPos += 7;
      }
      
      // Rodapé com data e número de página
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Gerado em ${dataFormatada} - Página ${i} de ${totalPages}`,
          149, 
          200, 
          { align: 'center' }
        );
      }

      // Salvar o PDF
      doc.save(`Extrato_Despesas_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.pdf`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao gerar PDF: ' + errorMessage);
    }
  }

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
            options={filiais}
            getOptionLabel={(option) => option.nome}
            value={filiais.find(f => f.id === filtroFilial) || null}
            onChange={(_event, newValue) => setFiltroFilial(newValue?.id || null)}
            renderInput={(params) => <TextField {...params} label="Filial" />}
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
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={handleVisualizarResultados}
            sx={{ mr: 1 }}
          >
            Visualizar Resultados
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGerarPDF}
            sx={{ mr: 1 }}
          >
            Gerar PDF
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
              <Table stickyHeader id="tabela-resultados">
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Filial</TableCell>
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
                        <TableCell>{despesa.filial_nome || 'N/A'}</TableCell>
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
              count={despesasFiltradas.length}
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