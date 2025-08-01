# Plano de Unificação dos Sistemas

## Análise dos Sistemas Existentes

### 1. Sistema Atual (gestão ótica)
- **Tecnologia:** React.js com Supabase
- **Funcionalidades:** Agendamentos, Clientes, Médicos, Cidades, Financeiro básico
- **Estado:** Sistema base simples

### 2. Sistema CMV2
- **Tecnologia:** React.js + TypeScript + Material UI + Supabase
- **Funcionalidades:** 
  - Controle de custos e fornecedores
  - Gestão de títulos a pagar/receber
  - Relatórios financeiros avançados
  - Custo de OS (Ordens de Serviço)
  - Gestão de filiais
  - Sistema de autenticação robusto

### 3. Sistema Agend
- **Tecnologia:** React.js + Firebase + Styled Components
- **Funcionalidades:**
  - Sistema de agendamentos avançado
  - Dashboard com gráficos
  - Gestão de usuários e permissões
  - Histórico de agendamentos
  - Notificações

## Estratégia de Unificação

### Tecnologias Escolhidas
- **Frontend:** React.js + TypeScript (do CMV2)
- **UI Framework:** Material UI (do CMV2)
- **Backend:** Supabase (unificado)
- **Autenticação:** Supabase Auth
- **Gráficos:** Chart.js (do Agend)

### Estrutura Unificada

```
src/
├── components/           # Componentes reutilizáveis
│   ├── common/          # Componentes básicos (Layout, Navbar, etc)
│   ├── forms/           # Formulários específicos
│   ├── charts/          # Componentes de gráficos
│   └── modals/          # Modais do sistema
├── pages/               # Páginas principais
│   ├── dashboard/       # Dashboard unificado
│   ├── agendamentos/    # Módulo de agendamentos
│   ├── clientes/        # Gestão de clientes
│   ├── medicos/         # Gestão de médicos
│   ├── financeiro/      # Módulo financeiro completo
│   ├── fornecedores/    # Gestão de fornecedores
│   ├── os/              # Ordens de serviço
│   ├── relatorios/      # Relatórios avançados
│   └── configuracoes/   # Configurações do sistema
├── services/            # Serviços de API
│   ├── supabase.ts      # Configuração do Supabase
│   ├── auth.ts          # Serviços de autenticação
│   ├── agendamentos.ts  # Serviços de agendamentos
│   ├── financeiro.ts    # Serviços financeiros
│   └── relatorios.ts    # Serviços de relatórios
├── contexts/            # Contextos React
├── hooks/               # Custom hooks
├── utils/               # Utilitários
├── types/               # Definições TypeScript
└── themes/              # Temas Material UI
```

### Módulos Unificados

#### 1. Dashboard Unificado
- Métricas de agendamentos (do Agend)
- Métricas financeiras (do CMV2)
- Gráficos interativos
- Alertas e notificações

#### 2. Módulo de Agendamentos
- Sistema avançado do Agend
- Integração com dados de clientes e médicos
- Histórico completo
- Notificações automáticas

#### 3. Módulo Financeiro Completo
- Controle básico (do sistema atual)
- Gestão de fornecedores (do CMV2)
- Títulos a pagar/receber (do CMV2)
- Custo de OS (do CMV2)
- Relatórios avançados (do CMV2)

#### 4. Gestão de Clientes e Médicos
- Funcionalidades básicas mantidas
- Melhorias de UI/UX
- Integração com agendamentos

### Schema do Banco Unificado

#### Tabelas Existentes (mantidas)
- `cidades`
- `medicos`
- `clientes`
- `agendamentos`
- `financeiro`

#### Novas Tabelas (do CMV2)
- `filiais`
- `tipos_fornecedores`
- `fornecedores`
- `titulos`
- `os` (ordens de serviço)
- `custos_os`
- `usuarios` (sistema de auth)

#### Tabelas de Configuração
- `configuracoes_sistema`
- `permissoes_usuarios`
- `templates_notificacoes`

## Plano de Implementação

### Fase 1: Preparação da Base
1. Migrar sistema atual para TypeScript
2. Implementar Material UI
3. Configurar estrutura de pastas unificada
4. Migrar configuração do Supabase

### Fase 2: Unificação do Backend
1. Criar schema unificado no Supabase
2. Migrar dados do Firebase (Agend) para Supabase
3. Implementar serviços unificados
4. Configurar autenticação

### Fase 3: Módulos Principais
1. Dashboard unificado
2. Sistema de agendamentos avançado
3. Módulo financeiro completo
4. Gestão de fornecedores e OS

### Fase 4: Funcionalidades Avançadas
1. Relatórios e gráficos
2. Sistema de permissões
3. Notificações
4. Exportação de dados

### Fase 5: Testes e Otimização
1. Testes de integração
2. Otimização de performance
3. Documentação
4. Deploy

## Benefícios da Unificação

1. **Sistema Completo:** Todas as funcionalidades em um só lugar
2. **Tecnologia Moderna:** TypeScript + Material UI + Supabase
3. **Melhor UX:** Interface consistente e profissional
4. **Escalabilidade:** Arquitetura preparada para crescimento
5. **Manutenibilidade:** Código organizado e documentado
6. **Performance:** Backend otimizado com Supabase

## Próximos Passos

1. Aprovação do plano
2. Backup dos sistemas existentes
3. Início da implementação por fases
4. Testes incrementais
5. Migração gradual dos dados