import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  VisibilityOff
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  nome: string;
  role: 'super_admin' | 'admin' | 'manager' | 'receptionist' | 'doctor' | 'financial' | 'user';
  filial_id?: string;
  ativo: boolean;
  senha_temporaria: boolean;
  ultimo_login?: string;
  created_at: string;
  updated_at: string;
}

interface Filial {
  id: string;
  nome: string;
  ativo: boolean;
}

interface UserFormData {
  nome: string;
  email: string;
  role: string;
  filial_id: string;
  ativo: boolean;
  senha_temporaria: string;
}

interface Permission {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

interface UserPermission {
  permission_id: string;
  granted: boolean;
}

const initialFormData: UserFormData = {
  nome: '',
  email: '',
  role: 'user',
  filial_id: '',
  ativo: true,
  senha_temporaria: 'Temp123!'
};

const roleOptions = [
  { value: 'super_admin', label: 'Super Administrador', color: 'error' },
  { value: 'admin', label: 'Administrador', color: 'warning' },
  { value: 'manager', label: 'Gerente', color: 'info' },
  { value: 'receptionist', label: 'Recepcionista', color: 'primary' },
  { value: 'doctor', label: 'Médico', color: 'success' },
  { value: 'financial', label: 'Financeiro', color: 'secondary' },
  { value: 'user', label: 'Usuário', color: 'default' }
];

const permissionCategories = {
  'agendamentos': 'Agendamentos',
  'clientes': 'Clientes',
  'medicos': 'Médicos',
  'filiais': 'Filiais',
  'financeiro': 'Financeiro',
  'relatorios': 'Relatórios',
  'usuarios': 'Usuários',
  'sistema': 'Sistema'
};

export function Usuarios() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Carregar filiais
      const { data: filiaisData, error: filiaisError } = await supabase
        .from('filiais')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .order('nome');

      if (filiaisError) throw filiaisError;
      setFiliais(filiaisData || []);

      // Carregar permissões disponíveis
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissoes')
        .select('*')
        .order('categoria, nome');

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

    } catch (error: any) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuario_permissoes')
        .select('permission_id, granted')
        .eq('user_id', userId);

      if (error) throw error;
      setUserPermissions(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar permissões do usuário:', error);
      toast.error('Erro ao carregar permissões do usuário');
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.role) {
      errors.role = 'Função é obrigatória';
    }

    if (!editingUser && !formData.senha_temporaria.trim()) {
      errors.senha_temporaria = 'Senha temporária é obrigatória';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const userData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        filial_id: formData.filial_id || null,
        ativo: formData.ativo,
        senha_temporaria: !editingUser,
        updated_at: new Date().toISOString()
      };

      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        // Primeiro criar no auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.senha_temporaria,
          email_confirm: true
        });

        if (authError) throw authError;

        // Depois criar na tabela usuarios
        const { error: userError } = await supabase
          .from('usuarios')
          .insert([{
            id: authData.user.id,
            ...userData,
            created_at: new Date().toISOString()
          }]);

        if (userError) throw userError;
        toast.success('Usuário criado com sucesso!');
      }

      handleCloseDialog();
      loadInitialData();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      role: user.role,
      filial_id: user.filial_id || '',
      ativo: user.ativo,
      senha_temporaria: 'Temp123!'
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setSubmitting(true);

      // Verificar se é o próprio usuário
      if (userToDelete.id === userData?.id) {
        toast.error('Você não pode excluir sua própria conta');
        return;
      }

      // Desativar usuário em vez de excluir
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast.success('Usuário desativado com sucesso!');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadInitialData();
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      toast.error('Erro ao desativar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionsClick = async (user: User) => {
    setEditingUser(user);
    await loadUserPermissions(user.id);
    setPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setUserPermissions(prev => {
      const existing = prev.find(p => p.permission_id === permissionId);
      if (existing) {
        return prev.map(p => 
          p.permission_id === permissionId 
            ? { ...p, granted }
            : p
        );
      } else {
        return [...prev, { permission_id: permissionId, granted }];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;

    try {
      setSubmitting(true);

      // Remover permissões existentes
      await supabase
        .from('usuario_permissoes')
        .delete()
        .eq('user_id', editingUser.id);

      // Inserir novas permissões
      const permissionsToInsert = userPermissions
        .filter(p => p.granted)
        .map(p => ({
          user_id: editingUser.id,
          permission_id: p.permission_id,
          granted: true,
          created_at: new Date().toISOString()
        }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('usuario_permissoes')
          .insert(permissionsToInsert);

        if (error) throw error;
      }

      toast.success('Permissões atualizadas com sucesso!');
      setPermissionsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getRoleColor = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption?.color || 'default';
  };

  const getRoleLabel = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption?.label || role;
  };

  const getFilialName = (filialId?: string) => {
    if (!filialId) return 'Todas';
    const filial = filiais.find(f => f.id === filialId);
    return filial?.nome || 'N/A';
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.categoria]) {
      acc[permission.categoria] = [];
    }
    acc[permission.categoria].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
            Usuários
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os usuários e suas permissões no sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {users.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Usuários
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {users.filter(u => u.ativo).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuários Ativos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AdminIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administradores
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {users.filter(u => u.senha_temporaria).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Senhas Temporárias
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de usuários */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Filial</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Último Login</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                        Nenhum usuário encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {user.nome}
                          </Typography>
                          {user.senha_temporaria && (
                            <Tooltip title="Senha temporária">
                              <SecurityIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{getFilialName(user.filial_id)}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.ativo ? 'Ativo' : 'Inativo'}
                          color={user.ativo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.ultimo_login 
                          ? new Date(user.ultimo_login).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Permissões">
                          <IconButton
                            size="small"
                            onClick={() => handlePermissionsClick(user)}
                            color="info"
                          >
                            <SecurityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Desativar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(user)}
                            color="error"
                            disabled={user.id === userData?.id}
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

      {/* Dialog de adicionar/editar usuário */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={!!editingUser}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel>Função *</InputLabel>
                <Select
                  value={formData.role}
                  label="Função *"
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Filial</InputLabel>
                <Select
                  value={formData.filial_id}
                  label="Filial"
                  onChange={(e) => handleInputChange('filial_id', e.target.value)}
                >
                  <MenuItem value="">Todas as filiais</MenuItem>
                  {filiais.map((filial) => (
                    <MenuItem key={filial.id} value={filial.id}>
                      {filial.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!editingUser && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha Temporária *"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha_temporaria}
                  onChange={(e) => handleInputChange('senha_temporaria', e.target.value)}
                  error={!!formErrors.senha_temporaria}
                  helperText={formErrors.senha_temporaria || 'O usuário deverá alterar na primeira entrada'}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <ViewIcon />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  />
                }
                label="Usuário ativo"
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
            {submitting ? <CircularProgress size={20} /> : (editingUser ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de permissões */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Permissões de {editingUser?.nome}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Configure as permissões específicas para este usuário. As permissões são organizadas por categoria.
          </Alert>
          
          {Object.entries(groupedPermissions).map(([categoria, categoryPermissions]) => (
            <Card key={categoria} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {permissionCategories[categoria as keyof typeof permissionCategories] || categoria}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormGroup>
                  {categoryPermissions.map((permission) => {
                    const userPermission = userPermissions.find(p => p.permission_id === permission.id);
                    return (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            checked={userPermission?.granted || false}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {permission.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {permission.descricao}
                            </Typography>
                          </Box>
                        }
                      />
                    );
                  })}
                </FormGroup>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Salvar Permissões'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Desativação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja desativar o usuário <strong>{userToDelete?.nome}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            O usuário será desativado e não poderá mais acessar o sistema.
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
            {submitting ? <CircularProgress size={20} /> : 'Desativar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;