# Mapeamento Completo do Banco de Dados - Sistema de Gestão de Ótica

## Visão Geral
Este documento mapeia todas as tabelas do sistema unificado, identificando as relações entre elas e destacando a questão da unificação entre **Cidades** e **Filiais**.

## Estrutura Unificada: Apenas Filiais

### Decisão Tomada
- **Tabela `filiais`**: Única tabela para representar locais de atendimento
- **Migração**: Todas as referências `cidade_id` foram migradas para `filial_id`
- **Benefício**: Estrutura unificada para agendamentos e financeiro

### Uso nos Módulos
- **Agendamentos**: Usa `filial_id` para localização
- **Financeiro**: Usa `filial_id` para controle de custos
- **Usuários**: Vinculados a `filial_id`
- **Títulos/OS**: Vinculados a `filial_id`

## Tabelas Principais do Sistema

### 1. TABELA DE LOCALIZAÇÃO

#### `filiais`
```sql
CREATE TABLE filiais (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  telefone VARCHAR(20),
  responsavel VARCHAR(255),
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Usado em**: Usuários, Títulos, OS, Movimentações Financeiras, Despesas, Clientes, Agendamentos, Datas Disponíveis, Configurações de Horários

#### `cidades` (DEPRECIADA - Migrada para filiais)
```sql
-- TABELA DEPRECIADA - Dados migrados para filiais
-- Mantida temporariamente para referência histórica
CREATE TABLE cidades (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  estado VARCHAR(2) NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Status**: Dados migrados para `filiais`. Referências atualizadas para `filial_id`.

### 2. TABELAS DE PESSOAS

#### `usuarios`
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'receptionist',
  filial_id BIGINT REFERENCES filiais(id), -- VINCULADO A FILIAIS
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `clientes`
```sql
CREATE TABLE clientes (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  telefone VARCHAR(20),
  email VARCHAR(255),
  data_nascimento DATE,
  endereco TEXT,
  filial_id BIGINT REFERENCES filiais(id), -- MIGRADO DE cidade_id PARA filial_id
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `medicos`
```sql
CREATE TABLE medicos (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  crm VARCHAR(20) NOT NULL UNIQUE,
  especialidade VARCHAR(255),
  telefone VARCHAR(20),
  email VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. MÓDULO DE AGENDAMENTOS

#### `agendamentos`
```sql
CREATE TABLE agendamentos (
  id BIGINT PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id),
  medico_id BIGINT REFERENCES medicos(id),
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- MIGRADO DE cidade_id
  data_hora TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'agendado',
  tipo_consulta VARCHAR(100),
  observacoes TEXT,
  valor DECIMAL(10,2),
  forma_pagamento VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `datas_disponiveis`
```sql
CREATE TABLE datas_disponiveis (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- MIGRADO DE cidade_id
  data DATE NOT NULL,
  horarios_disponiveis JSONB DEFAULT '[]',
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(cidade_id, data)
);
```

#### `configuracoes_horarios`
```sql
CREATE TABLE configuracoes_horarios (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id) UNIQUE, -- MIGRADO DE cidade_id
  horario_inicio TIME DEFAULT '08:00',
  horario_fim TIME DEFAULT '18:00',
  intervalo_minutos INTEGER DEFAULT 30,
  horarios_almoco JSONB DEFAULT '[]',
  dias_funcionamento JSONB DEFAULT '[1,2,3,4,5]',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4. MÓDULO FINANCEIRO

#### `tipos_fornecedores`
```sql
CREATE TABLE tipos_fornecedores (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `fornecedores`
```sql
CREATE TABLE fornecedores (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- VINCULADO A FILIAIS
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(100),
  endereco TEXT,
  observacao TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `titulos`
```sql
CREATE TABLE titulos (
  id BIGINT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(20) DEFAULT 'pagar',
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  cliente_id BIGINT REFERENCES clientes(id),
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- USA FILIAIS
  categoria VARCHAR(255),
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(50) DEFAULT 'pendente',
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `ordens_servico`
```sql
CREATE TABLE ordens_servico (
  id BIGINT PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id),
  medico_id BIGINT REFERENCES medicos(id),
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- USA FILIAIS
  agendamento_id BIGINT REFERENCES agendamentos(id),
  data_os DATE NOT NULL,
  valor_venda DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'aberta',
  observacoes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `custos_os`
```sql
CREATE TABLE custos_os (
  id BIGINT PRIMARY KEY,
  os_id BIGINT NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo_custo VARCHAR(100) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2) DEFAULT 0,
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `movimentacoes_financeiras`
```sql
CREATE TABLE movimentacoes_financeiras (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id), -- USA FILIAIS
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_movimentacao DATE NOT NULL,
  forma_pagamento VARCHAR(50),
  agendamento_id BIGINT REFERENCES agendamentos(id),
  os_id BIGINT REFERENCES ordens_servico(id),
  titulo_id BIGINT REFERENCES titulos(id),
  observacoes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 5. TABELAS FALTANTES NO SCHEMA (IDENTIFICADAS NO CÓDIGO)

#### `categorias` (ou `categorias_despesas`)
```sql
-- TABELA FALTANTE - Referenciada no código mas não existe no schema
CREATE TABLE categorias (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'despesa_fixa', 'despesa_diversa', etc.
  descricao TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Usado em**: DespesasFixas.tsx, DespesasDiversas.tsx, ExtratoDespesas.tsx

#### `despesas_fixas`
```sql
-- TABELA FALTANTE - Referenciada no código mas não existe no schema
CREATE TABLE despesas_fixas (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id),
  categoria_id BIGINT REFERENCES categorias(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL,
  periodicidade VARCHAR(20) NOT NULL, -- 'mensal', 'bimestral', etc.
  dia_vencimento INTEGER NOT NULL,
  forma_pagamento VARCHAR(50),
  observacao TEXT,
  status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'inativo'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Usado em**: DespesasFixas.tsx, ExtratoDespesas.tsx

#### `despesas_diversas`
```sql
-- TABELA FALTANTE - Referenciada no código mas não existe no schema
CREATE TABLE despesas_diversas (
  id BIGINT PRIMARY KEY,
  filial_id BIGINT NOT NULL REFERENCES filiais(id),
  categoria_id BIGINT REFERENCES categorias(id),
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL,
  data_despesa DATE NOT NULL,
  data_pagamento DATE,
  forma_pagamento VARCHAR(50),
  observacao TEXT,
  status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```
**Usado em**: DespesasDiversas.tsx, ExtratoDespesas.tsx

#### `registros_financeiros`
```sql
-- TABELA EXISTENTE NO SCHEMA TYPES MAS PODE ESTAR DESATUALIZADA
CREATE TABLE registros_financeiros (
  id BIGINT PRIMARY KEY,
  agendamento_id BIGINT NOT NULL REFERENCES agendamentos(id),
  cliente VARCHAR(255) NOT NULL,
  valor VARCHAR(50) NOT NULL, -- Deveria ser DECIMAL?
  tipo VARCHAR(50) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL,
  situacao VARCHAR(50) NOT NULL,
  observacoes TEXT,
  data_pagamento DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 6. SISTEMA DE NOTIFICAÇÕES

#### `templates_notificacoes`
```sql
CREATE TABLE templates_notificacoes (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'email', 'sms', 'whatsapp'
  assunto VARCHAR(255),
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `notificacoes_enviadas`
```sql
CREATE TABLE notificacoes_enviadas (
  id BIGINT PRIMARY KEY,
  template_id BIGINT REFERENCES templates_notificacoes(id),
  destinatario VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  conteudo TEXT,
  status VARCHAR(50) DEFAULT 'enviado',
  data_envio TIMESTAMP DEFAULT NOW(),
  agendamento_id BIGINT REFERENCES agendamentos(id),
  cliente_id BIGINT REFERENCES clientes(id),
  erro TEXT
);
```

## Estratégia de Unificação: IMPLEMENTADA

### Decisão Tomada: Filiais como Tabela Principal ✅
**Motivos da escolha:**
- Mais completa (tem endereço, telefone, responsável)
- Já usada no módulo financeiro
- Melhor para controle administrativo
- Conceito mais apropriado para sistema empresarial

### Ações Implementadas:
✅ 1. Criação de colunas `filial_id` nas tabelas que usavam `cidade_id`
✅ 2. Migração de dados de `cidades` para `filiais` (quando não existiam)
✅ 3. Atualização de todas as referências `cidade_id` para `filial_id`
✅ 4. Script de migração criado (`migration_supabase.sql`)

### Próximas Ações Necessárias:
🔄 1. Executar o script de migração no Supabase
🔄 2. Atualizar componentes React que usam cidades
🔄 3. Atualizar tipos TypeScript
🔄 4. Testar funcionalidades de agendamento
🔄 5. Remover referências à tabela `cidades` (opcional)

## Arquivos que Precisam ser Atualizados

### Componentes React
- `src/pages/agend/Cidades.tsx`
- `src/pages/cmv/Filiais.tsx` (pode ser removido se unificar)
- `src/pages/agend/DatasDisponiveis.tsx`
- `src/pages/agend/HistoricoAgendamentos.tsx`
- `src/pages/cmv/DespesasFixas.tsx`
- `src/pages/cmv/DespesasDiversas.tsx`
- `src/pages/cmv/ExtratoDespesas.tsx`
- `src/pages/cmv/RelatorioOS.tsx`
- `src/pages/cmv/Financeiro.tsx`
- `src/contexts/AppContext.tsx`

### Arquivos de Configuração
- `src/types/database.ts`
- `database/schema.sql`
- `src/components/Layout/Sidebar.tsx`

## Status da Implementação

### ✅ Concluído
1. **Script de Migração**: Criado `migration_supabase.sql` com lógica completa
2. **Documentação**: Atualizada para refletir nova estrutura
3. **Mapeamento**: Banco de dados documentado com estrutura unificada

### 🔄 Em Andamento
1. **Execução da Migração**: Aguardando execução no Supabase
2. **Atualização do Frontend**: Componentes React precisam ser atualizados
3. **Tipos TypeScript**: Precisam refletir nova estrutura

### 📋 Plano de Finalização
1. **Executar migração** no Supabase usando `migration_supabase.sql`
2. **Atualizar componentes** que referenciam `cidade_id`:
   - `src/pages/Agendamentos.tsx`
   - `src/pages/Clientes.tsx`
   - `src/pages/DatasDisponiveis.tsx`
   - `src/contexts/AppContext.tsx`
3. **Atualizar tipos** em `src/types/database.ts`
4. **Testar funcionalidades** de agendamento e financeiro
5. **Remover referências** à tabela `cidades` (se desejado)

### 🎯 Benefícios Alcançados
- ✨ **Estrutura Unificada**: Uma única tabela para locais
- 🚀 **Consistência**: Mesma referência em agendamentos e financeiro
- 🔧 **Manutenção Simplificada**: Menos duplicação de dados
- 📊 **Relatórios Precisos**: Dados centralizados por filial