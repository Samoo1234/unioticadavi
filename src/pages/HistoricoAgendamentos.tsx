import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Grid,
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
  Pagination,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/services/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Filial {
  id: number;
  nome: string;
  ativa: boolean;
}

interface Agendamento {
  id: number;
  cliente_id: number | null;
  medico_id: number | null;
  filial_id: number | null;
  data_hora: string;
  status: string;
  tipo_consulta: string | null;
  observacoes: string | null;
  valor: number | null;
  forma_pagamento: string | null;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  cliente?: {
    nome: string;
    telefone: string | null;
  };
  medico?: {
    nome: string;
  };
  filial?: {
    nome: string;
  };
}

interface Filtros {
  dataInicio: Date | null;
  dataFim: Date | null;
  filialId: string;
  status: string;
  busca: string;
}

const HistoricoAgendamentos: React.FC = () => {

  const [agendamentosFiltrados, setAgendamentosFiltrados] = useState<Agendamento[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos filtros
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: null,
    dataFim: null,
    filialId: '',
    status: '',
    busca: ''
  });
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [itensAtuais, setItensAtuais] = useState<Agendamento[]>([]);

  // Carregar filiais
  const carregarFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome, ativa')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setFiliais(data || []);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
      setError('Erro ao carregar lista de filiais');
    }
  };

  // Carregar agendamentos históricos
  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:clientes(nome, telefone),
          medico:medicos(nome),
          filial:filiais(nome)
        `)
        .order('data_hora', { ascending: false });

      // Aplicar filtros
      if (filtros.dataInicio) {
        query = query.gte('data_hora', filtros.dataInicio.toISOString());
      }

      if (filtros.dataFim) {
        const dataFimFinal = new Date(filtros.dataFim);
        dataFimFinal.setHours(23, 59, 59, 999);
        query = query.lte('data_hora', dataFimFinal.toISOString());
      }

      if (filtros.filialId) {
        query = query.eq('filial_id', parseInt(filtros.filialId));
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      let agendamentosProcessados = data || [];

      // Aplicar filtro de busca por nome ou telefone
      if (filtros.busca) {
        const termoBusca = filtros.busca.toLowerCase();
        agendamentosProcessados = agendamentosProcessados.filter(agendamento => {
          const nomeCliente = agendamento.cliente?.nome?.toLowerCase() || '';
          const telefoneCliente = agendamento.cliente?.telefone?.toLowerCase() || '';
          return nomeCliente.includes(termoBusca) || telefoneCliente.includes(termoBusca);
        });
      }

      setAgendamentosFiltrados(agendamentosProcessados);
      atualizarPaginacao(agendamentosProcessados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setError('Erro ao carregar histórico de agendamentos');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar paginação
  const atualizarPaginacao = (dados: Agendamento[]) => {
    const totalPags = Math.ceil(dados.length / itensPorPagina);
    setTotalPaginas(totalPags);
    
    const indiceUltimoItem = paginaAtual * itensPorPagina;
    const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
    setItensAtuais(dados.slice(indicePrimeiroItem, indiceUltimoItem));
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    carregarAgendamentos();
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: null,
      dataFim: null,
      filialId: '',
      status: '',
      busca: ''
    });
    setPaginaAtual(1);
    setTimeout(() => {
      carregarAgendamentos();
    }, 100);
  };

  // Mudar página
  const handleMudancaPagina = (_event: React.ChangeEvent<unknown>, novaPagina: number) => {
    setPaginaAtual(novaPagina);
    
    const indiceUltimoItem = novaPagina * itensPorPagina;
    const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
    setItensAtuais(agendamentosFiltrados.slice(indicePrimeiroItem, indiceUltimoItem));
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatar horário
  const formatarHorario = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Obter cor do status
  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'warning';
      case 'confirmado':
        return 'success';
      case 'concluido':
        return 'info';
      case 'cancelado':
        return 'error';
      case 'remarcado':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Obter texto do status
  const obterTextoStatus = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'Agendado';
      case 'confirmado':
        return 'Confirmado';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'remarcado':
        return 'Remarcado';
      default:
        return status;
    }
  };

  // Gerar PDF
  const gerarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text('Histórico de Agendamentos', 14, 22);
      
      // Informações dos filtros
      doc.setFontSize(10);
      let yPos = 30;
      
      if (filtros.dataInicio || filtros.dataFim) {
        let textoData = 'Período: ';
        if (filtros.dataInicio) textoData += formatarData(filtros.dataInicio.toISOString());
        if (filtros.dataInicio && filtros.dataFim) textoData += ' até ';
        if (filtros.dataFim) textoData += formatarData(filtros.dataFim.toISOString());
        doc.text(textoData, 14, yPos);
        yPos += 6;
      }
      
      if (filtros.filialId) {
        const filialNome = filiais.find(f => f.id === parseInt(filtros.filialId))?.nome || filtros.filialId;
        doc.text(`Filial: ${filialNome}`, 14, yPos);
        yPos += 6;
      }
      
      if (filtros.status) {
        doc.text(`Status: ${obterTextoStatus(filtros.status)}`, 14, yPos);
        yPos += 6;
      }
      
      if (filtros.busca) {
        doc.text(`Busca: ${filtros.busca}`, 14, yPos);
        yPos += 6;
      }
      
      doc.text(`Total de agendamentos: ${agendamentosFiltrados.length}`, 14, yPos);
      yPos += 10;
      
      // Preparar dados da tabela
      const colunas = ["Nome", "Telefone", "Filial", "Data", "Horário", "Status", "Observações"];
      const linhas: string[][] = [];
      
      agendamentosFiltrados.forEach(agendamento => {
        const linha = [
          agendamento.cliente?.nome || '',
          agendamento.cliente?.telefone || '',
          agendamento.filial?.nome || '',
          formatarData(agendamento.data_hora),
          formatarHorario(agendamento.data_hora),
          obterTextoStatus(agendamento.status),
          agendamento.observacoes || ''
        ];
        linhas.push(linha);
      });
      
      // Adicionar tabela
      (doc as any).autoTable({
        head: [colunas],
        body: linhas,
        startY: yPos,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 0, 128] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 10 }
      });
      
      // Rodapé
      const dataGeracao = new Date().toLocaleString('pt-BR');
      const totalPaginas = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Gerado em: ${dataGeracao}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${totalPaginas}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }
      
      // Salvar
      doc.save(`historico_agendamentos_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError('Erro ao gerar PDF');
    }
  };

  // Efeitos
  useEffect(() => {
    carregarFiliais();
    carregarAgendamentos();
  }, []);

  useEffect(() => {
    if (agendamentosFiltrados.length > 0) {
      const indiceUltimoItem = paginaAtual * itensPorPagina;
      const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
      setItensAtuais(agendamentosFiltrados.slice(indicePrimeiroItem, indiceUltimoItem));
    }
  }, [paginaAtual, agendamentosFiltrados]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Histórico de Agendamentos
          </Typography>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={gerarPDF}
            sx={{ backgroundColor: '#28a745' }}
          >
            Exportar PDF
          </Button>
        </Box>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={2} alignItems="center">
              {/* Período */}
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Data Inicial"
                  value={filtros.dataInicio}
                  onChange={(novaData) => setFiltros(prev => ({ ...prev, dataInicio: novaData }))}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Data Final"
                  value={filtros.dataFim}
                  onChange={(novaData) => setFiltros(prev => ({ ...prev, dataFim: novaData }))}
                  format="dd/MM/yyyy"
                  minDate={filtros.dataInicio}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small'
                    }
                  }}
                />
              </Grid>

              {/* Filial */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filial</InputLabel>
                  <Select
                    value={filtros.filialId}
                    label="Filial"
                    onChange={(e) => setFiltros(prev => ({ ...prev, filialId: e.target.value }))}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {filiais.map((filial) => (
                      <MenuItem key={filial.id} value={filial.id.toString()}>
                        {filial.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filtros.status}
                    label="Status"
                    onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="agendado">Agendado</MenuItem>
                    <MenuItem value="confirmado">Confirmado</MenuItem>
                    <MenuItem value="em_andamento">Em Andamento</MenuItem>
                    <MenuItem value="concluido">Concluído</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                    <MenuItem value="remarcado">Remarcado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Busca */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar"
                  placeholder="Nome ou telefone"
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>

            {/* Botões de ação */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={aplicarFiltros}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={limparFiltros}
              >
                Limpar Filtros
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Mensagens de erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Contador */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Total de agendamentos: <Chip label={agendamentosFiltrados.length} size="small" color="primary" />
              </Typography>
            </Box>

            {/* Tabela */}
            {agendamentosFiltrados.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum agendamento encontrado para os filtros selecionados.
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Telefone</TableCell>
                        <TableCell>Filial</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Horário</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Observações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itensAtuais.map((agendamento) => (
                        <TableRow key={agendamento.id}>
                          <TableCell>{agendamento.cliente?.nome || ''}</TableCell>
                          <TableCell>{agendamento.cliente?.telefone || ''}</TableCell>
                          <TableCell>{agendamento.filial?.nome || ''}</TableCell>
                          <TableCell>{formatarData(agendamento.data_hora)}</TableCell>
                          <TableCell>{formatarHorario(agendamento.data_hora)}</TableCell>
                          <TableCell>
                            <Chip
                              label={obterTextoStatus(agendamento.status)}
                              color={obterCorStatus(agendamento.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{agendamento.observacoes || ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPaginas}
                      page={paginaAtual}
                      onChange={handleMudancaPagina}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default HistoricoAgendamentos;