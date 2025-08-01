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
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  RemoveRedEye
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

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
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState<DataDisponivel[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    loadFiliais();
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
    } catch (error: any) {
      console.error('Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais');
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      console.error('Erro ao carregar datas disponíveis:', error);
      toast.error('Erro ao carregar datas disponíveis');
    }
  };

  const loadHorariosDisponiveis = async (dataId: string) => {
    try {
      const dataSelecionada = datasDisponiveis.find(d => d.id === dataId);
      
      if (dataSelecionada && dataSelecionada.horarios_disponiveis && Array.isArray(dataSelecionada.horarios_disponiveis)) {
        setHorariosDisponiveis(dataSelecionada.horarios_disponiveis);
      } else {
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, telefone: formattedPhone }));
    
    if (errors.telefone && formattedPhone.replace(/\D/g, '').length >= 10) {
      setErrors(prev => ({ ...prev, telefone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else {
      const phoneDigits = formData.telefone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        newErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos (com DDD)';
      }
    }

    if (!formData.filial_id) {
      newErrors.filial_id = 'Selecione uma filial';
    }

    if (!formData.data_id) {
      newErrors.data_id = 'Selecione uma data';
    }

    if (!formData.horario) {
      newErrors.horario = 'Selecione um horário';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const dataSelecionada = datasDisponiveis.find(d => d.id === formData.data_id);
      const filialSelecionada = filiais.find(f => f.id === formData.filial_id);

      if (!dataSelecionada || !filialSelecionada) {
        throw new Error('Data ou filial não encontrada');
      }

      const appointmentData = {
        nome: formData.nome,
        telefone: formData.telefone,
        data: dataSelecionada.data,
        horario: formData.horario,
        cidade: filialSelecionada.nome,
        status: 'pendente',
        observacoes: formData.observacoes || null
      };

      const { error } = await supabase
        .from('agendamentos')
        .insert([appointmentData]);

      if (error) throw error;

      toast.success('Consulta agendada com sucesso! Aguarde a confirmação.');
      
      // Limpar formulário
      setFormData(initialFormData);
      setErrors({});
      setHorariosDisponiveis([]);
    } catch (error: any) {
      console.error('Erro ao agendar consulta:', error);
      toast.error(error.message || 'Erro ao agendar consulta');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const weekdays = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    
    const weekday = weekdays[date.getDay()];
    return `${day}/${month}/${year} - ${weekday}`;
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