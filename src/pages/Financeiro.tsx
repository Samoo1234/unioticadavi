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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { supabase } from '@/services/supabase'
import { getDiaSemana, formatarData } from '@/utils/dateUtils';

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
  filial_id: number;
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
  id: string;
  forma_pagamento: string;
  valor: string;
}

interface RegistroFinanceiro {
  id: string;
  agendamento_id: number;
  cliente: string;
  valor: string;
  tipo: string;
  forma_pagamento: string;
  formasPagamento?: FormaPagamento[];
  situacao: string;
  observacoes: string | null;
  data_pagamento: string | null;
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
          console.log('Dados brutos das datas_disponiveis:', datasData);
          setDatas(datasData?.map(data => ({
            id: data.id.toString(),
            data: data.data,
            filial_id: data.filial_id,
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
    
    console.log('Filial selecionada ID:', cidadeSelecionada);
    console.log('Todas as datas disponíveis:', datas);
    const datasFiltradas = datas.filter(data => data.filial_id && data.filial_id.toString() === cidadeSelecionada);
    console.log('Datas filtradas por filial_id:', datasFiltradas);
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
      
      // Buscar agendamentos da filial e data selecionadas
      const dataFormatada = dataObj.data;
      const filialSelecionada = filiais.find(f => f.id === cidadeSelecionada);
      const nomeFilial = filialSelecionada?.nome || '';
      
      const { data: agendamentosFilial, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('cidade', nomeFilial)
        .eq('data', dataFormatada);

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        setIsLoading(false);
        return;
      }

      const agendamentoIds = agendamentosFilial?.map(a => a.id) || [];
      console.log('🔍 Debug Financeiro:');
      console.log('- Filial selecionada:', nomeFilial);
      console.log('- Data selecionada:', dataFormatada);
      console.log('- Agendamentos encontrados:', agendamentosFilial);
      console.log('- IDs dos agendamentos:', agendamentoIds);
      
      // Buscar registros financeiros dos agendamentos encontrados
      const { data: registrosData, error: registrosError } = agendamentoIds.length > 0 
        ? await supabase
            .from('registros_financeiros')
            .select('*')
            .in('agendamento_id', agendamentoIds)
        : { data: [], error: null };

      if (registrosError) {
        console.error('Erro ao buscar registros financeiros:', registrosError);
      }

      const registros: RegistroFinanceiro[] = registrosData?.map(registro => ({
        ...registro,
        editando: false,
        formasPagamento: registro.formasPagamento || [{
          id: `fp_${registro.id}_1`,
          forma_pagamento: registro.forma_pagamento || '',
          valor: registro.valor || ''
        }]
      })) || [];
      
      // Buscar agendamentos completos para processamento
      const { data: agendamentosData, error: agendamentosCompletosError } = agendamentoIds.length > 0
        ? await supabase
            .from('agendamentos')
            .select('*')
            .in('id', agendamentoIds)
        : { data: [], error: null };

      if (agendamentosCompletosError) {
        console.error('Erro ao buscar agendamentos completos:', agendamentosCompletosError);
      }

      const agendamentosProcessados: Agendamento[] = agendamentosData || [];
      const registrosDeAgendamentos = [...registros];

      agendamentosProcessados.forEach((agendamento) => {
        const registroExistente = registros.find(r => r.agendamento_id.toString() === agendamento.id);

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
            agendamento_id: parseInt(agendamento.id),
            cliente: nomeCliente,
            valor: agendamento.valor || '',
            tipo: '',
            forma_pagamento: '',
            situacao: '',
            observacoes: '',
            data_pagamento: null,
            novo: true,
            editando: true,
            formasPagamento: [{
              id: `fp_${novoRegistroId}_1`,
              forma_pagamento: '',
              valor: agendamento.valor || ''
            }]
          };

          registrosDeAgendamentos.push(novoRegistro);
        }
      });

      setRegistrosFinanceiros(registrosDeAgendamentos);
      
      // Atualizar dia da semana
      if (dataObj.data) {
        const diaSemanaCalculado = getDiaSemana(dataObj.data);
        setDiaSemana(diaSemanaCalculado);
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
          if (!pagamento.forma_pagamento || !pagamento.valor) continue;
          
          const valorPagamento = parseFloat(pagamento.valor.replace(',', '.'));
          if (isNaN(valorPagamento)) continue;
          
          switch (pagamento.forma_pagamento.toLowerCase()) {
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
        switch (registro.forma_pagamento?.toLowerCase()) {
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
        const diaSemanaCalculado = getDiaSemana(dataObj.data);
        setDiaSemana(diaSemanaCalculado);
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

  // Funções para gerenciar formas de pagamento
  const adicionarFormaPagamento = (registroId: string) => {
    setRegistrosFinanceiros(prev => {
      return prev.map(registro => {
        if (registro.id === registroId) {
          const novasFormas = [...(registro.formasPagamento || [])];
          const novoId = `fp_${registroId}_${Date.now()}`;
          novasFormas.push({
            id: novoId,
            forma_pagamento: '',
            valor: ''
          });
          return { ...registro, formasPagamento: novasFormas };
        }
        return registro;
      });
    });
  };

  const removerFormaPagamento = (registroId: string, formaId: string) => {
    setRegistrosFinanceiros(prev => {
      return prev.map(registro => {
        if (registro.id === registroId) {
          const novasFormas = (registro.formasPagamento || []).filter(fp => fp.id !== formaId);
          if (novasFormas.length === 0) {
            novasFormas.push({
              id: `fp_${registroId}_1`,
              forma_pagamento: '',
              valor: ''
            });
          }
          return { ...registro, formasPagamento: novasFormas };
        }
        return registro;
      });
    });
  };

  const handleChangeFormaPagamento = (registroId: string, formaId: string, campo: string, valor: string) => {
    setRegistrosFinanceiros(prev => {
      return prev.map(registro => {
        if (registro.id === registroId) {
          const formasAtualizadas = (registro.formasPagamento || []).map(fp => {
            if (fp.id === formaId) {
              if (campo === 'valor') {
                const valorLimpo = valor.replace(/[^\d,.]/g, '');
                const valorFormatado = valorLimpo.replace(/\./g, ',').replace(/,/g, ',');
                return { ...fp, [campo]: valorFormatado };
              }
              return { ...fp, [campo]: valor };
            }
            return fp;
          });
          
          // Calcular valor total
          const valorTotal = formasAtualizadas.reduce((total, fp) => {
            const valor = parseFloat(fp.valor.replace(',', '.')) || 0;
            return total + valor;
          }, 0);
          
          return { 
            ...registro, 
            formasPagamento: formasAtualizadas,
            valor: valorTotal.toFixed(2).replace('.', ',')
          };
        }
        return registro;
      });
    });
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
    <Box sx={{ 
      p: 3, 
      height: '80vh', 
      overflowY: 'auto',
      backgroundColor: '#f5f5f5',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
        '&:hover': {
          background: '#555',
        },
      },
    }}>
      <Typography variant="h3" gutterBottom sx={{ 
        fontWeight: 'bold', 
        color: '#1976d2',
        textAlign: 'center',
        mb: 4,
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
      }}>
        Registros Financeiros - {diaSemana}
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
                      {formatarData(data.data)} {data.dia_semana && `(${data.dia_semana})`}
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
            <>
              {registrosFinanceiros.length === 0 && (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Nenhum registro encontrado. Selecione uma filial e data para visualizar os registros.
                </Typography>
              )}
              <TableContainer component={Paper} sx={{ 
                maxWidth: '100%', 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#555',
                  },
                },
              }}>
                <Table sx={{ minWidth: 800, '& .MuiTableCell-root': { padding: '4px 8px' } }}>
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: '#1976d2',
                      '& .MuiTableCell-root': {
                        color: 'white !important',
                        borderBottom: 'none',
                        backgroundColor: '#1976d2'
                      }
                    }}>
                      <TableCell sx={{ 
                        minWidth: 180, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          Cliente
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 80, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon fontSize="small" />
                          R$
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 100, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon fontSize="small" />
                          Tipo
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 160, 
                        fontWeight: 'bold', 
                        fontSize: '0.65rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PaymentIcon fontSize="small" />
                          Forma de Pagamento
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 90, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InfoIcon fontSize="small" />
                          Situação
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 120, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        Observações
                      </TableCell>
                      <TableCell sx={{ 
                        minWidth: 90, 
                        fontWeight: 'bold', 
                        fontSize: '0.75rem'
                      }}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrosFinanceiros.map((registro, index) => (
                      <TableRow key={registro.id} sx={{ 
                        backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                        '&:hover': { 
                          backgroundColor: '#e3f2fd',
                          transform: 'scale(1.01)',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}>
                        <TableCell sx={{ minWidth: 180 }}>
                          {registro.editando ? (
                            <TextField
                              value={registro.cliente}
                              onChange={(e) => handleChangeRegistro(registro.id, 'cliente', e.target.value)}
                              size="small"
                              fullWidth
                              variant="outlined"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#fff',
                                  height: '28px',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                              {registro.cliente}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 80 }}>
                          {registro.editando ? (
                            <TextField
                              value={registro.valor}
                              onChange={(e) => handleChangeRegistro(registro.id, 'valor', e.target.value)}
                              size="small"
                              fullWidth
                              variant="outlined"
                              InputProps={{
                                startAdornment: <span style={{ color: '#666', marginRight: '4px', fontSize: '0.7rem' }}>R$</span>,
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#fff',
                                  height: '28px',
                                  fontSize: '0.7rem'
                                }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                              R$ {registro.valor}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 100 }}>
                          {registro.editando ? (
                            <FormControl fullWidth size="small">
                                <Select
                                  value={registro.tipo}
                                  onChange={(e) => handleChangeRegistro(registro.id, 'tipo', e.target.value)}
                                  size="small"
                                  fullWidth
                                  variant="outlined"
                                  sx={{
                                    backgroundColor: '#fff',
                                    height: '28px',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  <MenuItem value="particular">Particular</MenuItem>
                                  <MenuItem value="convenio">Convênio</MenuItem>
                                  <MenuItem value="campanha">Campanha</MenuItem>
                                  <MenuItem value="exames">Exames</MenuItem>
                                  <MenuItem value="revisao">Revisão</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip 
                                label={registro.tipo} 
                                size="small" 
                                sx={{
                                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  textTransform: 'capitalize',
                                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                        <TableCell sx={{ minWidth: 180, py: 0.5, pr: 1 }}>
                          {registro.editando ? (
                            <Box sx={{ py: 0.3 }}>
                              {(registro.formasPagamento || []).map((forma) => (
                                <Box key={forma.id} sx={{ 
                                  mb: 0.2, 
                                  p: 0.8, 
                                  border: '1px solid #e0e0e0', 
                                  borderRadius: 1,
                                  backgroundColor: '#fafafa'
                                }}>
                                  <Grid container spacing={0.3} alignItems="center">
                                    <Grid item xs={5}>
                                      <FormControl fullWidth size="small">
                                        <Select
                                          value={forma.forma_pagamento}
                                          onChange={(e) => handleChangeFormaPagamento(registro.id, forma.id, 'forma_pagamento', e.target.value)}
                                          size="small"
                                          fullWidth
                                          variant="outlined"
                                          displayEmpty
                                          sx={{
                                            backgroundColor: '#fff',
                                            height: '28px'
                                          }}
                                        >
                                          <MenuItem value="">
                                            <em>Selecione</em>
                                          </MenuItem>
                                          <MenuItem value="dinheiro">Dinheiro</MenuItem>
                                          <MenuItem value="cartao">Cartão</MenuItem>
                                          <MenuItem value="pix">PIX</MenuItem>
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={5}>
                                      <TextField
                                        value={forma.valor}
                                        onChange={(e) => handleChangeFormaPagamento(registro.id, forma.id, 'valor', e.target.value)}
                                        size="small"
                                        fullWidth
                                        variant="outlined"
                                        placeholder="0,00"
                                        InputProps={{
                                          startAdornment: <span style={{ color: '#666', marginRight: '4px' }}>R$</span>,
                                        }}
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#fff',
                                            height: '28px'
                                          }
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={2} sx={{ textAlign: 'center' }}>
                                      <Tooltip title="Remover forma de pagamento">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => removerFormaPagamento(registro.id, forma.id)}
                                          disabled={(registro.formasPagamento || []).length <= 1}
                                          sx={{
                                            backgroundColor: '#ffebee',
                                            '&:hover': {
                                              backgroundColor: '#ffcdd2'
                                            }
                                          }}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Grid>
                                  </Grid>
                                </Box>
                              ))}
                              <Box sx={{ textAlign: 'center', mt: 0.3 }}>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => adicionarFormaPagamento(registro.id)}
                                  variant="outlined"
                                  sx={{
                                    borderColor: '#1976d2',
                                    color: '#1976d2',
                                    height: '24px',
                                    fontSize: '0.7rem',
                                    padding: '4px 6px',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'auto',
                                    '&:hover': {
                                      borderColor: '#1565c0',
                                      backgroundColor: '#e3f2fd'
                                    }
                                  }}
                                >
                                  Forma Pagamento
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ py: 0.3 }}>
                              {(registro.formasPagamento || []).map((forma) => (
                                <Box key={forma.id} sx={{ 
                                  mb: 0.15, 
                                  display: 'inline-block',
                                  mr: 0.3
                                }}>
                                  <Chip 
                                    label={`${forma.forma_pagamento}: R$ ${forma.valor}`} 
                                    size="small" 
                                    sx={{
                                      background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                      color: 'white',
                                      fontWeight: 500,
                                      boxShadow: '0 1px 3px rgba(76, 175, 80, 0.3)',
                                      border: 'none',
                                      '&:hover': {
                                        transform: 'scale(1.02)',
                                        transition: 'all 0.2s ease-in-out'
                                      }
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 110, py: 0.5, pr: 1 }}>
                          {registro.editando ? (
                            <FormControl fullWidth size="small">
                                <Select
                                  value={registro.situacao}
                                  onChange={(e) => handleChangeRegistro(registro.id, 'situacao', e.target.value)}
                                  size="small"
                                  fullWidth
                                  variant="outlined"
                                  sx={{
                                    backgroundColor: '#fff',
                                    height: '28px'
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>Selecione</em>
                                  </MenuItem>
                                  <MenuItem value="caso_clinico">Caso Clínico</MenuItem>
                                  <MenuItem value="efetivacao">Efetivação</MenuItem>
                                  <MenuItem value="perda">Perda</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip 
                                label={registro.situacao} 
                                size="small"
                                sx={{
                                  background: registro.situacao === 'efetivacao' 
                                    ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                                    : registro.situacao === 'caso_clinico'
                                    ? 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)'
                                    : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                  color: 'white',
                                  fontWeight: 600,
                                  textTransform: 'capitalize',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease-in-out'
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 130, py: 0.5, pr: 1 }}>
                            {registro.editando ? (
                              <TextField
                                value={registro.observacoes}
                                onChange={(e) => handleChangeRegistro(registro.id, 'observacoes', e.target.value)}
                                size="small"
                                fullWidth
                                variant="outlined"
                                multiline
                                rows={1}
                                placeholder="Digite as observações..."
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#fff'
                                  }
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ 
                                color: registro.observacoes ? '#333' : '#999',
                                fontStyle: registro.observacoes ? 'normal' : 'italic'
                              }}>
                                {registro.observacoes || 'Sem observações'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 110, py: 0.5, pr: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              {registro.editando ? (
                                <>
                                  <Tooltip title="Salvar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setRegistrosFinanceiros(prev => 
                                          prev.map(r => r.id === registro.id ? { ...r, editando: false } : r)
                                        );
                                      }}
                                      sx={{
                                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                        color: 'white',
                                        '&:hover': {
                                          background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                                      }}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancelar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setRegistrosFinanceiros(prev => 
                                          prev.map(r => r.id === registro.id ? { ...r, editando: false } : r)
                                        );
                                      }}
                                      sx={{
                                        background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                                        color: 'white',
                                        '&:hover': {
                                          background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)'
                                      }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setRegistrosFinanceiros(prev => 
                                          prev.map(r => r.id === registro.id ? { ...r, editando: true } : r)
                                        );
                                      }}
                                      sx={{
                                        background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                                        color: 'white',
                                        '&:hover': {
                                          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)'
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Excluir">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                                          excluirRegistro(registro.id);
                                        }
                                      }}
                                      sx={{
                                        background: 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
                                        color: 'white',
                                        '&:hover': {
                                          background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                                          transform: 'scale(1.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)'
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Financeiro;