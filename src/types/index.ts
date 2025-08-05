// Re-exportar todos os tipos do database.ts
export * from './database'

// Tipos específicos para as entidades principais
export type {
  Filial,
  Cidade,
  Medico,
  Cliente,
  Usuario,
  Agendamento,
  DataDisponivel,
  ConfiguracaoHorario,
  TipoFornecedor,
  Fornecedor,
  Titulo,
  OrdemServico,
  CustoOS,
  MovimentacaoFinanceira,
  TemplateNotificacao,
  NotificacaoEnviada
} from './database'

// Enums
export {
  StatusAgendamento,
  TipoTitulo,
  StatusTitulo,
  StatusOS,
  TipoMovimentacao,
  RoleUsuario,
  TipoNotificacao,
  StatusNotificacao
} from './database'

// Utilitários de data
export * from '../utils/dateUtils'