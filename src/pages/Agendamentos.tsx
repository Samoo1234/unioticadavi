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
  PictureAsPdf as PdfIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
import jsPDF from 'jspdf';
import { WebcamCapture } from '../components/WebcamCapture';
import { 
  supabaseCentral, 
  buscarClientePorTelefone, 
  criarClienteCentral,
  gerarCodigoCliente 
} from '../services/supabaseCentral';
// DatePicker removido - não usado mais no modal


interface Filial {
  id: number;
  nome: string;
  ativa: boolean;
}

interface Appointment {
  id: string; // UUID no banco de dados
  nome: string;
  telefone: string;
  cidade: string;
  data: string; // Data separada (date)
  horario: string; // Horário separado (time)
  observacoes?: string;
  informacoes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  created_at: string;
  updated_at: string;
}

interface DataDisponivel {
  id: number;
  data: string;
  filial_id: number;
  medico_id: number;
  ativa: boolean;
  horarios_disponiveis: string[];
}

interface AppointmentFormData {
  nome: string;
  telefone: string;
  filial_id: number;
  data_id: number;
  horario: string;
  observacoes: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

interface ClientFormData {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  rg: string;
  sexo: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar' | '';
  data_nascimento: string;
  nome_pai: string;
  nome_mae: string;
  endereco: string;
  cidade: string;
  foto_url: string;
  observacoes: string;
}

const initialFormData: AppointmentFormData = {
  nome: '',
  telefone: '',
  filial_id: 0,
  data_id: 0,
  horario: '',
  observacoes: '',
  status: 'pendente'
};

export function Agendamentos() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState<DataDisponivel[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [selectedCityDoctor, setSelectedCityDoctor] = useState<number>(0);
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
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<boolean | null>(null);

  // Client registration dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    rg: '',
    sexo: '',
    data_nascimento: '',
    nome_pai: '',
    nome_mae: '',
    endereco: '',
    cidade: '',
    foto_url: '',
    observacoes: ''
  });
  const [clientFormErrors, setClientFormErrors] = useState<Partial<ClientFormData>>({});

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

  /**
   * Buscar cliente no banco central por telefone
   * Se não existir, cria um cadastro básico (nome + telefone)
   */
  const buscarOuCriarCliente = async (telefone: string, nome: string) => {
    try {
      setBuscandoCliente(true);
      
      // Limpar telefone (remover caracteres especiais)
      const telefoneLimpo = telefone.replace(/\D/g, '');
      
      if (telefoneLimpo.length < 10) {
        return; // Telefone incompleto
      }
      
      // Buscar cliente existente no banco central
      const clienteExistente = await buscarClientePorTelefone(telefone);
      
      if (clienteExistente) {
        // Cliente encontrado - preencher nome automaticamente
        setFormData(prev => ({ ...prev, nome: clienteExistente.nome }));
        setClienteEncontrado(true);
        toast.info(`Cliente encontrado: ${clienteExistente.nome}`);
      } else if (nome.trim()) {
        // Cliente não existe e temos nome - criar cadastro básico no banco central
        await criarClienteCentral({
          nome: nome.trim(),
          telefone: telefone,
          cadastro_completo: false
        });
        setClienteEncontrado(false);
        toast.success('Cliente cadastrado no sistema central!');
      } else {
        setClienteEncontrado(false);
      }
    } catch (error: any) {
      console.error('Erro ao buscar/criar cliente:', error);
      toast.warning('Erro ao sincronizar com banco central');
      setClienteEncontrado(null);
    } finally {
      setBuscandoCliente(false);
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

  const validateForm = (isEditing: boolean = false): boolean => {
    const errors: Partial<Record<keyof AppointmentFormData, string>> = {};

    // Validação de nome
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.nome.trim().length > 100) {
      errors.nome = 'Nome deve ter no máximo 100 caracteres';
    }

    // Validação de telefone
    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
      errors.telefone = 'Formato de telefone inválido. Use (99) 99999-9999';
    }

    // Validações apenas para NOVO agendamento (não para edição)
    if (!isEditing) {
      // Validação de filial
      if (!formData.filial_id || formData.filial_id === 0) {
        errors.filial_id = 'Filial é obrigatória';
      }

      // Validação de data
      if (!formData.data_id || formData.data_id === 0) {
        errors.data_id = 'Data é obrigatória';
      }

      // Validação de horário
      if (!formData.horario) {
        errors.horario = 'Horário é obrigatório';
      }
    }

    // Validação de observações (opcional, mas com limite)
    if (formData.observacoes && formData.observacoes.length > 500) {
      errors.observacoes = 'Observações devem ter no máximo 500 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm(!!editingAppointment)) {
      return;
    }

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

        // Garantir que cliente existe no banco central
        try {
          const clienteExistente = await buscarClientePorTelefone(formData.telefone);
          if (!clienteExistente) {
            // Criar cliente no banco central
            await criarClienteCentral({
              nome: formData.nome,
              telefone: formData.telefone,
              cidade: filialSelecionada.nome,
              cadastro_completo: false
            });
            console.log('✅ Cliente criado no banco central');
          }
        } catch (apiError: any) {
          console.warn('Erro ao sincronizar cliente com banco central:', apiError);
          toast.warning('Cliente não foi sincronizado com banco central');
          // Continuar mesmo se falhar - não bloquear agendamento
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
      filial_id: 0, // Não usado em edição
      data_id: 0, // Não usado em edição
      horario: appointment.horario || '', // Horário já vem separado do banco
      observacoes: appointment.observacoes || '',
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
    setSelectedCityDoctor(0);
    // Limpar estados de busca de cliente
    setBuscandoCliente(false);
    setClienteEncontrado(null);
  };

  // Funções para cadastro de cliente
  const handleOpenClientDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setClientFormData({
      nome: appointment.nome,
      telefone: appointment.telefone,
      email: '',
      cpf: '',
      rg: '',
      sexo: '',
      data_nascimento: '',
      nome_pai: '',
      nome_mae: '',
      endereco: '',
      cidade: appointment.cidade,
      foto_url: '',
      observacoes: ''
    });
    setClientDialogOpen(true);
  };

  const handleCloseClientDialog = () => {
    setClientDialogOpen(false);
    setSelectedAppointment(null);
    setClientFormData({
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      rg: '',
      sexo: '',
      data_nascimento: '',
      nome_pai: '',
      nome_mae: '',
      endereco: '',
      cidade: '',
      foto_url: '',
      observacoes: ''
    });
    setClientFormErrors({});
  };

  const validateClientForm = (): boolean => {
    const errors: Partial<ClientFormData> = {};

    if (!clientFormData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!clientFormData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    }

    if (clientFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientFormData.email)) {
      errors.email = 'Email inválido';
    }

    if (clientFormData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(clientFormData.cpf)) {
      errors.cpf = 'CPF inválido. Use o formato 000.000.000-00';
    }

    setClientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClient = async () => {
    if (!validateClientForm()) return;

    try {
      setSubmitting(true);

      // Verificar se o cliente já existe no banco CENTRAL pelo telefone ou CPF
      let existingClient = null;
      
      if (clientFormData.cpf) {
        const { data } = await supabaseCentral
          .from('clientes')
          .select('*')
          .eq('cpf', clientFormData.cpf)
          .limit(1)
          .single();
        existingClient = data;
      }
      
      if (!existingClient) {
        const { data } = await supabaseCentral
          .from('clientes')
          .select('*')
          .eq('telefone', clientFormData.telefone.replace(/\D/g, ''))
          .limit(1)
          .single();
        existingClient = data;
      }

      if (existingClient) {
        // Cliente já existe - atualizar para cadastro completo
        const codigoCliente = existingClient.codigo || await gerarCodigoCliente(clientFormData.cidade);
        
        const { error: updateError } = await supabaseCentral
          .from('clientes')
          .update({
            codigo: codigoCliente,
            nome: clientFormData.nome,
            email: clientFormData.email || null,
            cpf: clientFormData.cpf || null,
            rg: clientFormData.rg || null,
            sexo: clientFormData.sexo || null,
            data_nascimento: clientFormData.data_nascimento || null,
            nome_pai: clientFormData.nome_pai || null,
            nome_mae: clientFormData.nome_mae || null,
            cidade: clientFormData.cidade || null,
            endereco: clientFormData.endereco ? { rua: clientFormData.endereco, cidade: clientFormData.cidade } : null,
            foto_url: clientFormData.foto_url || null,
            observacoes: clientFormData.observacoes || null,
            cadastro_completo: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClient.id);

        if (updateError) throw updateError;

        toast.success(`Cliente atualizado com cadastro completo! Código: ${codigoCliente}`);
        handleCloseClientDialog();
        return;
      }

      // Cliente não existe - criar novo com cadastro completo
      const codigoCliente = await gerarCodigoCliente(clientFormData.cidade);

      // Preparar dados do cliente para o banco CENTRAL
      const clientData = {
        codigo: codigoCliente,
        nome: clientFormData.nome,
        telefone: clientFormData.telefone.replace(/\D/g, ''),
        email: clientFormData.email || null,
        cpf: clientFormData.cpf || null,
        rg: clientFormData.rg || null,
        sexo: clientFormData.sexo || null,
        data_nascimento: clientFormData.data_nascimento || null,
        nome_pai: clientFormData.nome_pai || null,
        nome_mae: clientFormData.nome_mae || null,
        cidade: clientFormData.cidade || null,
        endereco: clientFormData.endereco ? { rua: clientFormData.endereco, cidade: clientFormData.cidade } : null,
        foto_url: clientFormData.foto_url || null,
        observacoes: clientFormData.observacoes || null,
        cadastro_completo: true, // Cadastro completo desde já
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabaseCentral
        .from('clientes')
        .insert([clientData]);

      if (insertError) throw insertError;

      toast.success(`Cliente cadastrado com sucesso! Código: ${codigoCliente}`);
      handleCloseClientDialog();
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientInputChange = (field: keyof ClientFormData, value: string) => {
    setClientFormData(prev => ({ ...prev, [field]: value }));
    
    if (clientFormErrors[field]) {
      setClientFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoCapture = (imageUrl: string) => {
    setClientFormData(prev => ({ ...prev, foto_url: imageUrl }));
  };

  const loadDatasDisponiveis = async (filialId: number) => {
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
            setSelectedCityDoctor(filialDates[0].medico_id);
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

  const loadHorariosDisponiveis = async (dataId: number) => {
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
            if (!start || !end || !start.includes(':') || !end.includes(':')) return;
            
            const [startHours, startMinutes] = start.split(':').map(Number);
            const [endHours, endMinutes] = end.split(':').map(Number);
            
            if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) return;
            
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

  const handleInputChange = (field: keyof AppointmentFormData, value: string | number | 'pendente' | 'confirmado' | 'cancelado') => {
    if (field === 'telefone') {
      const formattedPhone = formatPhoneNumber(value as string);
      setFormData(prev => ({ ...prev, [field]: formattedPhone }));
      
      // Buscar cliente automaticamente quando telefone estiver completo
      const telefoneLimpo = formattedPhone.replace(/\D/g, '');
      if (telefoneLimpo.length === 11 || telefoneLimpo.length === 10) {
        // Telefone completo - buscar cliente
        buscarOuCriarCliente(formattedPhone, formData.nome);
      } else {
        setClienteEncontrado(null);
      }
    } else if (field === 'filial_id' || field === 'data_id') {
      // Campos numéricos
      setFormData(prev => ({ ...prev, [field]: typeof value === 'number' ? value : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Carregar dados dependentes
    if (field === 'filial_id' && value) {
      loadDatasDisponiveis(Number(value));
      setFormData(prev => ({ ...prev, data_id: 0, horario: '' }));
      setHorariosDisponiveis([]);
    } else if (field === 'data_id' && value) {
      loadHorariosDisponiveis(Number(value));
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  };

  // Obter datas disponíveis com base na cidade selecionada
  const availableDates = [...new Set(
    appointments
      .filter(a => a.cidade === cityFilter)
      .map(a => a.data)
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
    const matchesDate = !dateFilter || appointment.data === dateFilter;
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    
    return matchesCity && matchesDate && matchesStatus;
  });

  // Ordenar agendamentos por horário
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    // Converter horários para minutos para facilitar a comparação
    const getMinutes = (time: string | null | undefined) => {
      if (!time || typeof time !== 'string' || !time.includes(':')) return 0;
      try {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return (hours * 60) + minutes;
      } catch {
        return 0;
      }
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
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      let yPosition = margin;

      // Cabeçalho da empresa
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('GESTÃO ÓTICA', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório de Agendamentos', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Data de geração
      const dataAtual = new Date();
      const dataFormatada = dataAtual.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataFormatada}`, margin, yPosition);
      yPosition += 10;

      // Filtros aplicados
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros Aplicados:', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (cityFilter) {
        doc.text(`• Filial: ${cityFilter}`, margin + 5, yPosition);
        yPosition += 6;
      }
      
      if (dateFilter) {
        const dataFiltro = new Date(dateFilter + 'T00:00:00').toLocaleDateString('pt-BR');
        doc.text(`• Data: ${dataFiltro}`, margin + 5, yPosition);
        yPosition += 6;
      }
      
      if (statusFilter) {
        const statusTexto = statusFilter === 'pendente' ? 'Pendente' : 
                           statusFilter === 'confirmado' ? 'Confirmado' : 'Cancelado';
        doc.text(`• Status: ${statusTexto}`, margin + 5, yPosition);
        yPosition += 6;
      }
      
      if (!cityFilter && !dateFilter && !statusFilter) {
        doc.text('• Nenhum filtro aplicado (todos os agendamentos)', margin + 5, yPosition);
        yPosition += 6;
      }
      
      yPosition += 10;

      // Resumo estatístico
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo:', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Agendamentos: ${totalAppointments}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Pendentes: ${pendingAppointments}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Confirmados: ${confirmedAppointments}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Cancelados: ${canceledAppointments}`, margin + 5, yPosition);
      yPosition += 15;

      // Tabela de agendamentos
      if (sortedAppointments.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalhes dos Agendamentos:', margin, yPosition);
        yPosition += 10;

        // Cabeçalho da tabela
        const colWidths = [35, 25, 25, 20, 30, 35, 25];
        const headers = ['Nome', 'Filial', 'Data', 'Horário', 'Telefone', 'Observações', 'Status'];
        
        doc.setFillColor(41, 128, 185);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        let xPos = margin;
        doc.rect(margin, yPosition, pageWidth - (margin * 2), lineHeight, 'F');
        
        headers.forEach((header, index) => {
          doc.text(header, xPos + 2, yPosition + 5);
          xPos += colWidths[index];
        });
        
        yPosition += lineHeight;

        // Dados da tabela
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        sortedAppointments.forEach((appointment, index) => {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          // Alternar cor de fundo
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition, pageWidth - (margin * 2), lineHeight, 'F');
          }

          xPos = margin;
          
          // Nome
          const nome = appointment.nome.length > 20 ? appointment.nome.substring(0, 17) + '...' : appointment.nome;
          doc.text(nome, xPos + 2, yPosition + 5);
          xPos += colWidths[0];
          
          // Filial
          const filial = appointment.cidade.length > 15 ? appointment.cidade.substring(0, 12) + '...' : appointment.cidade;
          doc.text(filial, xPos + 2, yPosition + 5);
          xPos += colWidths[1];
          
          // Data
          const dataFormatada = appointment.data ? new Date(appointment.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
          doc.text(dataFormatada, xPos + 2, yPosition + 5);
          xPos += colWidths[2];
          
          // Horário
          doc.text(appointment.horario || '-', xPos + 2, yPosition + 5);
          xPos += colWidths[3];
          
          // Telefone
          doc.text(appointment.telefone || '-', xPos + 2, yPosition + 5);
          xPos += colWidths[4];
          
          // Observações
          const obs = (appointment.observacoes || appointment.informacoes || '-');
          const obsTexto = obs.length > 20 ? obs.substring(0, 17) + '...' : obs;
          doc.text(obsTexto, xPos + 2, yPosition + 5);
          xPos += colWidths[5];
          
          // Status
          const statusTexto = appointment.status === 'pendente' ? 'Pendente' : 
                             appointment.status === 'confirmado' ? 'Confirmado' : 'Cancelado';
          doc.text(statusTexto, xPos + 2, yPosition + 5);
          
          yPosition += lineHeight;
        });
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhum agendamento encontrado com os filtros aplicados.', margin, yPosition);
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${totalPages} - Gerado em ${dataFormatada}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Salvar o PDF
      const nomeArquivo = `agendamentos_${dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-')}_${dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-')}.pdf`;
      doc.save(nomeArquivo);
      
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório PDF. Tente novamente.');
    }
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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{appointment.horario || '-'}</TableCell>
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
                        <Tooltip title="Cadastrar Cliente">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenClientDialog(appointment)}
                            color="success"
                          >
                            <PersonAddIcon />
                          </IconButton>
                        </Tooltip>
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
                helperText={
                  formErrors.telefone ||
                  (buscandoCliente ? 'Buscando cliente...' : '') ||
                  (clienteEncontrado === true ? 'Cliente encontrado no sistema!' : '') ||
                  (clienteEncontrado === false ? 'Novo cliente será cadastrado' : '')
                }
                placeholder="(99) 99999-9999"
                color={clienteEncontrado === true ? 'success' : undefined}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color={clienteEncontrado === true ? 'success' : undefined} />
                    </InputAdornment>
                  ),
                  endAdornment: buscandoCliente ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
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

      {/* Dialog de cadastro de cliente */}
      <Dialog open={clientDialogOpen} onClose={handleCloseClientDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Cadastrar Cliente
          <Typography variant="caption" display="block" color="text.secondary">
            Dados do agendamento: {selectedAppointment?.nome}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Foto */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <WebcamCapture 
                onCapture={handlePhotoCapture}
                currentImage={clientFormData.foto_url}
              />
            </Grid>

            {/* Nome e Telefone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={clientFormData.nome}
                onChange={(e) => handleClientInputChange('nome', e.target.value)}
                error={!!clientFormErrors.nome}
                helperText={clientFormErrors.nome}
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
                value={clientFormData.telefone}
                onChange={(e) => handleClientInputChange('telefone', e.target.value)}
                error={!!clientFormErrors.telefone}
                helperText={clientFormErrors.telefone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Email e Sexo */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={clientFormData.email}
                onChange={(e) => handleClientInputChange('email', e.target.value)}
                error={!!clientFormErrors.email}
                helperText={clientFormErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={clientFormData.sexo}
                  label="Sexo"
                  onChange={(e) => handleClientInputChange('sexo', e.target.value)}
                >
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="feminino">Feminino</MenuItem>
                  <MenuItem value="outro">Outro</MenuItem>
                  <MenuItem value="prefiro_nao_informar">Prefiro não informar</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* CPF e RG */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF"
                value={clientFormData.cpf}
                onChange={(e) => handleClientInputChange('cpf', e.target.value)}
                error={!!clientFormErrors.cpf}
                helperText={clientFormErrors.cpf}
                placeholder="000.000.000-00"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RG"
                value={clientFormData.rg}
                onChange={(e) => handleClientInputChange('rg', e.target.value)}
              />
            </Grid>

            {/* Data de Nascimento */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={clientFormData.data_nascimento}
                onChange={(e) => handleClientInputChange('data_nascimento', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Cidade */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={clientFormData.cidade}
                onChange={(e) => handleClientInputChange('cidade', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Filiação */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Pai"
                value={clientFormData.nome_pai}
                onChange={(e) => handleClientInputChange('nome_pai', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome da Mãe"
                value={clientFormData.nome_mae}
                onChange={(e) => handleClientInputChange('nome_mae', e.target.value)}
              />
            </Grid>

            {/* Endereço */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                value={clientFormData.endereco}
                onChange={(e) => handleClientInputChange('endereco', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                value={clientFormData.observacoes}
                onChange={(e) => handleClientInputChange('observacoes', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClientDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveClient}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {submitting ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agendamentos;