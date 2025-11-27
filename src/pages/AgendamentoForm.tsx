import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  alpha,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,

  RemoveRedEye
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { buscarClientePorTelefone, criarClienteCentral } from '../services/supabaseCentral';
import { formatarDataComDiaSemana } from '../utils/dateUtils';

interface Filial {
  id: string;
  nome: string;
  ativa: boolean;
}

interface DataDisponivel {
  id: string;
  data: string;
  filial_id: string;
  medico_id: string;
  ativa: boolean;
  horarios_disponiveis: string[];
}

interface FormData {
  nome: string;
  telefone: string;
  filial_id: string;
  data_id: string;
  horario: string;
  observacoes: string;
}

const initialFormData: FormData = {
  nome: '',
  telefone: '',
  filial_id: '',
  data_id: '',
  horario: '',
  observacoes: ''
};

export default function AgendamentoForm() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Estados baseados no componente original
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState<DataDisponivel[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCityDoctor, setSelectedCityDoctor] = useState<string>('');

  useEffect(() => {
    // Verificar se estamos em modo de edição (se temos um ID de agendamento na URL)
    const urlParams = new URLSearchParams(window.location.search);
    const appointmentId = urlParams.get('id');
    setIsEditMode(!!appointmentId);
    
    // Função para carregar todos os dados necessários
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Carregar dados iniciais
        await Promise.all([
          loadFiliais(),
          // Outros carregamentos paralelos podem ser adicionados aqui
        ]);
        
        // Se estiver em modo de edição, carregar os dados do agendamento
        if (appointmentId) {
          try {
            const { data: appointmentData, error } = await supabase
              .from('agendamentos')
              .select('*')
              .eq('id', appointmentId)
              .single();
              
            if (error) throw error;
            
            if (appointmentData) {
              // Encontrar a filial pelo nome da cidade
              const filialEncontrada = filiais.find(f => f.nome === appointmentData.cidade);
              const filialId = filialEncontrada?.id || '';
              
              // Encontrar a data disponível pela data e filial
              await loadDatasDisponiveis(filialId);
              const dataEncontrada = datasDisponiveis.find(d => d.data === appointmentData.data && d.filial_id === filialId);
              const dataId = dataEncontrada?.id || '';
              
              setFormData({
                nome: appointmentData.nome || '',
                telefone: appointmentData.telefone || '',
                filial_id: filialId,
                data_id: dataId,
                horario: appointmentData.horario || '',
                observacoes: appointmentData.observacoes || ''
              });
              
              // Se tiver data_id, carregar horários disponíveis
              if (dataId) {
                await loadHorariosDisponiveis(dataId);
              }
            }
          } catch (error: any) {
            console.error("Erro ao carregar dados do agendamento:", error);
            toast.error("Erro ao carregar dados do agendamento.");
          }
        }

      } catch (error: any) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Erro ao carregar dados. Por favor, recarregue a página.");
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setFiliais(data || []);
      return data;
    } catch (error: any) {
      console.error('Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais');
      return [];
    }
  };

  const loadDatasDisponiveis = async (filialId: string) => {
    try {
      const { data, error } = await supabase
        .from('datas_disponiveis')
        .select('*')
        .eq('filial_id', filialId)
        .eq('ativa', true)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data');

      if (error) throw error;
      setDatasDisponiveis(data || []);
      
      // Buscar o médico associado à filial selecionada
        if (data && data.length > 0) {
          const filialDates = data.filter(d => d.filial_id === filialId);
          if (filialDates.length > 0 && filialDates[0].medico_id) {
            const { data: medicoData, error: medicoError } = await supabase
              .from('medicos')
              .select('nome')
              .eq('id', filialDates[0].medico_id)
              .single();
              
            if (!medicoError && medicoData) {
              setSelectedCityDoctor(medicoData.nome);
            }
          }
        }
      
      return data;
    } catch (error: any) {
      console.error('Erro ao carregar datas disponíveis:', error);
      toast.error('Erro ao carregar datas disponíveis');
      return [];
    }
  };

  const loadHorariosDisponiveis = async (dataId: string) => {
    try {
      const dataSelecionada = datasDisponiveis.find(d => d.id === dataId);
      
      if (dataSelecionada && dataSelecionada.horarios_disponiveis && Array.isArray(dataSelecionada.horarios_disponiveis)) {
        setHorariosDisponiveis(dataSelecionada.horarios_disponiveis);
      } else {
        // Se não houver horários disponíveis na data, gerar horários padrão
        // baseado na lógica do arquivo original
        const { data: configData, error: configError } = await supabase
          .from('configuracoes_horarios')
          .select('*')
          .eq('filial_id', dataSelecionada?.filial_id || '')
          .single();
          
        if (!configError && configData) {
          const slots: string[] = [];
          
          // Função auxiliar para formatar horário
          const formatTime = (hours: number, minutes: number) => {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          };
          
          // Função para adicionar horários em um intervalo
          const addTimeSlots = (start: string, end: string, interval: number) => {
            const [startHours, startMinutes] = start.split(':').map(Number);
            const [endHours, endMinutes] = end.split(':').map(Number);
            
            let currentHours = startHours;
            let currentMinutes = startMinutes;

            while (
              currentHours < endHours || 
              (currentHours === endHours && currentMinutes < endMinutes)
            ) {
              const timeStr = formatTime(currentHours, currentMinutes);

              slots.push(timeStr);
              
              // Avançar para o próximo horário
              currentMinutes += interval;
              if (currentMinutes >= 60) {
                currentHours += Math.floor(currentMinutes / 60);
                currentMinutes %= 60;
              }
            }
          };

          const horarios = {
            manhaInicio: configData.manha_inicio || '08:00',
            manhaFim: configData.manha_fim || '12:00',
            tardeInicio: configData.tarde_inicio || '14:00',
            tardeFim: configData.tarde_fim || '18:00'
          };

          if (configData.periodo_manha) {
            addTimeSlots(horarios.manhaInicio, horarios.manhaFim, configData.intervalo || 30);
          }
          if (configData.periodo_tarde) {
            addTimeSlots(horarios.tardeInicio, horarios.tardeFim, configData.intervalo || 30);
          }
          
          // Filtrar horários já agendados
          if (dataSelecionada) {
            const { data: agendamentos, error: agendamentosError } = await supabase
              .from('agendamentos')
              .select('horario')
              .eq('data', dataSelecionada.data)
              .eq('cidade', filiais.find(f => f.id === dataSelecionada.filial_id)?.nome || '');
              
            if (!agendamentosError && agendamentos && agendamentos.length > 0) {
              const horariosAgendados = agendamentos.map(a => a.horario);
              const horariosDisponiveis = slots.filter(slot => !horariosAgendados.includes(slot));
              setHorariosDisponiveis(horariosDisponiveis);
              return;
            }
          }
          
          setHorariosDisponiveis(slots);
          return;
        }
        
        setHorariosDisponiveis([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      setHorariosDisponiveis([]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erros quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Carregar dados dependentes
    if (field === 'filial_id' && value) {
      loadDatasDisponiveis(value);
      setFormData(prev => ({ ...prev, data_id: '', horario: '' }));
      setHorariosDisponiveis([]);
    } else if (field === 'data_id' && value) {
      loadHorariosDisponiveis(value);
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const phoneDigits = value.replace(/\D/g, '');
    
    // Aplica a formatação dependendo do comprimento
    if (phoneDigits.length <= 2) {
      return phoneDigits;
    } else if (phoneDigits.length <= 6) {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2)}`;
    } else if (phoneDigits.length <= 10) {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6, 10)}`;
    } else {
      return `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, telefone: formattedPhone }));
    
    // Limpa o erro se o campo for preenchido corretamente
    if (errors.telefone && formattedPhone.replace(/\D/g, '').length >= 10) {
      setErrors(prev => ({ ...prev, telefone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Se não estiver em modo de edição, validar todos os campos
    if (!isEditMode) {
      if (!formData.filial_id) {
        newErrors.filial_id = 'Selecione uma cidade';
      }
      if (!formData.data_id) {
        newErrors.data_id = 'Selecione uma data';
      }
      if (!formData.horario) {
        newErrors.horario = 'Selecione um horário';
      }
    }
    
    // Sempre validar nome e telefone
    if (!formData.nome.trim()) {
      newErrors.nome = 'Digite seu nome';
    }
    
    // Validação de telefone
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Digite seu telefone';
    } else {
      const phoneDigits = formData.telefone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      // Obter o ID do agendamento da URL, se estiver em modo de edição
      const urlParams = new URLSearchParams(window.location.search);
      const appointmentId = urlParams.get('id');
      
      if (isEditMode && appointmentId) {
        // Se estiver em modo de edição, apenas atualizar nome, telefone e informações adicionais
        const appointmentData = {
          nome: formData.nome,
          telefone: formData.telefone,
          observacoes: formData.observacoes || '',
          atualizado_em: new Date().toISOString()
        };

        const { error } = await supabase
          .from('agendamentos')
          .update(appointmentData)
          .eq('id', appointmentId);
          
        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Se for um novo agendamento
        const dataSelecionada = datasDisponiveis.find(d => d.id === formData.data_id);
        const filialSelecionada = filiais.find(f => f.id === formData.filial_id);

        if (!dataSelecionada || !filialSelecionada) {
          throw new Error('Cidade ou data não encontrada');
        }

        // Verificar se o horário já está agendado
        const { data: agendamentos, error: checkError } = await supabase
          .from('agendamentos')
          .select('horario')
          .eq('data', dataSelecionada.data)
          .eq('cidade', filialSelecionada.nome)
          .eq('horario', formData.horario);
          
        if (checkError) throw checkError;
        
        if (agendamentos && agendamentos.length > 0) {
          throw new Error('Este horário já está agendado. Por favor, escolha outro.');
        }

        // Criar cliente no banco central (se não existir)
        try {
          const clienteExistente = await buscarClientePorTelefone(formData.telefone);
          if (!clienteExistente) {
            await criarClienteCentral({
              nome: formData.nome,
              telefone: formData.telefone,
              cidade: filialSelecionada.nome,
              cadastro_completo: false
            });
          }
        } catch (clienteError) {
          // Continuar mesmo se falhar - não bloquear agendamento
        }

        const appointmentData = {
          cidade: filialSelecionada.nome,
          data: dataSelecionada.data,
          horario: formData.horario,
          nome: formData.nome,
          telefone: formData.telefone,
          observacoes: formData.observacoes || '',
          status: 'pendente'
        };

        const { error } = await supabase
          .from('agendamentos')
          .insert([appointmentData]);

        if (error) throw error;
        toast.success('Consulta agendada com sucesso! Aguarde a confirmação via WhatsApp.');
      }
      
      // Limpar formulário apenas se não estiver em modo de edição
      if (!isEditMode) {
        setFormData(initialFormData);
        setHorariosDisponiveis([]);
      }
      
      setErrors({});
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      
      // Verificar se é um erro de horário já agendado
      if (error.message && error.message.includes('horário já está agendado')) {
        toast.error(error.message);
        // Destacar o campo de horário com erro
        setErrors(prev => ({ ...prev, horario: 'Este horário já está agendado' }));
      } else {
        toast.error(error.message || 'Erro ao agendar consulta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatarDataComDiaSemana(dateString);
  };

  // Garantir que horariosDisponiveis seja sempre um array
  const horariosArray = Array.isArray(horariosDisponiveis) ? horariosDisponiveis : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
      {/* AppBar com botão de Login */}
      <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RemoveRedEye sx={{ fontSize: 24, color: 'primary.contrastText' }} />
            </Box>
            <Typography variant="h6" color="primary" fontWeight="bold">
              ÓTICADAVÍ
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonIcon />}
            onClick={() => navigate('/login')}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom align="center">
              Agendar Consulta
            </Typography>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Preencha os dados abaixo para agendar sua consulta
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.filial_id}>
                <InputLabel>Selecione uma cidade</InputLabel>
                <Select
                  value={formData.filial_id}
                  label="Selecione uma cidade"
                  onChange={(e) => handleInputChange('filial_id', e.target.value)}
                >
                  {filiais.map(filial => (
                    <MenuItem key={filial.id} value={filial.id}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
                {errors.filial_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.filial_id}
                  </Typography>
                )}
                {selectedCityDoctor && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1, mb: 1, fontWeight: 'medium' }}>
                    Médico: {selectedCityDoctor}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.data_id}>
                <InputLabel>Selecione uma data</InputLabel>
                <Select
                  value={formData.data_id}
                  label="Selecione uma data"
                  onChange={(e) => handleInputChange('data_id', e.target.value)}
                  disabled={!formData.filial_id}
                >
                  {datasDisponiveis.map(data => (
                    <MenuItem key={data.id} value={data.id}>
                      {formatDate(data.data)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.data_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.data_id}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.horario}>
                <InputLabel>Selecione um horário</InputLabel>
                <Select
                  value={formData.horario}
                  label="Selecione um horário"
                  onChange={(e) => handleInputChange('horario', e.target.value)}
                  disabled={!formData.data_id || horariosArray.length === 0}
                >
                  {horariosArray.length > 0 ? (
                    horariosArray.map(horario => (
                      <MenuItem key={horario} value={horario}>
                        {horario}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      Nenhum horário disponível para esta data
                    </MenuItem>
                  )}
                </Select>
                {errors.horario && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.horario}
                  </Typography>
                )}
                {formData.data_id && horariosArray.length === 0 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                    Não há horários configurados para esta data
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Nome do paciente"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                error={!!errors.nome}
                helperText={errors.nome}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <PersonIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                error={!!errors.telefone}
                helperText={errors.telefone}
                placeholder="(99) 99999-9999"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <PhoneIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Informações adicionais"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                multiline
                rows={3}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'uppercase',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Agendar Consulta'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}