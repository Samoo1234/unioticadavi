# Páginas do Sistema de Gestão Ótica

Este diretório contém todas as páginas principais do sistema de gestão para óticas, desenvolvido com React, TypeScript, Material-UI e Supabase.

## 📋 Páginas Principais

### 🏠 Dashboard
**Arquivo:** `Dashboard.tsx`

**Funcionalidades:**
- Visão geral do sistema com métricas principais
- Gráficos de agendamentos por status, cidade e mês
- Métricas financeiras (receitas, despesas, contas a receber/pagar)
- Top médicos por agendamentos
- Cards com estatísticas de agendamentos e clientes

**Tecnologias:** Chart.js, Material-UI, Supabase

---

### 📅 Agendamentos
**Arquivo:** `Agendamentos.tsx`

**Funcionalidades:**
- Listagem de agendamentos com filtros avançados
- Criação e edição de agendamentos
- Gerenciamento de status (pendente, confirmado, realizado, cancelado)
- Integração com clientes, médicos e cidades
- Validações de horário e disponibilidade
- Exportação de dados

**Recursos:**
- Filtros por data, status, médico, cidade
- Paginação e busca
- Notificações de sucesso/erro
- Interface responsiva

---

### 👥 Clientes
**Arquivo:** `Clientes.tsx`

**Funcionalidades:**
- Cadastro completo de clientes
- Histórico de agendamentos por cliente
- Gerenciamento de informações pessoais
- Sistema de busca e filtros
- Validação de dados (CPF, telefone, email)

**Campos:**
- Dados pessoais (nome, CPF, RG, telefone, email)
- Endereço completo
- Data de nascimento
- Observações

---

### 👨‍⚕️ Médicos
**Arquivo:** `Medicos.tsx`

**Funcionalidades:**
- Cadastro de médicos e especialistas
- Gerenciamento de especialidades
- Controle de disponibilidade por cidade
- Estatísticas de agendamentos por médico
- Sistema de ativação/desativação

**Recursos:**
- CRM e especialidade
- Associação com múltiplas cidades
- Horários de atendimento
- Histórico de agendamentos

---

### 🏙️ Cidades
**Arquivo:** `Cidades.tsx`

**Funcionalidades:**
- Gerenciamento de cidades de atendimento
- Configuração de horários por cidade
- Associação com médicos
- Controle de ativação/desativação
- Estatísticas por localização

**Recursos:**
- Nome, estado, CEP
- Horários de funcionamento
- Médicos disponíveis
- Métricas de agendamentos

---

### 👤 Usuários
**Arquivo:** `Usuarios.tsx`

**Funcionalidades:**
- Gerenciamento completo de usuários
- Sistema de permissões granulares
- Controle de acesso por funcionalidade
- Associação com filiais
- Gerenciamento de senhas e segurança

**Recursos:**
- Roles (admin, manager, receptionist, financial, user)
- Permissões por categoria (ver, criar, editar, excluir)
- Status de ativação
- Senhas temporárias
- Auditoria de ações

---

### 💰 Títulos
**Arquivo:** `Titulos.tsx`

**Funcionalidades:**
- Gestão financeira de recebimentos
- Controle de contas a receber
- Baixa de títulos
- Relatórios financeiros
- Integração com agendamentos

**Recursos:**
- Vencimentos e valores
- Status (aberto, pago, vencido)
- Formas de pagamento
- Histórico de baixas
- Relatórios por período

---

### 💸 Despesas
**Arquivo:** `Despesas.tsx`

**Funcionalidades:**
- Controle de gastos e despesas
- Categorização de despesas
- Contas a pagar
- Relatórios de gastos
- Controle de fluxo de caixa

**Recursos:**
- Categorias personalizáveis
- Vencimentos e pagamentos
- Anexos de comprovantes
- Relatórios por categoria
- Dashboard financeiro

---

### 📊 Relatórios
**Arquivo:** `Relatorios.tsx`

**Funcionalidades:**
- Relatórios abrangentes do sistema
- Filtros avançados por período, cidade, médico
- Exportação em PDF e CSV
- Gráficos interativos
- Resumo executivo

**Tipos de Relatório:**
- Agendamentos por período
- Relatórios financeiros
- Performance por médico/cidade
- Análise de conversão
- Relatórios customizados

---

### ⚙️ Configurações
**Arquivo:** `Configuracoes.tsx`

**Funcionalidades:**
- Configurações gerais do sistema
- Informações da empresa
- Configurações de horários por cidade
- Notificações (email, SMS, WhatsApp)
- Configurações de segurança

**Seções:**
- **Geral:** Dados da empresa, tema, idioma
- **Horários:** Configuração por cidade, dias de funcionamento
- **Notificações:** Templates, canais, timing
- **Segurança:** Políticas de senha, sessão, auditoria

---

### 💾 Backup e Restauração
**Arquivo:** `BackupRestore.tsx`

**Funcionalidades:**
- Criação de backups manuais e automáticos
- Restauração de dados
- Configuração de políticas de backup
- Histórico de backups
- Monitoramento de espaço

**Recursos:**
- Backup incremental e completo
- Compressão de arquivos
- Agendamento automático
- Validação de integridade
- Download de backups

---

### 📋 Logs de Auditoria
**Arquivo:** `LogsAuditoria.tsx`

**Funcionalidades:**
- Rastreamento de todas as ações do sistema
- Filtros avançados por usuário, ação, período
- Detalhes completos de cada operação
- Exportação de logs
- Análise de segurança

**Informações Registradas:**
- Usuário, data/hora, IP
- Ação realizada
- Dados antes/depois da alteração
- User agent e detalhes técnicos
- Nível de severidade

---

### 📈 Monitoramento do Sistema
**Arquivo:** `MonitoramentoSistema.tsx`

**Funcionalidades:**
- Monitoramento em tempo real
- Métricas de performance (CPU, memória, disco)
- Status de serviços
- Alertas e notificações
- Histórico de eventos

**Métricas Monitoradas:**
- Recursos do servidor
- Conexões de banco de dados
- Tempo de resposta de APIs
- Status de serviços externos
- Eventos do sistema

---

## 🔐 Páginas de Autenticação

### Login
- Autenticação segura
- Recuperação de senha
- Lembrança de usuário
- Validações de segurança

### Recuperação de Senha
- Reset por email
- Validação de token
- Nova senha segura

---

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Material-UI (MUI)** - Componentes de interface
- **Supabase** - Backend as a Service
- **Chart.js** - Gráficos e visualizações
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações
- **Date-fns** - Manipulação de datas
- **jsPDF** - Geração de PDFs

---

## 📁 Estrutura de Arquivos

```
src/pages/
├── Dashboard.tsx              # Dashboard principal
├── Agendamentos.tsx          # Gestão de agendamentos
├── Clientes.tsx              # Cadastro de clientes
├── Medicos.tsx               # Cadastro de médicos
├── Cidades.tsx               # Gestão de cidades
├── Usuarios.tsx              # Gerenciamento de usuários
├── Titulos.tsx               # Gestão financeira - recebimentos
├── Despesas.tsx              # Gestão financeira - despesas
├── Relatorios.tsx            # Relatórios do sistema
├── Configuracoes.tsx         # Configurações gerais
├── BackupRestore.tsx         # Backup e restauração
├── LogsAuditoria.tsx         # Logs de auditoria
├── MonitoramentoSistema.tsx  # Monitoramento em tempo real
├── Login.tsx                 # Página de login
├── ForgotPassword.tsx        # Recuperação de senha
├── ResetPassword.tsx         # Reset de senha
├── NotFound.tsx              # Página 404
├── Unauthorized.tsx          # Página 403
├── index.ts                  # Exportações
└── README.md                 # Esta documentação
```

---

## 🚀 Como Usar

1. **Importação:**
```typescript
import { Dashboard, Agendamentos, Clientes } from '@/pages'
```

2. **Roteamento:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard, Agendamentos } from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agendamentos" element={<Agendamentos />} />
        {/* ... outras rotas */}
      </Routes>
    </BrowserRouter>
  )
}
```

3. **Contextos Necessários:**
```typescript
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        {/* Suas páginas aqui */}
      </AppProvider>
    </AuthProvider>
  )
}
```

---

## 🔒 Controle de Acesso

Todas as páginas implementam controle de acesso baseado em:

- **Autenticação:** Usuário deve estar logado
- **Autorização:** Permissões específicas por funcionalidade
- **Roles:** Diferentes níveis de acesso
- **Auditoria:** Todas as ações são registradas

---

## 📱 Responsividade

Todas as páginas são totalmente responsivas e funcionam em:

- **Desktop:** Layout completo com todas as funcionalidades
- **Tablet:** Layout adaptado com navegação otimizada
- **Mobile:** Interface simplificada e touch-friendly

---

## 🎨 Temas e Personalização

O sistema suporta:

- **Tema Claro/Escuro:** Configurável por usuário
- **Cores Personalizáveis:** Baseado no Material-UI
- **Idiomas:** Português (padrão), Inglês, Espanhol
- **Layouts:** Adaptáveis por preferência

---

## 🔧 Manutenção e Atualizações

Para adicionar novas páginas:

1. Crie o arquivo `.tsx` seguindo o padrão existente
2. Implemente as interfaces TypeScript necessárias
3. Adicione a exportação no `index.ts`
4. Configure as rotas no sistema de navegação
5. Atualize as permissões se necessário
6. Documente as funcionalidades

---

## 📞 Suporte

Para dúvidas ou problemas:

- Consulte a documentação técnica
- Verifique os logs de auditoria
- Use o sistema de monitoramento
- Entre em contato com a equipe de desenvolvimento