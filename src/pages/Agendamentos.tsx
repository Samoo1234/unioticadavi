import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
// DatePicker removido - não usado mais no modal


interface Filial {
  id: string;
  nome: string;
  ativa: boolean;
}

interface Appointment {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  data: string;
  horario: string;
  observacoes?: string;
  informacoes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

interface DataDisponivel {
  id: string;
  data: string;
  filial_id: string;
  medico_id: string;
  ativa: boolean;
  horarios_disponiveis: string[];
}

interface AppointmentFormData {
  nome: string;
  telefone: string;
  filial_id: string;
  data_id: string;
  horario: string;
  observacoes: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

const initialFormData: AppointmentFormData = {
  nome: '',
  telefone: '',
  filial_id: '',
  data_id: '',
  horario: '',
  observacoes: '',
  status: 'pendente'
};

export function Agendamentos() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState<DataDisponivel[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [selectedCityDoctor, setSelectedCityDoctor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filtros
  const [cityFilter, setCityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<AppointmentFormData>>({});

  useEffect(() => {
    loadFiliais();
    loadAppointments();
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
      if (data && data.length > 0 && !cityFilter) {
        setCityFilter(data[0].nome);
      }
    } catch (error: any) {
      console.error('Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais');
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<AppointmentFormData> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      errors.telefone = 'Formato de telefone inválido. Use (99) 99999-9999';
    }

    if (!formData.filial_id) {
      errors.filial_id = 'Cidade é obrigatória';
    }

    if (!formData.data_id) {
      errors.data_id = 'Data é obrigatória';
    }

    if (!formData.horario) {
      errors.horario = 'Horário é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editingAppointment) {
        // Atualizar agendamento existente
        const appointmentData = {
          nome: formData.nome,
          telefone: formData.telefone,
          observacoes: formData.observacoes,
          status: formData.status,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('agendamentos')
          .update(appointmentData)
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Criar novo agendamento
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

        const appointmentData = {
          cidade: filialSelecionada.nome,
          data: dataSelecionada.data,
          horario: formData.horario,
          nome: formData.nome,
          telefone: formData.telefone,
          observacoes: formData.observacoes,
          status: 'pendente', // Status padrão para novos agendamentos
          created_at: new Date().toISOString()
        };

        console.log('📅 Criando agendamento:', appointmentData);

        const { error } = await supabase
          .from('agendamentos')
          .insert([appointmentData]);

        if (error) throw error;
        toast.success('Agendamento criado com sucesso!');
        
        // Log para debug
        console.log('✅ Agendamento criado:', {
          cidade: filialSelecionada.nome,
          data: dataSelecionada.data,
          nome: formData.nome
        });
      }

      handleCloseDialog();
      loadAppointments();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      
      if (error.message && error.message.includes('horário já está agendado')) {
        toast.error(error.message);
        setFormErrors(prev => ({ ...prev, horario: 'Este horário já está agendado' }));
      } else {
        toast.error(error.message || 'Erro ao salvar agendamento');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    
    // Para edição, usar dados simples sem IDs relacionais
    setFormData({
      nome: appointment.nome,
      telefone: appointment.telefone,
      filial_id: '', // Não usado em edição
      data_id: '', // Não usado em edição
      horario: appointment.horario,
      observacoes: appointment.observacoes || appointment.informacoes || '',
      status: appointment.status
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', appointmentToDelete.id);

      if (error) throw error;

      toast.success('Agendamento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      loadAppointments();
    } catch (error: any) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pendente' | 'confirmado' | 'cancelado') => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      loadAppointments();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAppointment(null);
    setFormData(initialFormData);
    setFormErrors({});
    setDatasDisponiveis([]);
    setHorariosDisponiveis([]);
    setSelectedCityDoctor('');
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
        // Gerar horários baseado na configuração
        const { data: configData, error: configError } = await supabase
          .from('configuracoes_horarios')
          .select('*')
          .eq('filial_id', dataSelecionada?.filial_id || '')
          .single();
          
        if (!configError && configData) {
          const slots: string[] = [];
          
          const formatTime = (hours: number, minutes: number) => {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          };
          
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

  const formatPhoneNumber = (value: string) => {
    const phoneDigits = value.replace(/\D/g, '');
    
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

  const handleInputChange = (field: keyof AppointmentFormData, value: string | 'pendente' | 'confirmado' | 'cancelado') => {
    if (field === 'telefone') {
      const formattedPhone = formatPhoneNumber(value as string);
      setFormData(prev => ({ ...prev, [field]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Carregar dados dependentes
    if (field === 'filial_id' && value) {
      loadDatasDisponiveis(value as string);
      setFormData(prev => ({ ...prev, data_id: '', horario: '' }));
      setHorariosDisponiveis([]);
    } else if (field === 'data_id' && value) {
      loadHorariosDisponiveis(value as string);
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  };

  // Obter datas disponíveis com base na cidade selecionada
  const availableDates = [...new Set(
    appointments
      .filter(a => a.cidade === cityFilter)
      .map(a => a.data ? a.data.trim() : '')
  )].sort();

  // Selecionar automaticamente a primeira data disponível quando a cidade é selecionada
  useEffect(() => {
    if (cityFilter && availableDates.length > 0) {
      setDateFilter(availableDates[0]);
    } else {
      setDateFilter('');
    }
  }, [cityFilter]);

  // Filtrar agendamentos
  const filteredAppointments = appointments.filter(appointment => {
    const matchesCity = !cityFilter || appointment.cidade === cityFilter;
    const matchesDate = !dateFilter || (appointment.data ? appointment.data.trim() : '') === (dateFilter ? dateFilter.trim() : '');
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    
    return matchesCity && matchesDate && matchesStatus;
  });

  // Ordenar agendamentos por horário
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    // Converter horários para minutos para facilitar a comparação
    const getMinutes = (time: string) => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    
    const minutesA = getMinutes(a.horario);
    const minutesB = getMinutes(b.horario);
    
    return minutesA - minutesB; // Ordem crescente (manhã para tarde)
  });

  // Estatísticas
  const totalAppointments = filteredAppointments.length;
  const pendingAppointments = filteredAppointments.filter(a => a.status === 'pendente').length;
  const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmado').length;
  const canceledAppointments = filteredAppointments.filter(a => a.status === 'cancelado').length;



  const generatePDF = () => {
    toast.info('Funcionalidade de geração de PDF será implementada em breve.');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      overflowY: 'scroll',
      overflowX: 'hidden',
      padding: 2,
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Gerenciar Agendamentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Controle os agendamentos de clientes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAppointments}
            disabled={submitting}
          >
            Atualizar
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<PdfIcon />}
            onClick={generatePDF}
            disabled={submitting}
          >
            Gerar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Novo Agendamento
          </Button>
        </Box>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <CalendarIcon color="primary" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {totalAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Agendamentos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <CalendarIcon color="warning" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <CalendarIcon color="success" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {confirmedAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <CalendarIcon color="error" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {canceledAppointments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filial</InputLabel>
                <Select
                  value={cityFilter}
                  label="Filial"
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {filiais.map(filial => (
                    <MenuItem key={filial.id} value={filial.nome}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Data</InputLabel>
                <Select
                  value={dateFilter}
                  label="Data"
                  onChange={(e) => setDateFilter(e.target.value)}
                  disabled={!cityFilter || availableDates.length === 0}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {availableDates.map(date => (
                    <MenuItem key={date} value={date}>
                      {date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : date}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de agendamentos */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ width: '100%', overflow: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>Nome</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>Cidade</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Data</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 80 }}>Horário</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 130 }}>Telefone</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 150, maxWidth: 200 }}>Observações</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>Status</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', minWidth: 100 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                        {cityFilter || dateFilter || statusFilter 
                          ? 'Nenhum agendamento encontrado com os filtros aplicados'
                          : 'Nenhum agendamento cadastrado'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {appointment.nome}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                        {appointment.cidade}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {appointment.data ? new Date(appointment.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{appointment.horario}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{appointment.telefone}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {appointment.observacoes || appointment.informacoes || '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment.id, e.target.value as 'pendente' | 'confirmado' | 'cancelado')}
                            size="small"
                            sx={{
                              height: 24,
                              '& .MuiSelect-select': { py: 0 },
                              backgroundColor: 
                                appointment.status === 'pendente' ? '#fff9c4' :
                                appointment.status === 'confirmado' ? '#c8e6c9' :
                                '#ffcdd2',
                              borderRadius: 1
                            }}
                          >
                            <MenuItem value="pendente">Pendente</MenuItem>
                            <MenuItem value="confirmado">Confirmado</MenuItem>
                            <MenuItem value="cancelado">Cancelado</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(appointment)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(appointment)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de adicionar/editar agendamento */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone *"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                error={!!formErrors.telefone}
                helperText={formErrors.telefone}
                placeholder="(99) 99999-9999"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {!editingAppointment && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.filial_id}>
                    <InputLabel>Selecione uma cidade *</InputLabel>
                    <Select
                      value={formData.filial_id}
                      label="Selecione uma cidade *"
                      onChange={(e) => handleInputChange('filial_id', e.target.value)}
                    >
                      {filiais.map(filial => (
                        <MenuItem key={filial.id} value={filial.id}>
                          {filial.nome}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.filial_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {formErrors.filial_id}
                      </Typography>
                    )}
                    {selectedCityDoctor && (
                      <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Médico: {selectedCityDoctor}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.data_id}>
                    <InputLabel>Selecione uma data *</InputLabel>
                    <Select
                      value={formData.data_id}
                      label="Selecione uma data *"
                      onChange={(e) => handleInputChange('data_id', e.target.value)}
                      disabled={!formData.filial_id}
                    >
                      {datasDisponiveis.map(data => (
                        <MenuItem key={data.id} value={data.id}>
                          {data.data ? new Date(data.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : data.data}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.data_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {formErrors.data_id}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.horario}>
                    <InputLabel>Selecione um horário *</InputLabel>
                    <Select
                      value={formData.horario}
                      label="Selecione um horário *"
                      onChange={(e) => handleInputChange('horario', e.target.value)}
                      disabled={!formData.data_id || horariosDisponiveis.length === 0}
                    >
                      {horariosDisponiveis.length > 0 ? (
                        horariosDisponiveis.map(horario => (
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
                    {formErrors.horario && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {formErrors.horario}
                      </Typography>
                    )}
                    {formData.data_id && horariosDisponiveis.length === 0 && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                        Não há horários configurados para esta data
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </>
            )}
            {editingAppointment && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleInputChange('status', e.target.value as 'pendente' | 'confirmado' | 'cancelado')}
                  >
                    <MenuItem value="pendente">Pendente</MenuItem>
                    <MenuItem value="confirmado">Confirmado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o agendamento..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingAppointment ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o agendamento de <strong>{appointmentToDelete?.nome}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agendamentos;