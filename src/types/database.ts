export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      filiais: {
        Row: {
          id: number
          nome: string
          endereco: string
          telefone: string | null
          responsavel: string | null
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          endereco: string
          telefone?: string | null
          responsavel?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          endereco?: string
          telefone?: string | null
          responsavel?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
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
          data_nascimento: string | null
          endereco: string | null
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
          data_nascimento?: string | null
          endereco?: string | null
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
          data_nascimento?: string | null
          endereco?: string | null
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
          role: string
          filial_id: bigint | null
          ativo: boolean
          ultimo_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          role?: string
          filial_id?: bigint | null
          ativo?: boolean
          ultimo_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          role?: string
          filial_id?: bigint | null
          ativo?: boolean
          ultimo_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agendamentos: {
        Row: {
          id: number
          cliente_id: number | null
          medico_id: number | null
          filial_id: number
          data_hora: string
          status: string
          tipo_consulta: string | null
          observacoes: string | null
          valor: number | null
          forma_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          cliente_id?: number | null
          medico_id?: number | null
          filial_id: number
          data_hora: string
          status?: string
          tipo_consulta?: string | null
          observacoes?: string | null
          valor?: number | null
          forma_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          cliente_id?: number | null
          medico_id?: number | null
          filial_id?: number
          data_hora?: string
          status?: string
          tipo_consulta?: string | null
          observacoes?: string | null
          valor?: number | null
          forma_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      datas_disponiveis: {
        Row: {
          id: number
          filial_id: number
          medico_id: number
          data: string
          horarios_disponiveis: Json
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          medico_id: number
          data: string
          horarios_disponiveis?: Json
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          medico_id?: number
          data?: string
          horarios_disponiveis?: Json
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes_horarios: {
        Row: {
          id: number
          filial_id: number
          horario_inicio: string
          horario_fim: string
          intervalo_minutos: number
          horarios_almoco: Json | null
          dias_funcionamento: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          horario_inicio?: string
          horario_fim?: string
          intervalo_minutos?: number
          horarios_almoco?: Json | null
          dias_funcionamento?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          horario_inicio?: string
          horario_fim?: string
          intervalo_minutos?: number
          horarios_almoco?: Json | null
          dias_funcionamento?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tipos_fornecedores: {
        Row: {
          id: number
          nome: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fornecedores: {
        Row: {
          id: number
          nome: string
          cnpj: string | null
          cpf: string | null
          endereco: string | null
          telefone: string | null
          email: string | null
          contato: string | null
          tipo_id: number | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          cnpj?: string | null
          cpf?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          contato?: string | null
          tipo_id?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          cnpj?: string | null
          cpf?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          contato?: string | null
          tipo_id?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      titulos: {
        Row: {
          id: number
          numero: string
          tipo: string
          fornecedor_id: number | null
          cliente_id: number | null
          filial_id: number
          categoria: string | null
          descricao: string | null
          valor: number
          data_vencimento: string
          data_pagamento: string | null
          status: string
          forma_pagamento: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          numero: string
          tipo?: string
          fornecedor_id?: number | null
          cliente_id?: number | null
          filial_id: number
          categoria?: string | null
          descricao?: string | null
          valor: number
          data_vencimento: string
          data_pagamento?: string | null
          status?: string
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          numero?: string
          tipo?: string
          fornecedor_id?: number | null
          cliente_id?: number | null
          filial_id?: number
          categoria?: string | null
          descricao?: string | null
          valor?: number
          data_vencimento?: string
          data_pagamento?: string | null
          status?: string
          forma_pagamento?: string | null
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
          data_os: string
          valor_venda: number
          status: string
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
          data_os: string
          valor_venda?: number
          status?: string
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
          data_os?: string
          valor_venda?: number
          status?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      custos_os: {
        Row: {
          id: number
          os_id: number
          tipo_custo: string
          descricao: string | null
          valor: number
          fornecedor_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          os_id: number
          tipo_custo: string
          descricao?: string | null
          valor?: number
          fornecedor_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          os_id?: number
          tipo_custo?: string
          descricao?: string | null
          valor?: number
          fornecedor_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      movimentacoes_financeiras: {
        Row: {
          id: number
          filial_id: number
          tipo: string
          categoria: string | null
          descricao: string
          valor: number
          data_movimentacao: string
          forma_pagamento: string | null
          agendamento_id: number | null
          os_id: number | null
          titulo_id: number | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          filial_id: number
          tipo: string
          categoria?: string | null
          descricao: string
          valor: number
          data_movimentacao: string
          forma_pagamento?: string | null
          agendamento_id?: number | null
          os_id?: number | null
          titulo_id?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          filial_id?: number
          tipo?: string
          categoria?: string | null
          descricao?: string
          valor?: number
          data_movimentacao?: string
          forma_pagamento?: string | null
          agendamento_id?: number | null
          os_id?: number | null
          titulo_id?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates_notificacoes: {
        Row: {
          id: number
          nome: string
          tipo: string
          assunto: string | null
          conteudo: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          tipo: string
          assunto?: string | null
          conteudo: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          tipo?: string
          assunto?: string | null
          conteudo?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notificacoes_enviadas: {
        Row: {
          id: number
          template_id: number | null
          destinatario: string
          tipo: string
          conteudo: string | null
          status: string
          data_envio: string
          agendamento_id: number | null
          cliente_id: number | null
          erro: string | null
        }
        Insert: {
          id?: number
          template_id?: number | null
          destinatario: string
          tipo: string
          conteudo?: string | null
          status?: string
          data_envio?: string
          agendamento_id?: number | null
          cliente_id?: number | null
          erro?: string | null
        }
        Update: {
          id?: number
          template_id?: number | null
          destinatario?: string
          tipo?: string
          conteudo?: string | null
          status?: string
          data_envio?: string
          agendamento_id?: number | null
          cliente_id?: number | null
          erro?: string | null
        }
      }
      registros_financeiros: {
        Row: {
          id: number
          agendamento_id: number
          cliente: string
          valor: string
          tipo: string
          forma_pagamento: string
          situacao: string
          observacoes: string | null
          data_pagamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          agendamento_id: number
          cliente: string
          valor: string
          tipo: string
          forma_pagamento: string
          situacao: string
          observacoes?: string | null
          data_pagamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          agendamento_id?: number
          cliente?: string
          valor?: string
          tipo?: string
          forma_pagamento?: string
          situacao?: string
          observacoes?: string | null
          data_pagamento?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para facilitar o uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos específicos para as entidades principais
export type Filial = Tables<'filiais'>
export type Cidade = Tables<'cidades'>
export type Medico = Tables<'medicos'>
export type Cliente = Tables<'clientes'>
export type Usuario = Tables<'usuarios'>
export type Agendamento = Tables<'agendamentos'>
export type DataDisponivel = Tables<'datas_disponiveis'>
export type ConfiguracaoHorario = Tables<'configuracoes_horarios'>
export type TipoFornecedor = Tables<'tipos_fornecedores'>
export type Fornecedor = Tables<'fornecedores'>
export type Titulo = Tables<'titulos'>
export type OrdemServico = Tables<'ordens_servico'>
export type CustoOS = Tables<'custos_os'>
export type MovimentacaoFinanceira = Tables<'movimentacoes_financeiras'>
export type TemplateNotificacao = Tables<'templates_notificacoes'>
export type NotificacaoEnviada = Tables<'notificacoes_enviadas'>

// Enums para status e tipos
export enum StatusAgendamento {
  AGENDADO = 'agendado',
  CONFIRMADO = 'confirmado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
  REMARCADO = 'remarcado'
}

export enum TipoTitulo {
  PAGAR = 'pagar',
  RECEBER = 'receber'
}

export enum StatusTitulo {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  VENCIDO = 'vencido',
  CANCELADO = 'cancelado'
}

export enum StatusOS {
  ABERTA = 'aberta',
  EM_PRODUCAO = 'em_producao',
  PRONTA = 'pronta',
  ENTREGUE = 'entregue',
  CANCELADA = 'cancelada'
}

export enum TipoMovimentacao {
  RECEITA = 'receita',
  DESPESA = 'despesa'
}

export enum RoleUsuario {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  RECEPTIONIST = 'receptionist',
  FINANCIAL = 'financial',
  DOCTOR = 'doctor'
}

export enum TipoNotificacao {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp'
}

export enum StatusNotificacao {
  ENVIADO = 'enviado',
  ENTREGUE = 'entregue',
  FALHOU = 'falhou',
  PENDENTE = 'pendente'
}