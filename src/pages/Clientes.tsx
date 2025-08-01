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
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  data_nascimento?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientFormData {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  observacoes: string;
}

const initialFormData: ClientFormData = {
  nome: '',
  telefone: '',
  email: '',
  endereco: '',
  cidade: '',
  data_nascimento: '',
  observacoes: ''
};

export function Clientes() {
  const { } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<ClientFormData>>({});

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (error) throw error;

      setClients(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ClientFormData> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.telefone.trim()) {
      errors.telefone = 'Telefone é obrigatório';
    } else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(formData.telefone)) {
      errors.telefone = 'Formato de telefone inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const clientData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingClient) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([{
            ...clientData,
            ativo: true,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Cliente criado com sucesso!');
      }

      handleCloseDialog();
      loadClients();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome,
      telefone: client.telefone,
      email: client.email || '',
      endereco: client.endereco || '',
      cidade: client.cidade || '',
      data_nascimento: client.data_nascimento || '',
      observacoes: client.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      setSubmitting(true);

      // Verificar se o cliente tem agendamentos
      const { data: appointments, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('cliente_nome', clientToDelete.nome)
        .limit(1);

      if (appointmentsError) throw appointmentsError;

      if (appointments && appointments.length > 0) {
        // Se tem agendamentos, apenas desativar
        const { error } = await supabase
          .from('clientes')
          .update({ 
            ativo: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientToDelete.id);

        if (error) throw error;
        toast.success('Cliente desativado com sucesso!');
      } else {
        // Se não tem agendamentos, pode excluir
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', clientToDelete.id);

        if (error) throw error;
        toast.success('Cliente excluído com sucesso!');
      }

      setDeleteDialogOpen(false);
      setClientToDelete(null);
      loadClients();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('clientes')
        .update({ 
          ativo: !client.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success(`Cliente ${!client.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      loadClients();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.telefone.includes(searchTerm) ||
                         (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.ativo) ||
                         (statusFilter === 'inactive' && !client.ativo);
    
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.ativo).length;
  const inactiveClients = totalClients - activeClients;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os clientes do sistema
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadClients}
            disabled={submitting}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalClients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Clientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeClients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Ativos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {inactiveClients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Inativos
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
            <Grid item xs={12} sm={6} md={8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Ativos</MenuItem>
                  <MenuItem value="inactive">Inativos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de clientes */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Cidade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data de Cadastro</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Nenhum cliente encontrado com os filtros aplicados'
                          : 'Nenhum cliente cadastrado'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {client.nome}
                        </Typography>
                      </TableCell>
                      <TableCell>{client.telefone}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.cidade || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={client.ativo ? 'Ativo' : 'Inativo'}
                          color={client.ativo ? 'success' : 'error'}
                          size="small"
                          onClick={() => handleToggleStatus(client)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(client)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(client)}
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

      {/* Dialog de adicionar/editar cliente */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
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
                placeholder="(11) 99999-9999"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
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
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre o cliente..."
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
            {submitting ? <CircularProgress size={20} /> : (editingClient ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.nome}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Se o cliente tiver agendamentos associados, ele será apenas desativado.
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

export default Clientes;