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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as DoctorIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';

interface Doctor {
  id: number;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface DoctorFormData {
  nome: string;
  ativo: boolean;
}

const initialFormData: DoctorFormData = {
  nome: '',
  ativo: true
};



export function Medicos() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      setDoctors(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar médicos:', error);
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        nome: doctor.nome,
        ativo: doctor.ativo
      });
    } else {
      setEditingDoctor(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDoctor(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (field: keyof DoctorFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    // Validação de nome
    if (!formData.nome.trim()) {
      toast.error('Nome do médico é obrigatório');
      return false;
    } else if (formData.nome.trim().length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres');
      return false;
    } else if (formData.nome.trim().length > 100) {
      toast.error('Nome deve ter no máximo 100 caracteres');
      return false;
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.nome.trim())) {
      toast.error('Nome deve conter apenas letras e espaços');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const doctorData = {
        nome: formData.nome.trim(),
        ativo: formData.ativo,
        updated_at: new Date().toISOString()
      };

      if (editingDoctor) {
        // Atualizar médico existente
        const { error } = await supabase
          .from('medicos')
          .update(doctorData)
          .eq('id', editingDoctor.id);

        if (error) throw error;

        toast.success('Médico atualizado com sucesso!');
      } else {
        // Criar novo médico
        const { error } = await supabase
          .from('medicos')
          .insert([{
            ...doctorData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast.success('Médico cadastrado com sucesso!');
      }

      handleCloseDialog();
      loadDoctors();
    } catch (error: any) {
      console.error('Erro ao salvar médico:', error);
      toast.error(error.message || 'Erro ao salvar médico');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;

    try {
      setSubmitting(true);

      // Verificar se há agendamentos associados
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('medico_id', doctorToDelete.id)
        .limit(1);

      if (agendamentosError) {
        throw agendamentosError;
      }

      if (agendamentos && agendamentos.length > 0) {
        toast.error('Não é possível excluir este médico pois há agendamentos associados a ele.');
        return;
      }

      const { error } = await supabase
        .from('medicos')
        .delete()
        .eq('id', doctorToDelete.id);

      if (error) throw error;

      toast.success('Médico excluído com sucesso!');
      setDeleteDialogOpen(false);
      setDoctorToDelete(null);
      loadDoctors();
    } catch (error: any) {
      console.error('Erro ao excluir médico:', error);
      toast.error(error.message || 'Erro ao excluir médico');
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar permissões (simplificado para este exemplo)
  const canView = true; // userData?.permissions?.includes('DOCTORS_VIEW') || false;
  const canCreate = true; // userData?.permissions?.includes('DOCTORS_CREATE') || false;
  const canEdit = true; // userData?.permissions?.includes('DOCTORS_EDIT') || false;
  const canDelete = true; // userData?.permissions?.includes('DOCTORS_DELETE') || false;

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Acesso Negado
        </Typography>
        <Alert severity="error">
          Você não tem permissão para visualizar médicos.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DoctorIcon />
          Gerenciar Médicos
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Médico
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Nenhum médico cadastrado
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.nome}</TableCell>
                    <TableCell>
                      <Switch
                        checked={doctor.ativo}
                        disabled
                        size="small"
                      />
                      {doctor.ativo ? 'Ativo' : 'Inativo'}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton
                          onClick={() => handleOpenDialog(doctor)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          onClick={() => handleDeleteClick(doctor)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Dialog para criar/editar médico */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Editar Médico' : 'Novo Médico'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Médico"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  />
                }
                label="Ativo"
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
            {submitting ? <CircularProgress size={20} /> : (editingDoctor ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o médico <strong>{doctorToDelete?.nome}</strong>?
          </Typography>
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