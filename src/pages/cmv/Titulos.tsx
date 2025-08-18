import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import {
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  MenuItem, 
  Snackbar,
  Alert, 
  CircularProgress, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatarData } from '@/utils/dateUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// Interface local para o formulário
interface FormTitulo {
  id?: number;
  filial?: string;
  fornecedor?: string;
  filial_id?: number;
  fornecedor_id?: number;
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
  const [fornecedores, setFornecedores] = useState<{id: number, nome: string, tipo: string, tipo_id: number}[]>([]);
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

  // Função para carregar filiais
  const carregarFiliais = async () => {
    try {
      const { data: dadosFiliais, error: errorFiliais } = await supabase
        .from('filiais')
        .select('id, nome')
        .eq('ativo', true) // Filtra apenas filiais ativas, se existir coluna ativo
        .order('nome', { ascending: true });

      if (errorFiliais) {
        // Se der erro por causa do filtro 'ativo', tenta novamente sem o filtro
        if (errorFiliais.code === '42703') { // código para coluna inexistente
          const { data: allFiliais, error: secondError } = await supabase
            .from('filiais')
            .select('id, nome')
            .order('nome', { ascending: true });
          
          if (secondError) throw secondError;
          return allFiliais || [];
        }
        throw errorFiliais;
      }

      return dadosFiliais || [];
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
      setAlert({
        open: true,
        message: 'Erro ao carregar filiais. Tente novamente.',
        severity: 'error'
      });
      return [];
    }
  };

  // Função para carregar fornecedores
  const carregarFornecedores = async () => {
    try {
      const { data: dadosFornecedores, error: errorFornecedores } = await supabase
        .from('fornecedores')
        .select('id, nome, tipo_id')
        .eq('ativo', true) // Filtra apenas fornecedores ativos
        .order('nome', { ascending: true });

      if (errorFornecedores) throw errorFornecedores;

      // Carregar tipos de fornecedores para obter o nome do tipo
      const { data: tiposFornecedores } = await supabase
        .from('tipos_fornecedores')
        .select('id, nome');

      // Mapear fornecedores incluindo o nome do tipo e tipo_id
      return dadosFornecedores?.map(f => {
        const tipoFornecedor = tiposFornecedores?.find(tipo => tipo.id === f.tipo_id);
        return {
          id: f.id,
          nome: f.nome,
          tipo_id: f.tipo_id, // Incluir tipo_id para uso posterior
          tipo: tipoFornecedor?.nome || 'Tipo não especificado'
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setAlert({
        open: true,
        message: 'Erro ao carregar fornecedores. Tente novamente.',
        severity: 'error'
      });
      return [];
    }
  };

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

        // Carregar filiais e fornecedores em paralelo para melhor performance
        const [filiaisFormatadas, fornecedoresFormatados] = await Promise.all([
          carregarFiliais(),
          carregarFornecedores()
        ]);
        
        setFiliais(filiaisFormatadas);
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
    const { name, value } = e.target;
    
    // Validação especial para campo monetário
    if (name === 'valor') {
      // Remove caracteres não numéricos exceto ponto e vírgula
      let numericValue = value.replace(/[^0-9.,]/g, '');
      
      // Converte vírgula para ponto se necessário
      numericValue = numericValue.replace(/,/g, '.');
      
      // Se tiver mais de um ponto, mantém apenas o último
      if ((numericValue.match(/\./g) || []).length > 1) {
        const parts = numericValue.split('.');
        numericValue = parts.slice(0, -1).join('') + '.' + parts.slice(-1);
      }
      
      // Limita a duas casas decimais
      const parts = numericValue.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        numericValue = parts.join('.');
      }
      
      // Formata com R$
      const formattedValue = numericValue ? `R$ ${numericValue}` : '';
      
      setForm((prev) => ({ ...prev, [name]: numericValue }));
      
      // Atualiza o valor exibido no input
      e.target.value = formattedValue;
      return;
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
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
    if (!form.filial_id || !form.fornecedor_id || !form.vencimento || !form.valor || isNaN(parseFloat(form.valor))) {
      setAlert({
        open: true,
        message: 'Preencha todos os campos obrigatórios.',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verificar se o fornecedor_id existe e garantir que é um número
      if (form.fornecedor_id === undefined || form.fornecedor_id === null) {
        setAlert({
          open: true,
          message: 'Fornecedor não encontrado. Por favor, selecione um fornecedor válido.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      // Verificar se o filial_id existe e garantir que é um número
      if (form.filial_id === undefined || form.filial_id === null) {
        setAlert({
          open: true,
          message: 'Por favor, selecione uma filial válida.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      const filialSelecionada = filiais.find(f => f.id === form.filial_id);
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
      
      // Buscar o objeto fornecedor para obter o tipo
      const fornecedorObj = fornecedores.find(f => f.id === form.fornecedor_id);
      if (!fornecedorObj) {
        setAlert({
          open: true,
          message: 'Fornecedor não encontrado no sistema.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      // Buscar tipo_id do fornecedor selecionado
      const fornecedorSelecionado = fornecedores.find(f => f.id === form.fornecedor_id);
      if (!fornecedorSelecionado?.tipo_id) {
        setAlert({
          open: true,
          message: 'Erro: tipo_id do fornecedor não encontrado. Por favor, selecione outro fornecedor.',
          severity: 'error'
        });
        setIsLoading(false);
        return;
      }
      
      const tituloData = {
        numero: proximoNumero,
        fornecedor_id: form.fornecedor_id,
        filial_id: form.filial_id,
        tipo_id: fornecedorSelecionado.tipo_id, // Adicionar tipo_id do fornecedor
        valor: parseFloat(form.valor),
        data_vencimento: form.vencimento || '',
        status: 'pendente' as const,
        observacao: form.observacoes || undefined,
        tipo: 'pagar' // Usar valor válido para a constraint valid_tipo
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
        const fornecedorObj = fornecedores.find(f => f.id === form.fornecedor_id);
        const filialObj = filiais.find(f => f.id === form.filial_id);

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
            
            const fornecedorSelecionado = fornecedores.find(f => f.id === form.fornecedor_id);
            if (!fornecedorSelecionado?.tipo_id) {
              throw new Error('tipo_id do fornecedor não encontrado');
            }
            
            const tituloData = {
              fornecedor_id: form.fornecedor_id,
              filial_id: form.filial_id,
              numero: numeroTitulo,
              tipo_id: fornecedorSelecionado.tipo_id, // Adicionar tipo_id do fornecedor
              tipo: 'pagar', // Usar valor válido para a constraint valid_tipo
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
      // Encontrar o ID da filial e fornecedor pelos nomes
      const filialObj = filiais.find(f => f.nome === titulo.filial);
      const fornecedorObj = fornecedores.find(f => f.nome === titulo.fornecedor);
      
      // Criar um objeto com os campos do formulário incluindo os IDs
      const formData: FormTitulo = {
        id: titulo.id,
        filial: titulo.filial,
        fornecedor: titulo.fornecedor,
        filial_id: filialObj?.id,
        fornecedor_id: fornecedorObj?.id,
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
                  name="filial_id"
                  value={form.filial_id || ''}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isLoading || filiais.length === 0}
                >
                  {isLoading ? (
                    <MenuItem disabled>Carregando filiais...</MenuItem>
                  ) : filiais.length === 0 ? (
                    <MenuItem disabled>Nenhuma filial encontrada</MenuItem>
                  ) : (
                    filiais.map((filial) => (
                      <MenuItem key={filial.id} value={filial.id}>
                        {filial.nome}
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Fornecedor"
                  name="fornecedor_id"
                  value={form.fornecedor_id || ''}
                  onChange={handleChange}
                  margin="normal"
                  required
                  disabled={isLoading || fornecedores.length === 0}
                >
                  {isLoading ? (
                    <MenuItem disabled>Carregando fornecedores...</MenuItem>
                  ) : fornecedores.length === 0 ? (
                    <MenuItem disabled>Nenhum fornecedor encontrado</MenuItem>
                  ) : (
                    fornecedores.map((fornecedor) => (
                      <MenuItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome} ({fornecedor.tipo})
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {/* Campos normais ou campos para múltiplos títulos */}
                {!multiplosTitulos ? (
                  <>
                    <DatePicker
                      label="Data de Vencimento"
                      value={form.vencimento ? dayjs(form.vencimento) : null}
                      onChange={(novaData) => {
                        if (novaData) {
                          const dataFormatada = novaData.format('YYYY-MM-DD')
                          setForm(prev => ({ ...prev, vencimento: dataFormatada }))
                        } else {
                          setForm(prev => ({ ...prev, vencimento: '' }))
                        }
                      }}
                      format="DD/MM/YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          name: "vencimento",
                          required: true,
                          placeholder: "DD/MM/AAAA"
                        }
                      }}
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
                          <DatePicker
                            label="Data de Vencimento"
                            value={item.vencimento ? dayjs(item.vencimento) : null}
                            onChange={(novaData) => {
                              if (novaData) {
                                const dataISO = novaData.format('YYYY-MM-DD')
                                handleItemTituloChange(index, 'vencimento', dataISO)
                              } else {
                                handleItemTituloChange(index, 'vencimento', '')
                              }
                            }}
                            format="DD/MM/YYYY"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true,
                                placeholder: "DD/MM/AAAA"
                              }
                            }}
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
                      primary={`N° ${titulo.numero} - ${titulo.fornecedor} - ${titulo.filial}`}
                      secondary={
                        <>
                          <span>Tipo: {titulo.tipo} | </span>
                          <span>Vencimento: {formatarData(titulo.vencimento)} | </span>
                          <span>Valor: R$ {parseFloat(titulo.valor).toFixed(2)} | </span>
                          <span>Status: {titulo.status}</span>
                        </>
                      }
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