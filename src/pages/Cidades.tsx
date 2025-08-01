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
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationCity as CityIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabase';


interface Filial {
  id: number;
  nome: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

interface FilialFormData {
  nome: string;
  ativa: boolean;
}

const initialFormData: FilialFormData = {
    nome: '',
    ativa: true,
  };

export function Cidades() {

  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [formData, setFormData] = useState<FilialFormData>(initialFormData);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filialToDelete, setFilialToDelete] = useState<Filial | null>(null);

  useEffect(() => {
    loadFiliais();
  }, []);

  const loadFiliais = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
        .order('nome');

      if (error) {
        throw error;
      }

      setFiliais(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (filial?: Filial) => {
    if (filial) {
      setEditingFilial(filial);
      setFormData({
        nome: filial.nome,
        ativa: filial.ativa,
      });
    } else {
      setEditingFilial(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFilial(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (field: keyof FilialFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome da cidade é obrigatório');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const filialData = {
      nome: formData.nome.trim(),
      ativa: formData.ativa,
    };

      if (editingFilial) {
        // Atualizar filial existente
        const { error } = await supabase
          .from('filiais')
          .update(filialData)
          .eq('id', editingFilial.id);

        if (error) throw error;

        toast.success('Filial atualizada com sucesso!');
      } else {
        // Criar nova filial
        const { error } = await supabase
          .from('filiais')
          .insert([{
            ...filialData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast.success('Filial cadastrada com sucesso!');
      }

      handleCloseDialog();
      loadFiliais();
    } catch (error: any) {
      console.error('Erro ao salvar filial:', error);
      toast.error(error.message || 'Erro ao salvar filial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (filial: Filial) => {
    setFilialToDelete(filial);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!filialToDelete) return;

    try {
      setSubmitting(true);

      // Verificar se a filial tem agendamentos
      const { data: appointments, error: appointmentsError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('filial_id', filialToDelete.id)
        .limit(1);

      if (appointmentsError) throw appointmentsError;

      if (appointments && appointments.length > 0) {
        toast.error('Não é possível excluir filial com agendamentos associados');
        return;
      }

      const { error } = await supabase
        .from('filiais')
        .delete()
        .eq('id', filialToDelete.id);

      if (error) throw error;

      toast.success('Filial excluída com sucesso!');
      setDeleteDialogOpen(false);
      setFilialToDelete(null);
      loadFiliais();
    } catch (error: any) {
      console.error('Erro ao excluir filial:', error);
      toast.error(error.message || 'Erro ao excluir filial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (filial: Filial) => {
    try {
      const { error } = await supabase
        .from('filiais')
        .update({ 
          ativa: !filial.ativa,
          updated_at: new Date().toISOString()
        })
        .eq('id', filial.id);

      if (error) throw error;

      toast.success(`Filial ${!filial.ativa ? 'ativada' : 'desativada'} com sucesso!`);
      loadFiliais();
    } catch (error: any) {
      console.error('Erro ao alterar status da filial:', error);
      toast.error('Erro ao alterar status da filial');
    }
  };

  // Controle de acesso removido temporariamente durante o desenvolvimento

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
            Filiais
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie as filiais do sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ height: 'fit-content' }}
        >
          Nova Filial
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CityIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {filiais.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Filiais
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
                <CityIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {filiais.filter(f => f.ativa).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filiais Ativas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de filiais */}
      <Card>
        <CardContent>
          <TableContainer sx={{ maxHeight: 400, minHeight: 300, overflow: 'auto' }}>
            <Table stickyHeader sx={{ '& .MuiTableHead-root': { position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filiais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                        Nenhuma filial cadastrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filiais.map((filial) => (
                    <TableRow key={filial.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {filial.nome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={filial.ativa ? 'Ativa' : 'Inativa'}
                          color={filial.ativa ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(filial)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(filial)}
                          color={filial.ativa ? 'warning' : 'success'}
                        >
                          {filial.ativa ? 'Desativar' : 'Ativar'}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(filial)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de cadastro/edição */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFilial ? 'Editar Filial' : 'Nova Filial'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nome da Filial *"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              fullWidth
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativa}
                  onChange={(e) => handleInputChange('ativa', e.target.checked)}
                />
              }
              label="Ativa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingFilial ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a filial <strong>{filialToDelete?.nome}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita e pode afetar outros registros relacionados.
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
            {submitting ? <CircularProgress size={20} /> : 'Excluir Filial'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Cidades;