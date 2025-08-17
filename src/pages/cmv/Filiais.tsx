import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
 
  TextField, 
  Button, 
  IconButton, 

  Checkbox, 
  CircularProgress,

  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supabase } from '../../services/supabase';
import type { Filial } from '../../types';

// Estado inicial do formulário
const initialFormState: Omit<Filial, 'id' | 'created_at' | 'updated_at'> = {
  nome: '',
  endereco: '',
  telefone: '',
  ativa: true
};

export function Filiais() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [form, setForm] = useState<Omit<Filial, 'id' | 'created_at' | 'updated_at'>>(initialFormState);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
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
    } catch (error: unknown) {
      console.error('Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Trata campos booleanos corretamente
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!form.nome.trim()) {
      toast.error('Nome da filial é obrigatório');
      return false;
    }

    if (!form.endereco.trim()) {
      toast.error('Endereço é obrigatório');
      return false;
    }

    return true;
  };

  const handleOpenDialog = (filial?: Filial) => {
    if (filial) {
      setEditId(filial.id);
      setForm({
        nome: filial.nome,
        endereco: filial.endereco,
        telefone: filial.telefone || '',
        ativa: filial.ativa
      });
    } else {
      setEditId(null);
      setForm(initialFormState);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm(initialFormState);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const filialData = {
        nome: form.nome.trim(),
        endereco: form.endereco.trim(),
        telefone: form.telefone?.trim() || null,
        ativa: form.ativa,
        updated_at: new Date().toISOString()
      };

      if (editId) {
        // Atualizar filial existente
        const { error } = await supabase
          .from('filiais')
          .update(filialData)
          .eq('id', editId);

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
    } catch (error: unknown) {
      const dbError = error as { code?: string; message?: string }
      console.error('Erro ao salvar filial:', error);
      
      let errorMessage = 'Erro ao salvar filial';
      
      if (dbError.message) {
        if (dbError.message.includes('duplicate key')) {
          errorMessage = 'Já existe uma filial com este nome';
        } else if (dbError.message.includes('foreign key constraint')) {
          errorMessage = 'Esta filial possui vínculos com outros registros';
        }
      }
      
      toast.error(errorMessage);
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

      // Verificar se a filial tem usuários vinculados
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('filial_id', filialToDelete.id);

      if (usuariosError) throw usuariosError;

      if (usuarios && usuarios.length > 0) {
        toast.error(`Não é possível excluir esta filial pois existem ${usuarios.length} usuários vinculados a ela`);
        return;
      }

      // Verificar se a filial tem agendamentos
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('filial_id', filialToDelete.id);

      if (agendamentosError) throw agendamentosError;

      if (agendamentos && agendamentos.length > 0) {
        toast.error(`Não é possível excluir esta filial pois existem ${agendamentos.length} agendamentos vinculados a ela`);
        return;
      }

      // Excluir a filial
      const { error } = await supabase
        .from('filiais')
        .delete()
        .eq('id', filialToDelete.id);

      if (error) throw error;

      toast.success('Filial excluída com sucesso!');
      loadFiliais();
      setDeleteDialogOpen(false);
      setFilialToDelete(null);
    } catch (error: unknown) {
      console.error('Erro ao excluir filial:', error);
      toast.error('Erro ao excluir filial');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFiliais = filiais.filter(filial =>
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (filial.telefone && filial.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && filiais.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom display="flex" alignItems="center">
        <BusinessIcon sx={{ mr: 1 }} /> Gerenciamento de Filiais
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Pesquisar filiais..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '50%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<BusinessIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Filial
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Endereço</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiliais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma filial encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredFiliais.map((filial) => (
                <TableRow key={filial.id}>
                  <TableCell>{filial.nome}</TableCell>
                  <TableCell>{filial.endereco}</TableCell>
                  <TableCell>{filial.telefone || '-'}</TableCell>
                  <TableCell>
                    {filial.ativa ? (
                      <Alert severity="success" icon={false} sx={{ py: 0 }}>
                        Ativa
                      </Alert>
                    ) : (
                      <Alert severity="error" icon={false} sx={{ py: 0 }}>
                        Inativa
                      </Alert>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={() => handleOpenDialog(filial)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleDeleteClick(filial)}
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

      {/* Dialog para adicionar/editar filial */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId ? 'Editar Filial' : 'Nova Filial'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome *"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="Endereço *"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              fullWidth
              disabled={submitting}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                name="ativa"
                checked={form.ativa}
                onChange={handleChange}
                disabled={submitting}
              />
              <Typography>Filial Ativa</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {editId ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a filial "{filialToDelete?.nome}"?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            Esta ação não poderá ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}