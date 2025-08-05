import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '@/services/supabase';
import { formatarData, getDataAtualISO } from '@/utils/dateUtils';

// Função para formatar data no formato dd/mm/yyyy
const formatarDataLocal = (data: string): string => {
  return formatarData(data);
};

// Interface local para o formulário
interface FormTitulo {
  id?: number;
  filial: string;
  fornecedor: string;
  vencimento: string;
  valor: string;
  observacoes: string;
}

// Interface para os itens de múltiplos títulos
interface TituloItem {
  vencimento: string;
  valor: string;
}

// Interface para título do banco de dados
interface Titulo {
  id: number;
  numero: number;
  fornecedor_id: number;
  filial_id: number;
  tipo: string;
  data_emissao: string;
  data_vencimento: string;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado';
  observacao?: string;
}

// Tipo que combina os campos do formulário com os do banco de dados
interface TituloCompleto extends Omit<Titulo, 'valor' | 'fornecedor_id' | 'filial_id' | 'data_vencimento' | 'observacao'> {
  filial: string;
  fornecedor: string;
  tipo: string;
  vencimento: string;
  valor: string;
  observacoes: string;
  fornecedor_id?: number;
  filial_id?: number;
  data_vencimento?: string;
  observacao?: string;
}

const Titulos: React.FC = () => {
  const [titulos, setTitulos] = useState<TituloCompleto[]>([]);
  const [filiais, setFiliais] = useState<{id: number, nome: string}[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: number, nome: string, tipo: string}[]>([]);
  const [form, setForm] = useState<Partial<FormTitulo>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning'}>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  // Estados para controle de múltiplos títulos
  const [multiplosTitulos, setMultiplosTitulos] = useState(false);
  const [quantidadeTitulos, setQuantidadeTitulos] = useState(1);
  const [itensTitulos, setItensTitulos] = useState<TituloItem[]>([{vencimento: '', valor: ''}]);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Carregar títulos
        const { data: dadosTitulos, error: errorTitulos } = await supabase
          .from('titulos')
          .select('*')
          .order('data_vencimento', { ascending: true });

        if (errorTitulos) throw errorTitulos;

        // Carregar filiais
        const { data: dadosFiliais, error: errorFiliais } = await supabase
          .from('filiais')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (errorFiliais) throw errorFiliais;

        // Carregar fornecedores
        const { data: dadosFornecedores, error: errorFornecedores } = await supabase
          .from('fornecedores')
          .select('id, nome, tipo')
          .order('nome', { ascending: true });

        if (errorFornecedores) throw errorFornecedores;

        // Mapear filiais para o formato {id, nome}
        const filiaisFormatadas = dadosFiliais?.map(f => ({
          id: f.id,
          nome: f.nome
        })) || [];
        setFiliais(filiaisFormatadas);

        // Mapear fornecedores para o formato {id, nome, tipo}
        const fornecedoresFormatados = dadosFornecedores?.map(f => ({
          id: f.id,
          nome: f.nome,
          tipo: f.tipo || 'Não especificado'
        })) || [];
        setFornecedores(fornecedoresFormatados);

        // Converter os dados dos títulos para o formato do formulário
        const titulosFormatados: TituloCompleto[] = dadosTitulos?.map((titulo) => {
          // Buscar nome da filial
          const filial = filiaisFormatadas.find(f => f.id === titulo.filial_id);
          // Buscar fornecedor com tipo
          const fornecedor = fornecedoresFormatados.find(f => f.id === titulo.fornecedor_id);
          
          return {
            ...titulo,
            filial: filial?.nome || 'Filial não encontrada',
            fornecedor: fornecedor?.nome || 'Fornecedor não encontrado',
            tipo: fornecedor?.tipo || 'Tipo não especificado',
            vencimento: titulo.data_vencimento,
            valor: titulo.valor.toString(),
            observacoes: titulo.observacao || ''
          };
        }) || [];
        
        setTitulos(titulosFormatados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setAlert({
          open: true,
          message: 'Erro ao carregar dados. Tente novamente.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Atualiza a quantidade de títulos
  const handleQuantidadeTitulosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = parseInt(e.target.value) || 1;
    setQuantidadeTitulos(quantidade);
    
    // Atualiza o array de itens de títulos
    const novoArray = Array(quantidade).fill(null).map((_, index) => {
      return itensTitulos[index] || { vencimento: '', valor: '' };
    });
    
    setItensTitulos(novoArray);
  };

  // Atualiza os valores dos itens de títulos
  const handleItemTituloChange = (index: number, campo: keyof TituloItem, valor: string) => {
    const novoItens = [...itensTitulos];
    novoItens[index] = { ...novoItens[index], [campo]: valor };
    setItensTitulos(novoItens);
  };

  const getProximoNumero = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('titulos')
        .select('numero')
        .order('numero', { ascending: false })
        .limit(1);

      if (error) throw error;

      const ultimoNumero = data && data.length > 0 ? data[0].numero : 0;
      return ultimoNumero + 1;
    } catch (error) {
      console.error('Erro ao obter próximo número:', error);
      return 1;
    }
  };

  const handleAddOrEdit = async () => {
    // Validações específicas para múltiplos títulos
    if (multiplosTitulos) {
      const camposVazios = itensTitulos.some(item => !item.vencimento || !item.valor);
      if (camposVazios) {
        setAlert({
          open: true,
          message: 'Por favor, preencha todos os campos de data e valor para cada título.',
          severity: 'warning'
        });
        return;
      }
    }
    if (!form.filial || !form.fornecedor || !form.vencimento || !form.valor || isNaN(parseFloat(form.valor))) {
      setAlert({
        open: true,
        message: 'Preencha todos os campos obrigatórios.',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Encontrar o ID do fornecedor pelo nome
      const fornecedorSelecionado = fornecedores.find(f => f.nome === form.fornecedor);
      if (!fornecedorSelecionado) {
        setAlert({
          open: true,
          message: 'Fornecedor não encontrado. Por favor, selecione um fornecedor válido.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      // Encontrar o ID da filial pelo nome
      const filialSelecionada = filiais.find(f => f.nome === form.filial);
      if (!filialSelecionada) {
        setAlert({
          open: true,
          message: 'Filial não encontrada. Por favor, selecione uma filial válida.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      // Gerar próximo número sequencial
      const proximoNumero = await getProximoNumero();
      
      const tituloData = {
        numero: proximoNumero,
        fornecedor_id: fornecedorSelecionado.id,
        filial_id: filialSelecionada.id,
        valor: parseFloat(form.valor),
        data_emissao: getDataAtualISO(),
        data_vencimento: form.vencimento || '',
        status: 'pendente' as const,
        observacao: form.observacoes || undefined,
        tipo: fornecedorSelecionado.tipo
      };

      if (editId) {
        // Atualizar título existente
        const { data: updatedTitulo, error } = await supabase
          .from('titulos')
          .update(tituloData)
          .eq('id', editId)
          .select()
          .single();

        if (error) throw error;

        if (updatedTitulo) {
          // Atualizar a lista de títulos com os dados atualizados
          setTitulos(titulos.map(t => {
            if (t.id === editId) {
              return {
                ...t,
                ...form,
                valor: form.valor || t.valor,
                vencimento: form.vencimento || t.vencimento,
                observacoes: form.observacoes || t.observacoes
              };
            }
            return t;
          }));
          setAlert({
            open: true,
            message: 'Título atualizado com sucesso!',
            severity: 'success'
          });
        }
      } else if (multiplosTitulos) {
        // Cadastrar múltiplos títulos
        const fornecedorObj = fornecedores.find(f => f.nome === form.fornecedor);
        const filialObj = filiais.find(f => f.nome === form.filial);

        if (!fornecedorObj || !filialObj) {
          setAlert({
            open: true,
            message: 'Fornecedor ou filial não encontrado.',
            severity: 'error'
          });
          return;
        }

        try {
          // Criar títulos sequencialmente para garantir numeração correta
          const titulosCriados: Titulo[] = [];
          
          for (const item of itensTitulos) {
            // Gerar próximo número sequencial para cada título
            const numeroTitulo = await getProximoNumero();
            
            const tituloData = {
              fornecedor_id: fornecedorObj.id,
              filial_id: filialObj.id,
              numero: numeroTitulo,
              tipo: fornecedorObj.tipo,
              data_emissao: getDataAtualISO(),
              data_vencimento: item.vencimento,
              valor: parseFloat(item.valor),
              status: 'pendente' as const,
              observacao: form.observacoes || ''
            };
            
            const { data: tituloCriado, error } = await supabase
              .from('titulos')
              .insert(tituloData)
              .select()
              .single();

            if (error) throw error;
            if (tituloCriado) {
              titulosCriados.push(tituloCriado);
            }
          }
          
          // Formatar os títulos criados para adicionar à lista
          const novosTitulos = titulosCriados.map(titulo => {
            const filial = filiais.find(f => f.id === titulo.filial_id);
            const fornecedor = fornecedores.find(f => f.id === titulo.fornecedor_id);
            
            return {
              ...titulo,
              filial: filial?.nome || 'Filial não encontrada',
              fornecedor: fornecedor?.nome || 'Fornecedor não encontrado',
              tipo: fornecedor?.tipo || 'Tipo não especificado',
              vencimento: titulo.data_vencimento || '',
              valor: titulo.valor.toString(),
              observacoes: titulo.observacao || ''
            };
          });

          setTitulos([...titulos, ...novosTitulos]);
          setAlert({
            open: true,
            message: `${titulosCriados.length} títulos adicionados com sucesso!`,
            severity: 'success'
          });

          // Limpar formulário
          setForm({});
          setMultiplosTitulos(false);
          setQuantidadeTitulos(1);
          setItensTitulos([{vencimento: '', valor: ''}]);
        } catch (error) {
          console.error('Erro ao cadastrar múltiplos títulos:', error);
          setAlert({
            open: true,
            message: 'Erro ao cadastrar títulos. Por favor, tente novamente.',
            severity: 'error'
          });
        }
      } else {
        // Criar novo título
        const { data: novoTitulo, error } = await supabase
          .from('titulos')
          .insert(tituloData)
          .select()
          .single();

        if (error) throw error;

        if (novoTitulo) {
          // Adicionar o novo título à lista
          const filial = filiais.find(f => f.id === novoTitulo.filial_id);
          const fornecedor = fornecedores.find(f => f.id === novoTitulo.fornecedor_id);
          
          const novoTituloCompleto: TituloCompleto = {
            ...novoTitulo,
            filial: filial?.nome || 'Filial não encontrada',
            fornecedor: fornecedor?.nome || 'Fornecedor não encontrado',
            tipo: fornecedor?.tipo || 'Tipo não especificado',
            vencimento: novoTitulo.data_vencimento || '',
            valor: novoTitulo.valor.toString(),
            observacoes: novoTitulo.observacao || ''
          };
          setTitulos([...titulos, novoTituloCompleto]);
          setAlert({
            open: true,
            message: 'Título adicionado com sucesso!',
            severity: 'success'
          });
        }
      }
      
      // Limpar formulário
      setForm({});
      setEditId(null);
    } catch (error) {
      console.error('Erro ao salvar título:', error);
      setAlert({
        open: true,
        message: 'Erro ao salvar título. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    const titulo = titulos.find(t => t.id === id);
    if (titulo) {
      // Criar um objeto apenas com os campos do formulário
      const formData: FormTitulo = {
        id: titulo.id,
        filial: titulo.filial,
        fornecedor: titulo.fornecedor,
        vencimento: titulo.vencimento,
        valor: titulo.valor,
        observacoes: titulo.observacoes
      };
      setForm(formData);
      setEditId(id);
      // Rolar para o topo do formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este título?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('titulos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTitulos(titulos.filter(t => t.id !== id));
      if (editId === id) {
        setForm({});
        setEditId(null);
      }
      setAlert({
        open: true,
        message: 'Título excluído com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir título:', error);
      setAlert({
        open: true,
        message: 'Erro ao excluir título. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Loading Overlay */}
      {isLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <CircularProgress color="primary" size={60} />
        </Box>
      )}
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
      <Typography variant="h4" gutterBottom color="primary">
        Cadastro de Títulos
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {editId ? 'Editar Título' : 'Novo Título'}
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Opção para múltiplos títulos */}
                <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
                  <Button
                    variant={multiplosTitulos ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => {
                      setMultiplosTitulos(!multiplosTitulos);
                      if (!multiplosTitulos) {
                        setItensTitulos([{vencimento: '', valor: ''}]);
                        setQuantidadeTitulos(1);
                      }
                    }}
                    disabled={!!editId}
                    sx={{ mb: 1 }}
                  >
                    {multiplosTitulos ? 'Múltiplos Títulos Ativado' : 'Cadastrar Múltiplos Títulos'}
                  </Button>
                </Box>
                <TextField
                  select
                  fullWidth
                  label="Filial"
                  name="filial"
                  value={form.filial || ''}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isLoading || filiais.length === 0}
                >
                  {filiais.length === 0 ? (
                    <MenuItem disabled>Carregando filiais...</MenuItem>
                  ) : (
                    filiais.map((filial) => (
                      <MenuItem key={filial.id} value={filial.nome}>
                        {filial.nome}
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Fornecedor"
                  name="fornecedor"
                  value={form.fornecedor || ''}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isLoading || fornecedores.length === 0}
                >
                  {fornecedores.length === 0 ? (
                    <MenuItem disabled>Carregando fornecedores...</MenuItem>
                  ) : (
                    fornecedores.map((fornecedor) => (
                      <MenuItem key={fornecedor.id} value={fornecedor.nome}>
                        {fornecedor.nome}
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {/* Campos normais ou campos para múltiplos títulos */}
                {!multiplosTitulos ? (
                  <>
                    <TextField
                      label="Data de Vencimento"
                      name="vencimento"
                      type="date"
                      value={form.vencimento || ''}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Valor"
                      name="valor"
                      type="number"
                      value={form.valor === '0' ? '' : form.valor || ''}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Quantidade de Títulos"
                      type="number"
                      value={quantidadeTitulos}
                      onChange={handleQuantidadeTitulosChange}
                      inputProps={{ min: 1, max: 12 }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    {itensTitulos.map((item, index) => (
                      <Box key={index} sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1, mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Título {index + 1}
                        </Typography>
                        <Box display="flex" gap={2}>
                          <TextField
                            label="Data de Vencimento"
                            type="date"
                            value={item.vencimento}
                            onChange={(e) => handleItemTituloChange(index, 'vencimento', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                          />
                          <TextField
                            label="Valor"
                            type="number"
                            value={item.valor}
                            onChange={(e) => handleItemTituloChange(index, 'valor', e.target.value)}
                            fullWidth
                            required
                          />
                        </Box>
                      </Box>
                    ))}
                  </>
                )}
                <TextField
                  label="Observações"
                  name="observacoes"
                  value={form.observacoes || ''}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                />
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddOrEdit}
                    disabled={isLoading}
                    fullWidth
                  >
                    {editId ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  {editId && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setForm({});
                        setEditId(null);
                      }}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lista de Títulos
              </Typography>
              <List>
                {titulos.map((titulo) => (
                  <ListItem key={titulo.id} divider>
                    <ListItemText
                      primary={`${titulo.fornecedor} - ${titulo.filial}`}
                      secondary={`Vencimento: ${formatarData(titulo.vencimento)} | Valor: R$ ${parseFloat(titulo.valor).toFixed(2)} | Status: ${titulo.status}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEdit(titulo.id)}
                        disabled={isLoading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(titulo.id)}
                        disabled={isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {titulos.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Nenhum título cadastrado" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Titulos;