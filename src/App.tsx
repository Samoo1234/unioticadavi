import { Routes, Route, Navigate } from 'react-router-dom'

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout/Layout'

// Pages
import { 
  Login, 
  Dashboard, 
  Clientes,
  Medicos,
  Usuarios,
  DatasDisponiveis,
  Agendamentos,
  Financeiro,
  HistoricoAgendamentos,
  AgendamentoForm
} from '@/pages'

// Importações das páginas do Agend
// Estas importações serão atualizadas quando as páginas forem migradas

// Importações das páginas do CMV2
import {
  CategoriasDespesas,
  CustoOS,
  DespesasDiversas,
  DespesasFixas,
  EmissaoTitulos,
  ExtratoDespesas,
  Filiais,
  Fornecedores,
  RelatorioOS,
  TiposFornecedores,
  Titulos
} from '@/pages'

// Hooks
import { useAuth } from '@/contexts/AuthContext'

function AppContent() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Rota pública - Página inicial */}
      <Route path="/" element={<AgendamentoForm />} />
      
      {/* Rota de login */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Rotas protegidas com Layout */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      
      {/* Cadastros */}
      <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
      <Route path="/medicos" element={<ProtectedRoute><Layout><Medicos /></Layout></ProtectedRoute>} />
      <Route path="/cidades" element={<ProtectedRoute><Layout><Filiais /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/datas-disponiveis" element={<ProtectedRoute><Layout><DatasDisponiveis /></Layout></ProtectedRoute>} />
      
      {/* Configurações */}
      <Route path="/configuracoes/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
      
      {/* Rotas do Sistema de Agendamento */}
      <Route path="/sistema-agendamento/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/datas-disponiveis" element={<ProtectedRoute><Layout><DatasDisponiveis /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/medicos" element={<ProtectedRoute><Layout><Medicos /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/cidades" element={<ProtectedRoute><Layout><Filiais /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/historico" element={<ProtectedRoute><Layout><HistoricoAgendamentos /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/agendamentos" element={<ProtectedRoute><Layout><Agendamentos /></Layout></ProtectedRoute>} />
      <Route path="/sistema-agendamento/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
      
      {/* Rotas do CMV */}
      <Route path="/cmv/categorias-despesas" element={<ProtectedRoute><Layout><CategoriasDespesas /></Layout></ProtectedRoute>} />
      <Route path="/cmv/custo-os" element={<ProtectedRoute><Layout><CustoOS /></Layout></ProtectedRoute>} />
      <Route path="/cmv/despesas-diversas" element={<ProtectedRoute><Layout><DespesasDiversas /></Layout></ProtectedRoute>} />
      <Route path="/cmv/despesas-fixas" element={<ProtectedRoute><Layout><DespesasFixas /></Layout></ProtectedRoute>} />
      <Route path="/cmv/emissao-titulos" element={<ProtectedRoute><Layout><EmissaoTitulos /></Layout></ProtectedRoute>} />
      <Route path="/cmv/extrato-despesas" element={<ProtectedRoute><Layout><ExtratoDespesas /></Layout></ProtectedRoute>} />
      <Route path="/cmv/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
      <Route path="/cmv/relatorio-os" element={<ProtectedRoute><Layout><RelatorioOS /></Layout></ProtectedRoute>} />
      <Route path="/cmv/tipos-fornecedores" element={<ProtectedRoute><Layout><TiposFornecedores /></Layout></ProtectedRoute>} />
      <Route path="/cmv/titulos" element={<ProtectedRoute><Layout><Titulos /></Layout></ProtectedRoute>} />
      <Route path="/cmv/extrato-titulos" element={<ProtectedRoute><Layout><EmissaoTitulos /></Layout></ProtectedRoute>} />
      <Route path="/cmv/filiais" element={<ProtectedRoute><Layout><Filiais /></Layout></ProtectedRoute>} />
      
      {/* Rota 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return <AppContent />
}

export default App