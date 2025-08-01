// Páginas principais do sistema
export { default as Dashboard } from './Dashboard'
export { default as Clientes } from './Clientes'
export { Medicos } from './Medicos'
// export { default as Cidades } from './Cidades' // Removido - agora usa Filiais
export { default as Usuarios } from './Usuarios'
export { default as DatasDisponiveis } from './DatasDisponiveis'
export { default as Agendamentos } from './Agendamentos'
export { default as Financeiro } from './Financeiro';
export { default as HistoricoAgendamentos } from './HistoricoAgendamentos';
export { default as AgendamentoForm } from './AgendamentoForm';

// Módulo CMV
export { default as CategoriasDespesas } from './cmv/CategoriasDespesas'
export { default as CustoOS } from './cmv/CustoOS'
export { default as DespesasDiversas } from './cmv/DespesasDiversas'
export { default as DespesasFixas } from './cmv/DespesasFixas'
export { default as EmissaoTitulos } from './cmv/EmissaoTitulos'
export { default as ExtratoDespesas } from './cmv/ExtratoDespesas'
export { Filiais } from './cmv/Filiais'
export { default as Fornecedores } from './cmv/Fornecedores'
export { default as RelatorioOS } from './cmv/RelatorioOS'
export { default as TiposFornecedores } from './cmv/TiposFornecedores'
export { default as Titulos } from './cmv/Titulos'

// Páginas de autenticação
export { default as Login } from './Login'

// Tipos e interfaces
export type {
  Usuario,
  Agendamento,
  Cliente,
  Medico,
  Filial,
  Titulo
} from '../types'

// Re-exportar componentes específicos se necessário
// Tipos Props removidos pois não são definidos nos componentes