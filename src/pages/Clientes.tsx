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
import { 
  listarClientesCentral, 
  criarClienteCentral, 
  atualizarClienteCentral, 
  excluirClienteCentral,
  ClienteCentral 
} from '../services/supabaseCentral';

// Interface local (mantida para compatibilidade com Supabase local)
interface Client {
  id: string;
  codigo?: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  rg?: string;
  sexo?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';
  endereco?: string | { rua?: string; cidade?: string };
  cidade?: string;
  data_nascimento?: string;
  nome_pai?: string;
  nome_mae?: string;
  foto_url?: string;
  observacoes?: string;
  active: boolean;
  cadastro_completo?: boolean; // Flag da API central
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
      
      // Buscar clientes do banco CENTRAL
      const clientesCentralizados = await listarClientesCentral();
      
      // Converter para formato local
      const clientesFormatados: Client[] = clientesCentralizados.map((c: ClienteCentral) => ({
        id: c.id,
        codigo: c.codigo,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        cpf: c.cpf,
        endereco: c.endereco,
        cidade: c.cidade,
        cadastro_completo: c.cadastro_completo,
        active: c.active ?? true,
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString()
      }));
      
      // Ordenar por nome
      clientesFormatados.sort((a, b) => a.nome.localeCompare(b.nome));
      
      setClients(clientesFormatados);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes do banco central');
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

      if (editingClient) {
        // Atualizar cliente existente no banco CENTRAL
        await atualizarClienteCentral(editingClient.id, {
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email || undefined,
          endereco: formData.endereco ? { rua: formData.endereco, cidade: formData.cidade } : undefined,
          cidade: formData.cidade || undefined,
          cadastro_completo: true // Marcando como completo ao editar
        });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente no banco CENTRAL
        await criarClienteCentral({
          nome: formData.nome,
          telefone: formData.telefone,
          cidade: formData.cidade || undefined,
          cadastro_completo: !!(formData.email || formData.endereco || formData.cidade)
        });
        toast.success('Cliente criado com sucesso!');
      }

      handleCloseDialog();
      loadClients();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.message || 'Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    
    // Extrair endereço do JSONB se for objeto
    let enderecoStr = '';
    if (client.endereco) {
      if (typeof client.endereco === 'object' && 'rua' in client.endereco) {
        enderecoStr = (client.endereco as any).rua || '';
      } else if (typeof client.endereco === 'string') {
        enderecoStr = client.endereco;
      }
    }
    
    setFormData({
      nome: client.nome,
      telefone: client.telefone,
      email: client.email || '',
      endereco: enderecoStr,
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

      // Verificar se o cliente tem agendamentos no Supabase local
      const { data: appointments, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('telefone', clientToDelete.telefone) // Buscar por telefone
        .limit(1);

      if (appointmentsError) throw appointmentsError;

      if (appointments && appointments.length > 0) {
        toast.warning('Cliente possui agendamentos e não pode ser excluído!');
        setDeleteDialogOpen(false);
        setClientToDelete(null);
        return;
      }

      // Excluir do banco CENTRAL
      await excluirClienteCentral(clientToDelete.id);
      toast.success('Cliente excluído com sucesso!');

      setDeleteDialogOpen(false);
      setClientToDelete(null);
      loadClients();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error(error.message || 'Erro ao excluir cliente');
    } finally {
      setSubmitting(false);
    }
  };

  // NOTA: Função desabilitada - API central não tem status ativo/inativo ainda
  // const handleToggleStatus = async (client: Client) => {
  //   // Implementar quando API central suportar status
  // };

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
                         (statusFilter === 'completo' && client.cadastro_completo) ||
                         (statusFilter === 'basico' && !client.cadastro_completo);
    
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const totalClients = clients.length;
  const completoClients = clients.filter(c => c.cadastro_completo).length;
  const basicoClients = totalClients - completoClients;

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
                    {completoClients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cadastros Completos
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
                <PersonIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {basicoClients}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cadastros Básicos
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
                  <MenuItem value="completo">Cadastro Completo</MenuItem>
                  <MenuItem value="basico">Cadastro Básico</MenuItem>
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
                  <TableCell>Código</TableCell>
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
                    <TableCell colSpan={8} align="center">
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
                        <Chip 
                          label={client.codigo || 'N/A'} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
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
                          label={client.cadastro_completo ? 'Completo' : 'Básico'}
                          color={client.cadastro_completo ? 'success' : 'warning'}
                          size="small"
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