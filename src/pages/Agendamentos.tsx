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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';


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

interface AppointmentFormData {
  nome: string;
  telefone: string;
  cidade: string;
  data: string;
  horario: string;
  observacoes: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

const initialFormData: AppointmentFormData = {
  nome: '',
  telefone: '',
  cidade: '',
  data: '',
  horario: '',
  observacoes: '',
  status: 'pendente'
};

export function Agendamentos() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
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

    if (!formData.cidade) {
      errors.cidade = 'Cidade é obrigatória';
    }

    if (!formData.data) {
      errors.data = 'Data é obrigatória';
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

      const appointmentData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingAppointment) {
        // Atualizar agendamento existente
        const { error } = await supabase
          .from('agendamentos')
          .update(appointmentData)
          .eq('id', editingAppointment.id);

        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        // Criar novo agendamento
        const { error } = await supabase
          .from('agendamentos')
          .insert([{
            ...appointmentData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Agendamento criado com sucesso!');
      }

      handleCloseDialog();
      loadAppointments();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      nome: appointment.nome,
      telefone: appointment.telefone,
      cidade: appointment.cidade,
      data: appointment.data,
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
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: string | 'pendente' | 'confirmado' | 'cancelado') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!formErrors.cidade}>
                <InputLabel>Filial *</InputLabel>
                <Select
                  value={formData.cidade}
                  label="Filial *"
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                >
                  {filiais.map(filial => (
                    <MenuItem key={filial.id} value={filial.nome}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.cidade && (
                  <Typography variant="caption" color="error">
                    {formErrors.cidade}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Data *"
                value={formData.data ? new Date(formData.data + 'T00:00:00') : null}
                onChange={(novaData) => {
                  if (novaData) {
                    const dataISO = novaData.toISOString().split('T')[0]
                    handleInputChange('data', dataISO)
                  } else {
                    handleInputChange('data', '')
                  }
                }}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.data,
                    helperText: formErrors.data
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Horário *"
                type="time"
                value={formData.horario}
                onChange={(e) => handleInputChange('horario', e.target.value)}
                error={!!formErrors.horario}
                helperText={formErrors.horario}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
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