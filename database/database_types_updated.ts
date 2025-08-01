// =============================================
// TIPOS ATUALIZADOS DO BANCO DE DADOS
// Sistema de Gestão de Ótica
// =============================================
// Este arquivo contém os tipos TypeScript atualizados após a unificação

export interface Database {
  public: {
    Tables: {
      // =============================================
      // TABELAS PRINCIPAIS (ATUALIZADAS)
      // =============================================
      
      filiais: {
        Row: {
          id: number
          nome: string
          endereco: string | null
          telefone: string | null
          responsavel: string | null
          estado: string | null // NOVO CAMPO
          cep: string | null // NOVO CAMPO
          cidade: string | null // NOVO CAMPO
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          endereco?: string | null
          telefone?: string | null
          responsavel?: string | null
          estado?: string | null
          cep?: string | null
          cidade?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          endereco?: string | null
          telefone?: string | null
          responsavel?: string | null
          estado?: string | null
          cep?: string | null
          cidade?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // NOTA: Tabela 'cidades' será removida após migração completa
      cidades: {
        Row: {
          id: number
          nome: string
          estado: string
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          estado: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          estado?: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      medicos: {
        Row: {
          id: number
          nome: string
          crm: string
          especialidade: string | null
          telefone: string | null
          email: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          crm: string
          especialidade?: string | null
          telefone?: string | null
          email?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          crm?: string
          especialidade?: string | null
          telefone?: string | null
          email?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      clientes: {
        Row: {
          id: number
          nome: string
          cpf: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          data_nascimento: string | null
          filial_id: number | null // ATUALIZADO: era cidade_id
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          data_nascimento?: string | null
          filial_id?: number | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          cpf?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          data_nascimento?: string | null
          filial_id?: number | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          filial_id: number | null
          role: RoleUsuario
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          filial_id?: number | null
          role?: RoleUsuario
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          filial_id?: number | null
          role?: RoleUsuario
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      agendamentos: {
        Row: {
          id: number
          cliente_id: number
          medico_id: number
          filial_id: number // UNIFICADO: mantém apenas filial_id
          data_agendamento: string
          hora_agendamento: string
          status: StatusAgendamento
          observacoes: string | null
          valor: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          cliente_id: number
          medico_id: number
          filial_id: number
          data_agendamento: string
          hora_agendamento: string
          status?: StatusAgendamento
          observacoes?: string | null
          valor?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          cliente_id?: number
          medico_id?: number
          filial_id?: number
          data_agendamento?: string
          hora_agendamento?: string
          status?: StatusAgendamento
          observacoes?: string | null
          valor?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      datas_disponiveis: {
        Row: {
          id: number
          filial_id: number // ATUALIZADO: era cidade_id
          data_disponivel: string
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          data_disponivel: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          data_disponivel?: string
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      configuracoes_horarios: {
        Row: {
          id: number
          filial_id: number // ATUALIZADO: era cidade_id
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          dia_semana?: number
          hora_inicio?: string
          hora_fim?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // NOVAS TABELAS PARA DESPESAS
      // =============================================

      categorias: {
        Row: {
          id: number
          nome: string
          tipo: string // 'despesa_fixa', 'despesa_diversa', 'receita'
          descricao: string | null
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          tipo: string
          descricao?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          tipo?: string
          descricao?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      despesas_fixas: {
        Row: {
          id: number
          filial_id: number
          categoria_id: number | null
          nome: string
          descricao: string | null
          valor: number
          periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
          dia_vencimento: number
          forma_pagamento: string | null
          observacao: string | null
          status: 'ativo' | 'inativo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          categoria_id?: number | null
          nome: string
          descricao?: string | null
          valor: number
          periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
          dia_vencimento: number
          forma_pagamento?: string | null
          observacao?: string | null
          status?: 'ativo' | 'inativo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          categoria_id?: number | null
          nome?: string
          descricao?: string | null
          valor?: number
          periodicidade?: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
          dia_vencimento?: number
          forma_pagamento?: string | null
          observacao?: string | null
          status?: 'ativo' | 'inativo'
          created_at?: string
          updated_at?: string
        }
      }

      despesas_diversas: {
        Row: {
          id: number
          filial_id: number
          categoria_id: number | null
          fornecedor_id: number | null
          nome: string
          descricao: string | null
          valor: number
          data_despesa: string
          data_pagamento: string | null
          forma_pagamento: string | null
          observacao: string | null
          status: 'pendente' | 'pago' | 'cancelado'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          categoria_id?: number | null
          fornecedor_id?: number | null
          nome: string
          descricao?: string | null
          valor: number
          data_despesa: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          observacao?: string | null
          status?: 'pendente' | 'pago' | 'cancelado'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          categoria_id?: number | null
          fornecedor_id?: number | null
          nome?: string
          descricao?: string | null
          valor?: number
          data_despesa?: string
          data_pagamento?: string | null
          forma_pagamento?: string | null
          observacao?: string | null
          status?: 'pendente' | 'pago' | 'cancelado'
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // TABELAS EXISTENTES (SEM ALTERAÇÕES)
      // =============================================

      tipos_fornecedores: {
        Row: {
          id: number
          nome: string
          descricao: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      fornecedores: {
        Row: {
          id: number
          filial_id: number
          nome: string
          cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          observacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          nome: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          nome?: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          observacao?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      titulos: {
        Row: {
          id: number
          numero: string
          fornecedor_id: number | null
          cliente_id: number | null
          filial_id: number | null
          tipo: TipoTitulo
          valor: number
          data_emissao: string
          data_vencimento: string
          data_pagamento: string | null
          status: StatusTitulo
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: string
          fornecedor_id?: number | null
          cliente_id?: number | null
          filial_id?: number | null
          tipo: TipoTitulo
          valor: number
          data_emissao: string
          data_vencimento: string
          data_pagamento?: string | null
          status?: StatusTitulo
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          numero?: string
          fornecedor_id?: number | null
          cliente_id?: number | null
          filial_id?: number | null
          tipo?: TipoTitulo
          valor?: number
          data_emissao?: string
          data_vencimento?: string
          data_pagamento?: string | null
          status?: StatusTitulo
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      ordens_servico: {
        Row: {
          id: number
          numero: string
          cliente_id: number
          medico_id: number | null
          filial_id: number
          agendamento_id: number | null
          data_abertura: string
          data_entrega: string | null
          status: StatusOS
          valor_total: number | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: string
          cliente_id: number
          medico_id?: number | null
          filial_id: number
          agendamento_id?: number | null
          data_abertura: string
          data_entrega?: string | null
          status?: StatusOS
          valor_total?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          numero?: string
          cliente_id?: number
          medico_id?: number | null
          filial_id?: number
          agendamento_id?: number | null
          data_abertura?: string
          data_entrega?: string | null
          status?: StatusOS
          valor_total?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      custos_os: {
        Row: {
          id: number
          os_id: number
          fornecedor_id: number
          descricao: string
          quantidade: number
          valor_unitario: number
          valor_total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          os_id: number
          fornecedor_id: number
          descricao: string
          quantidade: number
          valor_unitario: number
          valor_total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          os_id?: number
          fornecedor_id?: number
          descricao?: string
          quantidade?: number
          valor_unitario?: number
          valor_total?: number
          created_at?: string
          updated_at?: string
        }
      }

      movimentacoes_financeiras: {
        Row: {
          id: number
          filial_id: number
          tipo: TipoMovimentacao
          valor: number
          data_movimentacao: string
          descricao: string | null
          agendamento_id: number | null
          os_id: number | null
          titulo_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          tipo: TipoMovimentacao
          valor: number
          data_movimentacao: string
          descricao?: string | null
          agendamento_id?: number | null
          os_id?: number | null
          titulo_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          tipo?: TipoMovimentacao
          valor?: number
          data_movimentacao?: string
          descricao?: string | null
          agendamento_id?: number | null
          os_id?: number | null
          titulo_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      templates_notificacoes: {
        Row: {
          id: number
          nome: string
          tipo: TipoNotificacao
          assunto: string
          conteudo: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          tipo: TipoNotificacao
          assunto: string
          conteudo: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          tipo?: TipoNotificacao
          assunto?: string
          conteudo?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      notificacoes_enviadas: {
        Row: {
          id: number
          template_id: number
          agendamento_id: number | null
          cliente_id: number
          data_envio: string
          status: StatusNotificacao
          erro: string | null
          created_at: string
        }
        Insert: {
          id?: number
          template_id: number
          agendamento_id?: number | null
          cliente_id: number
          data_envio: string
          status?: StatusNotificacao
          erro?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          template_id?: number
          agendamento_id?: number | null
          cliente_id?: number
          data_envio?: string
          status?: StatusNotificacao
          erro?: string | null
          created_at?: string
        }
      }

      registros_financeiros: {
        Row: {
          id: number
          agendamento_id: number
          valor_consulta: number | null
          valor_desconto: number | null
          valor_final: number | null
          forma_pagamento: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          agendamento_id: number
          valor_consulta?: number | null
          valor_desconto?: number | null
          valor_final?: number | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          agendamento_id?: number
          valor_consulta?: number | null
          valor_desconto?: number | null
          valor_final?: number | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      StatusAgendamento: 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou'
      TipoTitulo: 'pagar' | 'receber'
      StatusTitulo: 'aberto' | 'pago' | 'vencido' | 'cancelado'
      StatusOS: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada'
      TipoMovimentacao: 'entrada' | 'saida'
      RoleUsuario: 'super_admin' | 'admin' | 'manager' | 'user' | 'financial' | 'medical'
      TipoNotificacao: 'sms' | 'email' | 'whatsapp'
      StatusNotificacao: 'enviado' | 'erro' | 'pendente'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================
// TIPOS AUXILIARES E INTERFACES
// =============================================

// Tipos para as enums
export type StatusAgendamento = Database['public']['Enums']['StatusAgendamento']
export type TipoTitulo = Database['public']['Enums']['TipoTitulo']
export type StatusTitulo = Database['public']['Enums']['StatusTitulo']
export type StatusOS = Database['public']['Enums']['StatusOS']
export type TipoMovimentacao = Database['public']['Enums']['TipoMovimentacao']
export type RoleUsuario = Database['public']['Enums']['RoleUsuario']
export type TipoNotificacao = Database['public']['Enums']['TipoNotificacao']
export type StatusNotificacao = Database['public']['Enums']['StatusNotificacao']

// Tipos para as tabelas
export type Filial = Database['public']['Tables']['filiais']['Row']
export type FilialInsert = Database['public']['Tables']['filiais']['Insert']
export type FilialUpdate = Database['public']['Tables']['filiais']['Update']

export type Cidade = Database['public']['Tables']['cidades']['Row'] // SERÁ REMOVIDO
export type CidadeInsert = Database['public']['Tables']['cidades']['Insert'] // SERÁ REMOVIDO
export type CidadeUpdate = Database['public']['Tables']['cidades']['Update'] // SERÁ REMOVIDO

export type Medico = Database['public']['Tables']['medicos']['Row']
export type MedicoInsert = Database['public']['Tables']['medicos']['Insert']
export type MedicoUpdate = Database['public']['Tables']['medicos']['Update']

export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']

export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert']
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update']

export type DataDisponivel = Database['public']['Tables']['datas_disponiveis']['Row']
export type DataDisponivelInsert = Database['public']['Tables']['datas_disponiveis']['Insert']
export type DataDisponivelUpdate = Database['public']['Tables']['datas_disponiveis']['Update']

export type ConfiguracaoHorario = Database['public']['Tables']['configuracoes_horarios']['Row']
export type ConfiguracaoHorarioInsert = Database['public']['Tables']['configuracoes_horarios']['Insert']
export type ConfiguracaoHorarioUpdate = Database['public']['Tables']['configuracoes_horarios']['Update']

// NOVOS TIPOS PARA DESPESAS
export type Categoria = Database['public']['Tables']['categorias']['Row']
export type CategoriaInsert = Database['public']['Tables']['categorias']['Insert']
export type CategoriaUpdate = Database['public']['Tables']['categorias']['Update']

export type DespesaFixa = Database['public']['Tables']['despesas_fixas']['Row']
export type DespesaFixaInsert = Database['public']['Tables']['despesas_fixas']['Insert']
export type DespesaFixaUpdate = Database['public']['Tables']['despesas_fixas']['Update']

export type DespesaDiversa = Database['public']['Tables']['despesas_diversas']['Row']
export type DespesaDiversaInsert = Database['public']['Tables']['despesas_diversas']['Insert']
export type DespesaDiversaUpdate = Database['public']['Tables']['despesas_diversas']['Update']

// Tipos existentes
export type TipoFornecedor = Database['public']['Tables']['tipos_fornecedores']['Row']
export type TipoFornecedorInsert = Database['public']['Tables']['tipos_fornecedores']['Insert']
export type TipoFornecedorUpdate = Database['public']['Tables']['tipos_fornecedores']['Update']

export type Fornecedor = Database['public']['Tables']['fornecedores']['Row']
export type FornecedorInsert = Database['public']['Tables']['fornecedores']['Insert']
export type FornecedorUpdate = Database['public']['Tables']['fornecedores']['Update']

export type Titulo = Database['public']['Tables']['titulos']['Row']
export type TituloInsert = Database['public']['Tables']['titulos']['Insert']
export type TituloUpdate = Database['public']['Tables']['titulos']['Update']

export type OrdemServico = Database['public']['Tables']['ordens_servico']['Row']
export type OrdemServicoInsert = Database['public']['Tables']['ordens_servico']['Insert']
export type OrdemServicoUpdate = Database['public']['Tables']['ordens_servico']['Update']

export type CustoOS = Database['public']['Tables']['custos_os']['Row']
export type CustoOSInsert = Database['public']['Tables']['custos_os']['Insert']
export type CustoOSUpdate = Database['public']['Tables']['custos_os']['Update']

export type MovimentacaoFinanceira = Database['public']['Tables']['movimentacoes_financeiras']['Row']
export type MovimentacaoFinanceiraInsert = Database['public']['Tables']['movimentacoes_financeiras']['Insert']
export type MovimentacaoFinanceiraUpdate = Database['public']['Tables']['movimentacoes_financeiras']['Update']

export type TemplateNotificacao = Database['public']['Tables']['templates_notificacoes']['Row']
export type TemplateNotificacaoInsert = Database['public']['Tables']['templates_notificacoes']['Insert']
export type TemplateNotificacaoUpdate = Database['public']['Tables']['templates_notificacoes']['Update']

export type NotificacaoEnviada = Database['public']['Tables']['notificacoes_enviadas']['Row']
export type NotificacaoEnviadaInsert = Database['public']['Tables']['notificacoes_enviadas']['Insert']
export type NotificacaoEnviadaUpdate = Database['public']['Tables']['notificacoes_enviadas']['Update']

export type RegistroFinanceiro = Database['public']['Tables']['registros_financeiros']['Row']
export type RegistroFinanceiroInsert = Database['public']['Tables']['registros_financeiros']['Insert']
export type RegistroFinanceiroUpdate = Database['public']['Tables']['registros_financeiros']['Update']

// =============================================
// INTERFACES PARA COMPONENTES (ATUALIZADAS)
// =============================================

// Interface para despesas com dados relacionados
export interface DespesaFixaCompleta extends DespesaFixa {
  filial?: Filial
  categoria?: Categoria
}

export interface DespesaDiversaCompleta extends DespesaDiversa {
  filial?: Filial
  categoria?: Categoria
  fornecedor?: Fornecedor
}

// Interface para agendamentos com dados relacionados
export interface AgendamentoCompleto extends Agendamento {
  cliente?: Cliente
  medico?: Medico
  filial?: Filial
}

// Interface para clientes com dados relacionados
export interface ClienteCompleto extends Cliente {
  filial?: Filial
}

// Interface para usuários com dados relacionados
export interface UsuarioCompleto extends Usuario {
  filial?: Filial
}

// =============================================
// CONSTANTES E HELPERS
// =============================================

export const PERIODICIDADES_DESPESA_FIXA = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' }
] as const

export const STATUS_DESPESA_FIXA = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' }
] as const

export const STATUS_DESPESA_DIVERSA = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' }
] as const

export const TIPOS_CATEGORIA = [
  { value: 'despesa_fixa', label: 'Despesa Fixa' },
  { value: 'despesa_diversa', label: 'Despesa Diversa' },
  { value: 'receita', label: 'Receita' }
] as const

// Helper para obter próxima data de vencimento
export const getProximaDataVencimento = (
  periodicidade: DespesaFixa['periodicidade'],
  diaVencimento: number,
  dataBase?: Date
): Date => {
  const hoje = dataBase || new Date()
  const proximaData = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento)
  
  // Se a data já passou neste mês, avançar para o próximo período
  if (proximaData <= hoje) {
    switch (periodicidade) {
      case 'mensal':
        proximaData.setMonth(proximaData.getMonth() + 1)
        break
      case 'bimestral':
        proximaData.setMonth(proximaData.getMonth() + 2)
        break
      case 'trimestral':
        proximaData.setMonth(proximaData.getMonth() + 3)
        break
      case 'semestral':
        proximaData.setMonth(proximaData.getMonth() + 6)
        break
      case 'anual':
        proximaData.setFullYear(proximaData.getFullYear() + 1)
        break
    }
  }
  
  return proximaData
}

// Helper para formatar valores monetários
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

// Helper para formatar datas
export const formatarData = (data: string | Date): string => {
  const dataObj = typeof data === 'string' ? new Date(data) : data
  return dataObj.toLocaleDateString('pt-BR')
}