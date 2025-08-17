import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  DialogActions
} from '@mui/material'
import { Settings as SettingsIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { supabase } from '@/services/supabase'
import { formatarData, getDataAtualISO } from '@/utils/dateUtils'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import { DataDisponivel, Filial, Medico, ConfiguracaoHorario } from '@/types'
import '../styles/Pages.css'

// Interface para horários de almoço
interface HorariosAlmoco {
  inicio: string
  fim: string
}

// Interface estendida para incluir o nome do médico
interface DataDisponivelExtended extends DataDisponivel {
  medico_nome?: string
  medico_id: number
  filial_id: number
  filiais?: {
    id: number
    nome: string
  }
}

// Interface estendida para ConfiguracaoHorario com tipos específicos
interface ConfiguracaoHorarioExtended extends Omit<ConfiguracaoHorario, 'horarios_almoco'> {
  horarios_almoco: HorariosAlmoco
}

interface FormData {
  filial_id: string
  medico_id: string
  data: string
}

interface ConfiguracaoHorariosModalProps {
  isOpen: boolean
  onClose: () => void
  filial: Filial | null
  onSave: (config: ConfiguracaoHorarioExtended) => Promise<void>
  initialConfig: ConfiguracaoHorarioExtended | null
}

const ConfigurarHorariosModal: React.FC<ConfiguracaoHorariosModalProps> = ({
  isOpen,
  onClose,
  filial,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<Partial<ConfiguracaoHorarioExtended>>({
    horario_inicio: '08:00',
    horario_fim: '18:00',
    intervalo_minutos: 30,
    horarios_almoco: { inicio: '12:00', fim: '13:00' }
  })

  useEffect(() => {
    if (initialConfig) {
      setConfig({
        ...initialConfig,
        horarios_almoco: initialConfig.horarios_almoco || { inicio: '12:00', fim: '13:00' }
      })
    }
  }, [initialConfig])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const field = name.split('.')[1] // Extrai 'inicio' ou 'fim'
    setConfig(prev => ({
      ...prev,
      horarios_almoco: {
        ...(prev.horarios_almoco || {}),
        [field]: value
      } as HorariosAlmoco
    }))
  }



  const handleSave = async () => {
    if (!filial) return
    
    try {
      await onSave({
        ...config as ConfiguracaoHorarioExtended,
        filial_id: filial.id
      })
      toast.success('✅ Configuração salva! Horários das datas existentes também foram atualizados.')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração de horários')
    }
  }



  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configurar Horários - {filial?.nome}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Horário de Início"
              type="time"
              name="horario_inicio"
              value={config.horario_inicio || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Horário de Término"
              type="time"
              name="horario_fim"
              value={config.horario_fim || ''}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Intervalo entre Consultas (minutos)"
              type="number"
              name="intervalo_minutos"
              value={config.intervalo_minutos || 30}
              onChange={handleNumberChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Horário de Almoço - Início"
              type="time"
              name="horarios_almoco.inicio"
              value={config.horarios_almoco?.inicio || '12:00'}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Horário de Almoço - Fim"
              type="time"
              name="horarios_almoco.fim"
              value={config.horarios_almoco?.fim || '13:00'}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function DatasDisponiveis() {
  const [formData, setFormData] = useState<FormData>({
    filial_id: '',
    medico_id: '',
    data: ''
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null)
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [datasDisponiveis, setDatasDisponiveis] = useState<DataDisponivelExtended[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduleConfigs, setScheduleConfigs] = useState<Record<number, ConfiguracaoHorarioExtended>>({})
  
  const { userData } = useAuth()

  // Função para gerar horários baseados na configuração
  const generateHorarios = (
    inicio: string,
    fim: string,
    intervalo: number,
    almoco: { inicio: string; fim: string }
  ): string[] => {
    const horarios: string[] = []
    const [inicioHora, inicioMinuto] = inicio.split(':').map(Number)
    const [fimHora, fimMinuto] = fim.split(':').map(Number)
    const [almocoInicioHora, almocoInicioMinuto] = almoco.inicio.split(':').map(Number)
    const [almocoFimHora, almocoFimMinuto] = almoco.fim.split(':').map(Number)
    
    let horaAtual = inicioHora
    let minutoAtual = inicioMinuto
    
    while (
      horaAtual < fimHora || 
      (horaAtual === fimHora && minutoAtual <= fimMinuto)
    ) {
      const horarioAtual = `${horaAtual.toString().padStart(2, '0')}:${minutoAtual.toString().padStart(2, '0')}`
      
      // Verificar se está no horário de almoço
      const estaNoAlmoco = (
        (horaAtual > almocoInicioHora || (horaAtual === almocoInicioHora && minutoAtual >= almocoInicioMinuto)) &&
        (horaAtual < almocoFimHora || (horaAtual === almocoFimHora && minutoAtual < almocoFimMinuto))
      )
      
      if (!estaNoAlmoco) {
        horarios.push(horarioAtual)
      }
      
      // Avançar o tempo
      minutoAtual += intervalo
      while (minutoAtual >= 60) {
        minutoAtual -= 60
        horaAtual += 1
      }
    }
    
    return horarios
  }

  // Função para verificar permissões
  const can = (permission: string) => {
    if (!userData) return false
    
    // Implementação básica de verificação de permissões
    // Adapte conforme necessário para seu sistema de permissões
    const adminRoles = ['super_admin', 'admin']
    const managerRoles = ['manager']
    const receptionistRoles = ['atendente', 'receptionist']
    
    if (adminRoles.includes(userData.role || '')) return true
    
    switch (permission) {
      case 'DATES_VIEW':
        return [...adminRoles, ...managerRoles, ...receptionistRoles].includes(userData.role || '')
      case 'DATES_CREATE':
      case 'DATES_EDIT':
        return [...adminRoles, ...managerRoles].includes(userData.role || '')
      case 'DATES_DELETE':
        return adminRoles.includes(userData.role || '')
      default:
        return false
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchFiliais()
    fetchMedicos()
    fetchDatasDisponiveis()
    fetchScheduleConfigs()
  }, [])

  // Buscar filiais
  const fetchFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
        .eq('ativa', true)
        .order('nome')

      if (error) throw error
      setFiliais(data || [])
    } catch (error) {
      console.error('Erro ao buscar filiais:', error)
      toast.error('Erro ao carregar filiais')
    }
  }

  // Buscar médicos
  const fetchMedicos = async () => {
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setMedicos(data || [])
    } catch (error) {
      console.error('Erro ao buscar médicos:', error)
      toast.error('Erro ao carregar médicos')
    }
  }

  // Buscar datas disponíveis
  const fetchDatasDisponiveis = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('datas_disponiveis')
        .select('*')
        .eq('ativa', true)
        .order('data')

      if (error) throw error
      
      // Buscar informações dos médicos separadamente
      const datasComMedicos = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const { data: medicoData, error: medicoError } = await supabase
              .from('medicos')
              .select('nome')
              .eq('id', item.medico_id)
              .single()
            
            if (medicoError) {
              console.warn(`Erro ao buscar médico ${item.medico_id}:`, medicoError)
            }
            
            return {
              ...item,
              medico_nome: medicoData?.nome || 'Médico não encontrado'
            }
          } catch (error) {
            console.warn(`Erro ao processar médico ${item.medico_id}:`, error)
            return {
              ...item,
              medico_nome: 'Médico não encontrado'
            }
          }
        })
      )

      setDatasDisponiveis(datasComMedicos)
    } catch (error) {
      console.error('Erro ao buscar datas disponíveis:', error)
      toast.error('Erro ao carregar datas disponíveis')
    } finally {
      setLoading(false)
    }
  }

  // Buscar configurações de horários
  const fetchScheduleConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')

      if (error) throw error

      const configsMap: Record<number, ConfiguracaoHorarioExtended> = {}
      data?.forEach(config => {
        // Converter os campos Json para os tipos específicos
        configsMap[config.filial_id] = {
          ...config,
          horarios_almoco: config.horarios_almoco as HorariosAlmoco,
          dias_funcionamento: config.dias_funcionamento as number[]
        }
      })

      setScheduleConfigs(configsMap)
    } catch (error) {
      console.error('Erro ao buscar configurações de horários:', error)
    }
  }

  // Obter configuração de horário para uma filial
  const getScheduleConfig = async (filialId: number): Promise<ConfiguracaoHorario | null> => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('filial_id', filialId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Erro ao buscar configuração de horário:', error)
      return null
    }
  }

  // Salvar configuração de horário
  const saveScheduleConfig = async (filialId: number, config: Partial<ConfiguracaoHorarioExtended>) => {
    try {
      // Verificar se já existe uma configuração para esta filial
      const existingConfig = await getScheduleConfig(filialId)

      if (existingConfig) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('configuracoes_horarios')
          .update({
            horario_inicio: config.horario_inicio,
            horario_fim: config.horario_fim,
            intervalo_minutos: config.intervalo_minutos,
            horarios_almoco: config.horarios_almoco,
            dias_funcionamento: config.dias_funcionamento,
            updated_at: getDataAtualISO()
          })
          .eq('filial_id', filialId)

        if (error) throw error
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('configuracoes_horarios')
          .insert({
            filial_id: filialId,
            horario_inicio: config.horario_inicio,
            horario_fim: config.horario_fim,
            intervalo_minutos: config.intervalo_minutos,
            horarios_almoco: config.horarios_almoco,
            dias_funcionamento: config.dias_funcionamento,
            created_at: getDataAtualISO(),
            updated_at: getDataAtualISO()
          })

        if (error) throw error
      }

      // 🆕 ATUALIZAR TODAS AS DATAS EXISTENTES DESTA FILIAL
      if (config.horario_inicio && config.horario_fim && config.intervalo_minutos && config.horarios_almoco) {
        // Gerar novos horários baseados na nova configuração
        const novosHorarios = generateHorarios(
          config.horario_inicio,
          config.horario_fim,
          config.intervalo_minutos,
          (config.horarios_almoco as HorariosAlmoco) || { inicio: '12:00', fim: '13:00' }
        )

        // Buscar todas as datas ativas desta filial
        const { data: datasExistentes, error: fetchError } = await supabase
          .from('datas_disponiveis')
          .select('id, data')
          .eq('filial_id', filialId)
          .eq('ativa', true)

        if (fetchError) {
          console.warn('Erro ao buscar datas existentes:', fetchError)
        } else if (datasExistentes && datasExistentes.length > 0) {
          // Atualizar horários de todas as datas desta filial
          const { error: updateError } = await supabase
            .from('datas_disponiveis')
            .update({
              horarios_disponiveis: novosHorarios,
              updated_at: getDataAtualISO()
            })
            .eq('filial_id', filialId)
            .eq('ativa', true)

          if (updateError) {
            console.warn('Erro ao atualizar horários das datas existentes:', updateError)
          } else {
            console.log(`✅ Horários atualizados para ${datasExistentes.length} datas da filial ${filialId}`)
          }
        }
      }

      // Atualizar o estado local
      await fetchScheduleConfigs()
      await fetchDatasDisponiveis() // 🆕 Recarregar as datas para mostrar os novos horários
    } catch (error) {
      console.error('Erro ao salvar configuração de horário:', error)
      throw error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target as { name: string; value: unknown }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.filial_id || !formData.medico_id || !formData.data) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      // Formatar a data para exibição
      const dataFormatada = formData.data

      // Verificar se já existe uma data para esta filial na mesma data
      let query = supabase
        .from('datas_disponiveis')
        .select('id')
        .eq('filial_id', formData.filial_id)
        .eq('data', dataFormatada)
      
      // Só adicionar .neq se estiver editando
      if (editingId) {
        query = query.neq('id', editingId)
      }
      
      const { data: existingData, error: checkError } = await query.single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingData) {
        const filial = filiais.find(f => f.id === Number(formData.filial_id))
         throw new Error(`Já existe uma data cadastrada para ${filial?.nome} em ${dataFormatada}`)
      }

      // Gerar horários baseados na configuração da filial
      const config = await getScheduleConfig(Number(formData.filial_id))
      let horariosGerados: string[] = []
      
      if (config) {
        horariosGerados = generateHorarios(
          config.horario_inicio,
          config.horario_fim,
          config.intervalo_minutos,
          config.horarios_almoco && typeof config.horarios_almoco === 'object' && config.horarios_almoco !== null
            ? config.horarios_almoco as unknown as HorariosAlmoco
            : { inicio: '12:00', fim: '13:00' }
        )
      }

      console.log('Dados do formulário:', formData)
      console.log('Medico ID:', formData.medico_id)

      // Preparar dados para salvar
      const dateData = {
        filial_id: Number(formData.filial_id),
        medico_id: formData.medico_id, // Manter como string (UUID)
        data: dataFormatada,
        horarios_disponiveis: horariosGerados,
        ativa: true,
        updated_at: getDataAtualISO()
      }

      console.log('Dados para salvar:', dateData)

      if (editingId) {
        // Modo de edição - atualizar data existente
        const { error } = await supabase
          .from('datas_disponiveis')
          .update(dateData)
          .eq('id', editingId)

        if (error) throw error
        toast.success('Data atualizada com sucesso!')
        setEditingId(null) // Sair do modo de edição
      } else {
        // Modo de criação - adicionar nova data
        const { error } = await supabase
          .from('datas_disponiveis')
          .insert({
            ...dateData,
            created_at: getDataAtualISO()
          })

        if (error) throw error
        toast.success('Data cadastrada com sucesso!')
      }

      // Limpar formulário
      setFormData({
        filial_id: '',
        medico_id: '',
        data: ''
      })

      // Recarregar datas disponíveis
      fetchDatasDisponiveis()
    } catch (error: any) {
      console.error('Erro ao salvar data:', error)
      toast.error(error.message || 'Erro ao salvar data')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigureHorarios = async (filial: Filial) => {
    try {
      setSelectedFilial(filial)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Erro ao configurar horários:', error)
      toast.error('Erro ao abrir configuração de horários')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('datas_disponiveis')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Data excluída com sucesso!')
      fetchDatasDisponiveis()
    } catch (error) {
      console.error('Erro ao excluir data:', error)
      toast.error('Erro ao excluir data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (date: DataDisponivelExtended) => {
    setEditingId(date.id)
    
    // Preencher o formulário com os dados da data selecionada
    setFormData({
      filial_id: date.filial_id.toString(),
      medico_id: date.medico_id.toString(),
      data: date.data
    })
    
    // Rolar para o topo da página para o usuário ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }



  // Verificar se tem permissão para ver datas
  if (!can('DATES_VIEW')) {
    return (
      <Box className="page-container">
        <Typography variant="h4" component="h1" gutterBottom>
          Acesso Negado
        </Typography>
        <Typography>
          Você não tem permissão para visualizar datas disponíveis.
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciar Datas Disponíveis
      </Typography>

      {can('DATES_CREATE') && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="filial-label">Filial *</InputLabel>
                  <Select
                    labelId="filial-label"
                    name="filial_id"
                    value={formData.filial_id}
                    onChange={handleInputChange}
                    label="Filial *"
                  >
                    <MenuItem value="">Selecione uma filial</MenuItem>
                    {filiais.map(filial => (
                      <MenuItem key={filial.id} value={filial.id}>
                        {filial.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="medico-label">Médico *</InputLabel>
                  <Select
                    labelId="medico-label"
                    name="medico_id"
                    value={formData.medico_id}
                    onChange={handleInputChange}
                    label="Médico *"
                    disabled={!formData.filial_id}
                  >
                    <MenuItem value="">Selecione um médico</MenuItem>
                    {medicos.map(medico => (
                      <MenuItem key={medico.id} value={medico.id}>
                        {medico.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Data *"
                  value={formData.data ? new Date(formData.data + 'T00:00:00') : null}
                  onChange={(novaData) => {
                    if (novaData) {
                      const dataISO = novaData.toISOString().split('T')[0]
                      setFormData(prev => ({ ...prev, data: dataISO }))
                    } else {
                      setFormData(prev => ({ ...prev, data: '' }))
                    }
                  }}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      name: "data"
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  disabled={loading}
                >
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Filial</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Médico</TableCell>
              <TableCell>Horários Disponíveis</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datasDisponiveis.map((date) => {
              const filial = filiais.find(f => f.id === date.filial_id)
              const horarios = Array.isArray(date.horarios_disponiveis) 
                ? date.horarios_disponiveis.slice(0, 3).join(', ') + (date.horarios_disponiveis.length > 3 ? '...' : '')
                : 'N/A'
              
              return (
                <TableRow key={date.id}>
                  <TableCell>{filial?.nome || 'Filial não encontrada'}</TableCell>
                  <TableCell>{formatarData(date.data)}</TableCell>
                  <TableCell>{date.medico_nome}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {horarios}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => filial && handleConfigureHorarios(filial)}
                        title="Configurar horários da filial (afeta todas as datas)"
                      >
                        <SettingsIcon />
                      </IconButton>
                      
                      {can('DATES_EDIT') && (
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleEdit(date)}
                          title="Editar data"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      
                      {can('DATES_DELETE') && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(date.id)}
                          title="Excluir data"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
            {datasDisponiveis.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhuma data disponível cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfigurarHorariosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        filial={selectedFilial}
        onSave={async (config) => {
          if (selectedFilial) {
            await saveScheduleConfig(selectedFilial.id, config);
            toast.success('Configuração de horários salva com sucesso!');
          }
        }}
        initialConfig={selectedFilial ? scheduleConfigs[selectedFilial.id] || null : null}
      />
    </Box>
  )
}
