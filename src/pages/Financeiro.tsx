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
import autoTable from 'jspdf-autotable';

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
  data: string;
  cidade: string;
  agendamento_id: string | null;
  cliente: string;
  valor: string;
  tipo: string; // 'receita' ou 'despesa'
  tipo_atendimento: string; // 'particular', 'convenio', etc.
  forma_pagamento: string;
  formasPagamento?: FormaPagamento[];
  situacao: string;
  observacoes: string | null;
  data_pagamento: string | null;
  created_at?: string;
  updated_at?: string;
  // Campos apenas para controle local
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
      console.log('🔍 Debug Financeiro DETALHADO:');
      console.log('- Filial selecionada:', nomeFilial);
      console.log('- Data selecionada:', dataFormatada);
      console.log('- Agendamentos encontrados:', agendamentosFilial);
      console.log('- IDs dos agendamentos:', agendamentoIds);
      console.log('- Data do objeto selecionado:', dataObj);
      console.log('- Cidade selecionada ID:', cidadeSelecionada);
      console.log('- Data selecionada ID:', dataSelecionada);
      
      // Buscar registros financeiros por data e cidade diretamente
      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_financeiros')
        .select('*, tipo_atendimento')
        .eq('data', dataFormatada)
        .eq('cidade', nomeFilial);

      if (registrosError) {
        console.error('Erro ao buscar registros financeiros:', registrosError);
      }

      const registros: RegistroFinanceiro[] = registrosData?.map(registro => ({
        ...registro,
        editando: false,
        agendamento_id: registro.agendamento_id || null,
        tipo_atendimento: registro.tipo_atendimento || '',
        valor: registro.valor?.toString() || '0,00',
        formasPagamento: registro.formas_pagamento || [{
          id: `fp_${registro.id}_1`,
          forma_pagamento: registro.forma_pagamento || '',
          valor: registro.valor?.toString() || ''
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

      console.log('📊 Processamento de registros:');
      console.log('- Registros financeiros existentes:', registros.length);
      console.log('- Agendamentos para processar:', agendamentosProcessados.length);
      console.log('- Agendamentos completos:', agendamentosProcessados);
      
      // Verificar quais agendamentos ainda não têm registros financeiros
      const agendamentosComRegistros = registros.map(r => r.agendamento_id).filter(Boolean);
      const agendamentosSemRegistros = agendamentosProcessados.filter(agendamento => 
        !agendamentosComRegistros.includes(agendamento.id)
      );
      
      console.log('📋 Análise de registros:');
      console.log('- Agendamentos com registros:', agendamentosComRegistros);
      console.log('- Agendamentos sem registros:', agendamentosSemRegistros.map(a => ({ id: a.id, nome: a.nome })));
      
      // Adicionar registros para agendamentos que ainda não têm
      if (agendamentosSemRegistros.length > 0) {
        console.log('🆕 Criando novos registros financeiros para agendamentos sem registro...');
        agendamentosSemRegistros.forEach((agendamento) => {
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
            data: dataFormatada,
            cidade: nomeFilial,
            agendamento_id: agendamento.id,
            cliente: nomeCliente,
            valor: agendamento.valor || '',
            tipo: 'receita',
            tipo_atendimento: '',
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
        });
      }

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
      if (!registro.valor || !registro.tipo_atendimento) continue;
      
      const valor = parseFloat(registro.valor.replace(',', '.'));
      if (isNaN(valor)) continue;
      
      stats.totalGeral += valor;
      stats.countTotal++;
      
      // Contabilizar por tipo de atendimento
      switch (registro.tipo_atendimento?.toLowerCase()) {
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
          
          // Não alterar o valor total do registro - manter o valor original
          return { 
            ...registro, 
            formasPagamento: formasAtualizadas
            // Removido: valor: valorTotal.toFixed(2).replace('.', ',')
          };
        }
        return registro;
      });
    });
  };



  const salvarRegistro = async (registro: RegistroFinanceiro) => {
    try {
      setIsLoading(true);
      
      // Preparar dados para salvar
      const dataObj = datas.find(d => d.id === dataSelecionada);
      const filialSelecionada = filiais.find(f => f.id === cidadeSelecionada);
      
      const dadosParaSalvar = {
        data: dataObj?.data || new Date().toISOString().split('T')[0],
        cidade: filialSelecionada?.nome || '',
        agendamento_id: registro.agendamento_id,
        cliente: registro.cliente,
        valor: parseFloat(registro.valor.replace(',', '.')),
        tipo: 'receita', // Sempre receita para registros financeiros
        tipo_atendimento: registro.tipo_atendimento, // Tipo específico: particular, convenio, etc.
        forma_pagamento: registro.forma_pagamento || '',
        formas_pagamento: registro.formasPagamento || [],
        situacao: registro.situacao,
        observacoes: registro.observacoes,
        data_pagamento: new Date().toISOString()
      };

      if (registro.novo) {
        // Inserir novo registro
        const { error } = await supabase
          .from('registros_financeiros')
          .insert(dadosParaSalvar);

        if (error) {
          console.error('Erro ao inserir registro:', error);
          setError('Erro ao salvar novo registro.');
          return false;
        }
      } else {
        // Atualizar registro existente
        const { error } = await supabase
          .from('registros_financeiros')
          .update(dadosParaSalvar)
          .eq('id', registro.id);

        if (error) {
          console.error('Erro ao atualizar registro:', error);
          setError('Erro ao atualizar registro.');
          return false;
        }
      }

      // Recarregar dados após salvar
      await buscarDados();
      setIsLoading(false);
      return true;
      
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      setError('Erro ao salvar registro.');
      setIsLoading(false);
      return false;
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
    try {
      if (!registrosFinanceiros || registrosFinanceiros.length === 0) {
        alert('Não há registros financeiros para gerar o PDF.');
        return;
      }
      
      console.log('Iniciando geração do PDF...');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const filialSelecionadaObj = filiais.find(filial => filial.id === cidadeSelecionada);
      const nomeFilial = filialSelecionadaObj ? filialSelecionadaObj.nome : 'Desconhecida';
      
      const dataObj = datas.find(d => d.id === dataSelecionada);
      const dataFormatada = dataObj ? formatarData(dataObj.data) : 'Data desconhecida';
      
      // Configurações de cores e estilos
      const primaryColor: [number, number, number] = [25, 118, 210]; // Azul profissional
      const secondaryColor: [number, number, number] = [117, 117, 117]; // Cinza
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Cabeçalho profissional
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO FINANCEIRO', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${nomeFilial}`, pageWidth / 2, 25, { align: 'center' });
      
      // Informações do relatório
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 50;
      doc.text(`Data do Relatório: ${dataFormatada} (${diaSemana})`, 20, yPos);
      yPos += 5;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
      yPos += 5;
      doc.text(`Total de Registros: ${estatisticas.countTotal}`, 20, yPos);
      
      // Linha separadora
      yPos += 10;
      doc.setDrawColor(...secondaryColor);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      // Resumo Financeiro em tabela
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('RESUMO FINANCEIRO', 20, yPos);
      
      yPos += 10;
      
      // Tabela de resumo usando autoTable
      const resumoData = [
        ['Tipo de Atendimento', 'Valor Total', 'Quantidade'],
        ['Particular', `R$ ${estatisticas.totalParticular.toFixed(2).replace('.', ',')}`, estatisticas.countParticular.toString()],
        ['Convênio', `R$ ${estatisticas.totalConvenio.toFixed(2).replace('.', ',')}`, estatisticas.countConvenio.toString()],
        ['Campanha', `R$ ${estatisticas.totalCampanha.toFixed(2).replace('.', ',')}`, estatisticas.countCampanha.toString()],
        ['Exames', `R$ ${estatisticas.totalExames.toFixed(2).replace('.', ',')}`, estatisticas.countExames.toString()],
        ['Revisão', `R$ ${estatisticas.totalRevisao.toFixed(2).replace('.', ',')}`, estatisticas.countRevisao.toString()]
      ];
      
      autoTable(doc, {
        head: [resumoData[0]],
        body: resumoData.slice(1),
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Total Geral destacado
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos - 5, pageWidth - 40, 15, 'F');
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, yPos - 5, pageWidth - 40, 15, 'S');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('TOTAL GERAL:', 25, yPos + 3);
      doc.text(`R$ ${estatisticas.totalGeral.toFixed(2).replace('.', ',')}`, pageWidth - 25, yPos + 3, { align: 'right' });
      
      yPos += 25;
      
      // Formas de Pagamento
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('FORMAS DE PAGAMENTO', 20, yPos);
      
      yPos += 10;
      
      const pagamentoData = [
        ['Forma de Pagamento', 'Valor Total', 'Quantidade'],
        ['Dinheiro', `R$ ${estatisticas.totalDinheiro.toFixed(2).replace('.', ',')}`, estatisticas.countDinheiro.toString()],
        ['Cartão', `R$ ${estatisticas.totalCartao.toFixed(2).replace('.', ',')}`, estatisticas.countCartao.toString()],
        ['PIX', `R$ ${estatisticas.totalPix.toFixed(2).replace('.', ',')}`, estatisticas.countPix.toString()]
      ];
      
      autoTable(doc, {
        head: [pagamentoData[0]],
        body: pagamentoData.slice(1),
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 20;
      
      // Verificar se precisa de nova página
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 30;
      }
      
      // Detalhamento dos registros
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('DETALHAMENTO DOS REGISTROS', 20, yPos);
      
      yPos += 10;
      
      // Preparar dados para tabela de registros
      const registrosData = [['Cliente', 'Valor', 'Tipo', 'Pagamento', 'Situação']];
      
      registrosFinanceiros.forEach((registro) => {
        if (!registro.cliente || !registro.valor || !registro.tipo_atendimento) return;
        
        const formasPagamento = (registro.formasPagamento || [])
          .filter(fp => fp.forma_pagamento && fp.valor)
          .map(fp => `${fp.forma_pagamento}: R$ ${fp.valor}`)
          .join(', ') || registro.forma_pagamento || '-';
        
        registrosData.push([
          registro.cliente,
          `R$ ${registro.valor}`,
          registro.tipo_atendimento || '-',
          formasPagamento,
          registro.situacao || '-'
        ]);
      });
      
      autoTable(doc, {
        head: [registrosData[0]],
        body: registrosData.slice(1),
        startY: yPos,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Cliente
          1: { cellWidth: 25, halign: 'right' }, // Valor
          2: { cellWidth: 30 }, // Tipo
          3: { cellWidth: 45 }, // Pagamento
          4: { cellWidth: 30 } // Situação
        },
        margin: { left: 20, right: 20 },
        didDrawPage: (data) => {
          // Cabeçalho em páginas adicionais
          if (data.pageNumber > 1) {
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Relatório Financeiro - ${nomeFilial} (continuação)`, pageWidth / 2, 12, { align: 'center' });
          }
        }
      });
      
      // Rodapé profissional
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Linha do rodapé
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
        
        // Informações do rodapé
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestão Ótica', 20, pageHeight - 15);
        doc.text(`${nomeFilial}`, 20, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
        doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
      
      console.log('PDF gerado com sucesso, iniciando download...');
      
      // Salvar PDF
      const fileName = `relatorio-financeiro-${nomeFilial.replace(/\s+/g, '-')}-${dataFormatada.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      console.log('Download do PDF iniciado!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error}`);
    }
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
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Resumo Financeiro
            </Typography>
            
            {/* Total Geral Destacado */}
            <Card sx={{ mb: 3, backgroundColor: '#f8f9fa', border: '2px solid #1976d2' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {formatarMoeda(estatisticas.totalGeral)}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Geral ({estatisticas.countTotal} registros)
                </Typography>
              </CardContent>
            </Card>

            {/* Tipos de Atendimento */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2, color: '#333' }}>
              Por Tipo de Atendimento
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      Particular
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalParticular)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countParticular} registros
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalParticular / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      Convênio
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalConvenio)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countConvenio} registros
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalConvenio / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      Campanha
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalCampanha)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countCampanha} registros
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalCampanha / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      Exames
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalExames)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countExames} registros
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalExames / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      Revisão
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalRevisao)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countRevisao} registros
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalRevisao / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Formas de Pagamento */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: '#333' }}>
              Por Forma de Pagamento
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%', backgroundColor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      💵 Dinheiro
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalDinheiro)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countDinheiro} transações
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalDinheiro / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%', backgroundColor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      💳 Cartão
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalCartao)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countCartao} transações
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalCartao / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card variant="outlined" sx={{ height: '100%', backgroundColor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                      📱 PIX
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>
                      {formatarMoeda(estatisticas.totalPix)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {estatisticas.countPix} transações
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {estatisticas.totalGeral > 0 ? 
                        `${((estatisticas.totalPix / estatisticas.totalGeral) * 100).toFixed(1)}%` : '0%'}
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
                              {registro.cliente || 'Nome não informado'}
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
                              R$ {registro.valor || '0,00'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 100 }}>
                          {registro.editando ? (
                            <FormControl fullWidth size="small">
                                <Select
                                  value={registro.tipo_atendimento}
                                  onChange={(e) => handleChangeRegistro(registro.id, 'tipo_atendimento', e.target.value)}
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
                                label={registro.tipo_atendimento || 'Não definido'} 
                                size="small" 
                                variant="outlined"
                                sx={{
                                  backgroundColor: registro.tipo_atendimento ? '#f5f5f5' : '#fafafa',
                                  borderColor: registro.tipo_atendimento ? '#666' : '#ccc',
                                  color: registro.tipo_atendimento ? '#333' : '#999',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  textTransform: 'capitalize',
                                  '&:hover': {
                                    backgroundColor: registro.tipo_atendimento ? '#eeeeee' : '#f0f0f0'
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
                                        <span>
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
                                        </span>
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
                                    label={forma.forma_pagamento && forma.valor 
                                      ? `${forma.forma_pagamento}: R$ ${forma.valor}` 
                                      : 'Não definido'
                                    } 
                                    size="small" 
                                    variant="outlined"
                                    sx={{
                                      backgroundColor: forma.forma_pagamento && forma.valor ? '#f8f9fa' : '#fafafa',
                                      borderColor: forma.forma_pagamento && forma.valor ? '#28a745' : '#ccc',
                                      color: forma.forma_pagamento && forma.valor ? '#155724' : '#999',
                                      fontWeight: 500,
                                      fontSize: '0.65rem',
                                      '&:hover': {
                                        backgroundColor: forma.forma_pagamento && forma.valor ? '#e8f5e8' : '#f0f0f0'
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
                                label={registro.situacao || 'Não definido'} 
                                size="small"
                                variant="outlined"
                                sx={{
                                  backgroundColor: registro.situacao === 'efetivacao' 
                                    ? '#f8f9fa'
                                    : registro.situacao === 'caso_clinico'
                                    ? '#fff8e1'
                                    : registro.situacao === 'perda'
                                    ? '#ffebee'
                                    : '#fafafa',
                                  borderColor: registro.situacao === 'efetivacao' 
                                    ? '#28a745'
                                    : registro.situacao === 'caso_clinico'
                                    ? '#ff9800'
                                    : registro.situacao === 'perda'
                                    ? '#dc3545'
                                    : '#ccc',
                                  color: registro.situacao === 'efetivacao' 
                                    ? '#155724'
                                    : registro.situacao === 'caso_clinico'
                                    ? '#e65100'
                                    : registro.situacao === 'perda'
                                    ? '#721c24'
                                    : '#999',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  textTransform: 'capitalize',
                                  '&:hover': {
                                    backgroundColor: registro.situacao === 'efetivacao' 
                                      ? '#e8f5e8'
                                      : registro.situacao === 'caso_clinico'
                                      ? '#fff3e0'
                                      : registro.situacao === 'perda'
                                      ? '#f5c6cb'
                                      : '#f0f0f0'
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
                                      onClick={async () => {
                                        const sucesso = await salvarRegistro(registro);
                                        if (sucesso) {
                                          setRegistrosFinanceiros(prev => 
                                            prev.map(r => r.id === registro.id ? { ...r, editando: false } : r)
                                          );
                                        }
                                      }}
                                      sx={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: '#218838'
                                        },
                                        transition: 'background-color 0.2s ease-in-out'
                                      }}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancelar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        // Recarregar dados para cancelar alterações
                                        buscarDados();
                                      }}
                                      sx={{
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: '#5a6268'
                                        },
                                        transition: 'background-color 0.2s ease-in-out'
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
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: '#0056b3'
                                        },
                                        transition: 'background-color 0.2s ease-in-out'
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
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: '#c82333'
                                        },
                                        transition: 'background-color 0.2s ease-in-out'
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