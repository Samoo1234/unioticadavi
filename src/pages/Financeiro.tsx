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

  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { supabase } from '@/services/supabase';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Filial {
  id: string;
  nome: string;
  ativa: boolean;
}

interface DataDisponivel {
  id: string;
  data: string;
  cidade: string;
  dia_semana?: string;
}

interface Agendamento {
  id: string;
  cliente?: string;
  paciente?: string;
  nome?: string;
  valor?: string;
  horario?: string;
  cidade: string;
  data: string;
}

interface FormaPagamento {
  formaPagamento: string;
  valor: string;
}

interface RegistroFinanceiro {
  id: string;
  agendamentoId?: string;
  cliente: string;
  valor: string;
  tipo: string;
  formaPagamento?: string;
  formasPagamento?: FormaPagamento[];
  situacao: string;
  observacoes: string;
  cidadeId: string;
  dataId: string;
  novo?: boolean;
  editando?: boolean;
}

interface Estatisticas {
  totalParticular: number;
  totalConvenio: number;
  totalCampanha: number;
  totalExames: number;
  totalRevisao: number;
  totalGeral: number;
  countParticular: number;
  countConvenio: number;
  countCampanha: number;
  countExames: number;
  countRevisao: number;
  countTotal: number;
  countDinheiro: number;
  countCartao: number;
  countPix: number;
  totalDinheiro: number;
  totalCartao: number;
  totalPix: number;
}

const Financeiro: React.FC = () => {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [cidadeSelecionada, setCidadeSelecionada] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [datas, setDatas] = useState<DataDisponivel[]>([]);
  const [datasFiltradasPorCidade, setDatasFiltradasPorCidade] = useState<DataDisponivel[]>([]);
  const [registrosFinanceiros, setRegistrosFinanceiros] = useState<RegistroFinanceiro[]>([]);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalParticular: 0,
    totalConvenio: 0,
    totalCampanha: 0,
    totalExames: 0,
    totalRevisao: 0,
    totalGeral: 0,
    countParticular: 0,
    countConvenio: 0,
    countCampanha: 0,
    countExames: 0,
    countRevisao: 0,
    countTotal: 0,
    countDinheiro: 0,
    countCartao: 0,
    countPix: 0,
    totalDinheiro: 0,
    totalCartao: 0,
    totalPix: 0
  });
  const [pagamentosDivididos, setPagamentosDivididos] = useState<Record<string, FormaPagamento[]>>({});

  // Carregar cidades e datas disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);

        // Carregar filiais
        const { data: filiaisData, error: filiaisError } = await supabase
          .from('filiais')
          .select('*')
          .eq('ativa', true)
          .order('nome');

        if (filiaisError) {
          console.error('Erro ao carregar filiais:', filiaisError);
        } else {
          setFiliais(filiaisData?.map(filial => ({
            id: filial.id.toString(),
            nome: filial.nome,
            ativa: filial.ativa
          })) || []);
        }

        // Carregar datas disponíveis
        const { data: datasData, error: datasError } = await supabase
          .from('datas_disponiveis')
          .select('*')
          .order('data');

        if (datasError) {
          console.error('Erro ao carregar datas:', datasError);
        } else {
          setDatas(datasData?.map(data => ({
            id: data.id.toString(),
            data: data.data,
            cidade: data.cidade || '',
            dia_semana: data.dia_semana
          })) || []);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, []);

  // Filtrar datas por filial
  useEffect(() => {
    if (!cidadeSelecionada || datas.length === 0 || filiais.length === 0) {
      setDatasFiltradasPorCidade([]);
      return;
    }
    
    const filialSelecionadaObj = filiais.find(filial => filial.id === cidadeSelecionada);
    if (!filialSelecionadaObj) {
      setDatasFiltradasPorCidade([]);
      return;
    }
    
    const nomeFilialSelecionada = filialSelecionadaObj.nome;
    const datasFiltradas = datas.filter(data => data.cidade === nomeFilialSelecionada);
    setDatasFiltradasPorCidade(datasFiltradas);
  }, [cidadeSelecionada, datas, filiais]);

  // Função para buscar dados financeiros e agendamentos
  const buscarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!cidadeSelecionada || !dataSelecionada) {
        setIsLoading(false);
        return;
      }
      
      const dataObj = datas.find(d => d.id === dataSelecionada);
      if (!dataObj) {
        console.error('Data selecionada não encontrada');
        setIsLoading(false);
        return;
      }
      
      // Buscar registros financeiros
      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_financeiros')
        .select('*')
        .eq('cidadeId', cidadeSelecionada)
        .eq('dataId', dataSelecionada);

      if (registrosError) {
        console.error('Erro ao buscar registros financeiros:', registrosError);
      }

      const registros: RegistroFinanceiro[] = registrosData?.map(registro => ({
        ...registro,
        editando: false
      })) || [];
      
      setRegistrosFinanceiros(registros);
      
      // Inicializar pagamentos divididos
      const pagamentosTemp: Record<string, FormaPagamento[]> = {};
      registros.forEach(registro => {
        if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
          pagamentosTemp[registro.id] = registro.formasPagamento;
        } else {
          pagamentosTemp[registro.id] = [{
            formaPagamento: registro.formaPagamento || '',
            valor: registro.valor || ''
          }];
        }
      });
      
      setPagamentosDivididos(prev => ({
        ...prev,
        ...pagamentosTemp
      }));
      
      // Buscar agendamentos
      const filialObj = filiais.find(filial => filial.id === cidadeSelecionada);
      if (!filialObj) {
        console.error('Filial selecionada não encontrada');
        setIsLoading(false);
        return;
      }
      
      const dataFormatada = dataObj.data;
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cidade', filialObj.nome)
        .eq('data', dataFormatada);

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
      }

      const agendamentosProcessados: Agendamento[] = agendamentosData || [];
      const registrosDeAgendamentos = [...registros];

      agendamentosProcessados.forEach((agendamento) => {
        const registroExistente = registros.find(r => r.agendamentoId === agendamento.id);

        if (!registroExistente) {
          const novoRegistroId = `novo_${agendamento.id}`;
          
          let nomeCliente = '';
          if (agendamento.paciente) {
            nomeCliente = agendamento.paciente;
          } else if (agendamento.cliente) {
            nomeCliente = agendamento.cliente;
          } else if (agendamento.nome) {
            nomeCliente = agendamento.nome;
          }

          const novoRegistro: RegistroFinanceiro = {
            id: novoRegistroId,
            agendamentoId: agendamento.id,
            cliente: nomeCliente,
            valor: agendamento.valor || '',
            tipo: '',
            formaPagamento: '',
            situacao: '',
            observacoes: '',
            novo: true,
            editando: true,
            cidadeId: cidadeSelecionada,
            dataId: dataSelecionada
          };

          registrosDeAgendamentos.push(novoRegistro);
          pagamentosTemp[novoRegistroId] = [{ formaPagamento: '', valor: agendamento.valor || '' }];
        }
      });


      setRegistrosFinanceiros(registrosDeAgendamentos);
      
      // Atualizar dia da semana
      if (dataObj.data) {
        const [dia, mes, ano] = dataObj.data.split('/').map(Number);
        const dataFormatada = new Date(ano, mes - 1, dia, 12, 0, 0);
        const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });
        const diaSemanaCapitalizado = diaSemanaFormatado.charAt(0).toUpperCase() + diaSemanaFormatado.slice(1);
        setDiaSemana(diaSemanaCapitalizado);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError(`Erro ao buscar dados: ${error}`);
      setIsLoading(false);
    }
  };

  // Função para calcular estatísticas
  const calcularEstatisticas = (registros: RegistroFinanceiro[]) => {
    const stats: Estatisticas = {
      totalParticular: 0,
      totalConvenio: 0,
      totalCampanha: 0,
      totalExames: 0,
      totalRevisao: 0,
      totalGeral: 0,
      countParticular: 0,
      countConvenio: 0,
      countCampanha: 0,
      countExames: 0,
      countRevisao: 0,
      countTotal: 0,
      countDinheiro: 0,
      countCartao: 0,
      countPix: 0,
      totalDinheiro: 0,
      totalCartao: 0,
      totalPix: 0
    };
    
    for (const registro of registros) {
      if (!registro.valor || !registro.tipo) continue;
      
      const valor = parseFloat(registro.valor.replace(',', '.'));
      if (isNaN(valor)) continue;
      
      stats.totalGeral += valor;
      stats.countTotal++;
      
      // Contabilizar por tipo
      switch (registro.tipo.toLowerCase()) {
        case 'particular':
          stats.totalParticular += valor;
          stats.countParticular++;
          break;
        case 'convênio':
        case 'convenio':
          stats.totalConvenio += valor;
          stats.countConvenio++;
          break;
        case 'campanha':
          stats.totalCampanha += valor;
          stats.countCampanha++;
          break;
        case 'exames':
          stats.totalExames += valor;
          stats.countExames++;
          break;
        case 'revisão':
        case 'revisao':
          stats.totalRevisao += valor;
          stats.countRevisao++;
          break;
      }
      
      // Contabilizar por forma de pagamento
      if (registro.formasPagamento && Array.isArray(registro.formasPagamento)) {
        for (const pagamento of registro.formasPagamento) {
          if (!pagamento.formaPagamento || !pagamento.valor) continue;
          
          const valorPagamento = parseFloat(pagamento.valor.replace(',', '.'));
          if (isNaN(valorPagamento)) continue;
          
          switch (pagamento.formaPagamento.toLowerCase()) {
            case 'dinheiro':
              stats.countDinheiro++;
              stats.totalDinheiro += valorPagamento;
              break;
            case 'cartão':
            case 'cartao':
              stats.countCartao++;
              stats.totalCartao += valorPagamento;
              break;
            case 'pix/pic pay':
            case 'pix':
            case 'pic pay':
              stats.countPix++;
              stats.totalPix += valorPagamento;
              break;
          }
        }
      } else {
        switch (registro.formaPagamento?.toLowerCase()) {
          case 'dinheiro':
            stats.countDinheiro++;
            stats.totalDinheiro += valor;
            break;
          case 'cartão':
          case 'cartao':
            stats.countCartao++;
            stats.totalCartao += valor;
            break;
          case 'pix/pic pay':
          case 'pix':
          case 'pic pay':
            stats.countPix++;
            stats.totalPix += valor;
            break;
        }
      }
    }
    
    setEstatisticas(stats);
  };

  // Buscar registros quando cidade ou data mudar
  useEffect(() => {
    if (cidadeSelecionada && dataSelecionada) {
      buscarDados();
    }
  }, [cidadeSelecionada, dataSelecionada]);

  // Calcular estatísticas quando registros mudarem
  useEffect(() => {
    if (registrosFinanceiros && registrosFinanceiros.length > 0) {
      calcularEstatisticas(registrosFinanceiros);
    } else {
      setEstatisticas({
        totalParticular: 0,
        totalConvenio: 0,
        totalCampanha: 0,
        totalExames: 0,
        totalRevisao: 0,
        totalGeral: 0,
        countParticular: 0,
        countConvenio: 0,
        countCampanha: 0,
        countExames: 0,
        countRevisao: 0,
        countTotal: 0,
        countDinheiro: 0,
        countCartao: 0,
        countPix: 0,
        totalDinheiro: 0,
        totalCartao: 0,
        totalPix: 0
      });
    }
  }, [registrosFinanceiros]);

  const handleChangeCidade = (event: any) => {
    const valor = event.target.value;
    setCidadeSelecionada(valor);
    setDataSelecionada('');
    setDiaSemana('');
    setRegistrosFinanceiros([]);

  };

  const handleChangeData = (event: any) => {
    const valor = event.target.value;
    setDataSelecionada(valor);
    
    if (valor) {
      const dataObj = datas.find(d => d.id === valor);
      if (dataObj && dataObj.data) {
        const partes = dataObj.data.split('/');
        const dataFormatada = new Date(
          parseInt(partes[2], 10),
          parseInt(partes[1], 10) - 1,
          parseInt(partes[0], 10),
          12, 0, 0
        );
        const diaSemanaFormatado = dataFormatada.toLocaleString('pt-BR', { weekday: 'long' });
        const diaSemanaCapitalizado = diaSemanaFormatado.charAt(0).toUpperCase() + diaSemanaFormatado.slice(1);
        setDiaSemana(diaSemanaCapitalizado);
      }
    } else {
      setDiaSemana('');
      setRegistrosFinanceiros([]);

    }
  };

  const handleChangeRegistro = (id: string, campo: string, valor: string) => {
    setRegistrosFinanceiros(prev => {
      return prev.map(registro => {
        if (registro.id === id) {
          if (campo === 'valor') {
            const valorLimpo = valor.replace(/[^\d,.]/g, '');
            const valorFormatado = valorLimpo.replace(/\./g, ',').replace(/,/g, ',');
            return { ...registro, [campo]: valorFormatado };
          }
          return { ...registro, [campo]: valor };
        }
        return registro;
      });
    });
  };

  const salvarRegistro = async (registro: RegistroFinanceiro) => {
    try {
      if (registro.novo) {
        // Criar novo registro
        const { error } = await supabase
          .from('registros_financeiros')
          .insert({
            agendamentoId: registro.agendamentoId,
            cliente: registro.cliente,
            valor: registro.valor,
            tipo: registro.tipo,
            formaPagamento: registro.formaPagamento,
            formasPagamento: pagamentosDivididos[registro.id],
            situacao: registro.situacao,
            observacoes: registro.observacoes,
            cidadeId: registro.cidadeId,
            dataId: registro.dataId
          });

        if (error) {
          console.error('Erro ao criar registro:', error);
          setError('Erro ao salvar registro.');
          return;
        }
      } else {
        // Atualizar registro existente
        const { error } = await supabase
          .from('registros_financeiros')
          .update({
            cliente: registro.cliente,
            valor: registro.valor,
            tipo: registro.tipo,
            formaPagamento: registro.formaPagamento,
            formasPagamento: pagamentosDivididos[registro.id],
            situacao: registro.situacao,
            observacoes: registro.observacoes
          })
          .eq('id', registro.id);

        if (error) {
          console.error('Erro ao atualizar registro:', error);
          setError('Erro ao atualizar registro.');
          return;
        }
      }

      // Recarregar dados
      buscarDados();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      setError('Erro ao salvar registro.');
    }
  };

  const excluirRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registros_financeiros')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir registro:', error);
        setError('Erro ao excluir registro.');
        return;
      }

      // Recarregar dados
      buscarDados();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      setError('Erro ao excluir registro.');
    }
  };

  const gerarPDF = () => {
    if (!registrosFinanceiros || registrosFinanceiros.length === 0) {
      alert('Não há registros financeiros para gerar o PDF.');
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const filialSelecionadaObj = filiais.find(filial => filial.id === cidadeSelecionada);
    const nomeFilial = filialSelecionadaObj ? filialSelecionadaObj.nome : 'Desconhecida';
    
    const dataObj = datas.find(d => d.id === dataSelecionada);
    const dataFormatada = dataObj ? dataObj.data : 'Data desconhecida';
    
    doc.setFontSize(18);
    doc.text(`Relatório Financeiro - ${nomeFilial}`, 14, 20);
    doc.setFontSize(14);
    doc.text(`Data: ${dataFormatada} (${diaSemana})`, 14, 30);
    
    // Adicionar estatísticas
    doc.setFontSize(12);
    let yPos = 45;
    doc.text(`Total Geral: R$ ${estatisticas.totalGeral.toFixed(2)}`, 14, yPos);
    yPos += 8;
    doc.text(`Particular: R$ ${estatisticas.totalParticular.toFixed(2)} (${estatisticas.countParticular})`, 14, yPos);
    yPos += 6;
    doc.text(`Convênio: R$ ${estatisticas.totalConvenio.toFixed(2)} (${estatisticas.countConvenio})`, 14, yPos);
    yPos += 6;
    doc.text(`Campanha: R$ ${estatisticas.totalCampanha.toFixed(2)} (${estatisticas.countCampanha})`, 14, yPos);
    
    // Salvar PDF
    doc.save(`relatorio-financeiro-${nomeFilial}-${dataFormatada.replace(/\//g, '-')}.pdf`);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Módulo Financeiro
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filial</InputLabel>
                <Select
                  value={cidadeSelecionada}
                  onChange={handleChangeCidade}
                  label="Filial"
                >
                  <MenuItem value="">
                    <em>Selecione uma filial</em>
                  </MenuItem>
                  {filiais.map((filial) => (
                    <MenuItem key={filial.id} value={filial.id}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!cidadeSelecionada}>
                <InputLabel>Data</InputLabel>
                <Select
                  value={dataSelecionada}
                  onChange={handleChangeData}
                  label="Data"
                >
                  <MenuItem value="">
                    <em>Selecione uma data</em>
                  </MenuItem>
                  {datasFiltradasPorCidade.map((data) => (
                    <MenuItem key={data.id} value={data.id}>
                      {data.data} {data.dia_semana && `(${data.dia_semana})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={gerarPDF}
                disabled={!registrosFinanceiros.length}
                fullWidth
              >
                Gerar PDF
              </Button>
            </Grid>
          </Grid>
          {diaSemana && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Dia da semana: {diaSemana}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {registrosFinanceiros.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estatísticas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Geral
                    </Typography>
                    <Typography variant="h5">
                      {formatarMoeda(estatisticas.totalGeral)}
                    </Typography>
                    <Typography variant="body2">
                      {estatisticas.countTotal} registros
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Particular
                    </Typography>
                    <Typography variant="h6">
                      {formatarMoeda(estatisticas.totalParticular)}
                    </Typography>
                    <Typography variant="body2">
                      {estatisticas.countParticular} registros
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Convênio
                    </Typography>
                    <Typography variant="h6">
                      {formatarMoeda(estatisticas.totalConvenio)}
                    </Typography>
                    <Typography variant="body2">
                      {estatisticas.countConvenio} registros
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Campanha
                    </Typography>
                    <Typography variant="h6">
                      {formatarMoeda(estatisticas.totalCampanha)}
                    </Typography>
                    <Typography variant="body2">
                      {estatisticas.countCampanha} registros
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Registros */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registros Financeiros
            </Typography>
            {registrosFinanceiros.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum registro encontrado. Selecione uma filial e data para visualizar os registros.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Forma Pagamento</TableCell>
                      <TableCell>Situação</TableCell>
                      <TableCell>Observações</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrosFinanceiros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>
                          {registro.editando ? (
                            <TextField
                              value={registro.cliente}
                              onChange={(e) => handleChangeRegistro(registro.id, 'cliente', e.target.value)}
                              size="small"
                              fullWidth
                            />
                          ) : (
                            registro.cliente
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <TextField
                              value={registro.valor}
                              onChange={(e) => handleChangeRegistro(registro.id, 'valor', e.target.value)}
                              size="small"
                              fullWidth
                            />
                          ) : (
                            registro.valor
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <Select
                              value={registro.tipo}
                              onChange={(e) => handleChangeRegistro(registro.id, 'tipo', e.target.value)}
                              size="small"
                              fullWidth
                            >
                              <MenuItem value="particular">Particular</MenuItem>
                              <MenuItem value="convenio">Convênio</MenuItem>
                              <MenuItem value="campanha">Campanha</MenuItem>
                              <MenuItem value="exames">Exames</MenuItem>
                              <MenuItem value="revisao">Revisão</MenuItem>
                            </Select>
                          ) : (
                            <Chip label={registro.tipo} size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <Select
                              value={registro.formaPagamento || ''}
                              onChange={(e) => handleChangeRegistro(registro.id, 'formaPagamento', e.target.value)}
                              size="small"
                              fullWidth
                            >
                              <MenuItem value="dinheiro">Dinheiro</MenuItem>
                              <MenuItem value="cartao">Cartão</MenuItem>
                              <MenuItem value="pix">PIX</MenuItem>
                            </Select>
                          ) : (
                            registro.formaPagamento
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <Select
                              value={registro.situacao}
                              onChange={(e) => handleChangeRegistro(registro.id, 'situacao', e.target.value)}
                              size="small"
                              fullWidth
                            >
                              <MenuItem value="pago">Pago</MenuItem>
                              <MenuItem value="pendente">Pendente</MenuItem>
                              <MenuItem value="cancelado">Cancelado</MenuItem>
                            </Select>
                          ) : (
                            <Chip 
                              label={registro.situacao} 
                              size="small"
                              color={registro.situacao === 'pago' ? 'success' : registro.situacao === 'pendente' ? 'warning' : 'error'}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <TextField
                              value={registro.observacoes}
                              onChange={(e) => handleChangeRegistro(registro.id, 'observacoes', e.target.value)}
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                            />
                          ) : (
                            registro.observacoes
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.editando ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => salvarRegistro(registro)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (registro.novo) {
                                    setRegistrosFinanceiros(prev => prev.filter(r => r.id !== registro.id));
                                  } else {
                                    setRegistrosFinanceiros(prev => 
                                      prev.map(r => r.id === registro.id ? { ...r, editando: false } : r)
                                    );
                                  }
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setRegistrosFinanceiros(prev => 
                                    prev.map(r => r.id === registro.id ? { ...r, editando: true } : r)
                                  );
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                                    excluirRegistro(registro.id);
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Financeiro;