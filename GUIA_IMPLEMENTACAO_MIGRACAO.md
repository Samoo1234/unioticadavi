# 🔄 Guia de Implementação da Migração
## Sistema de Gestão de Ótica - Unificação do Banco de Dados

---

## 📋 Visão Geral

Este guia detalha o processo completo para unificar as tabelas `cidades` e `filiais` em uma única estrutura, além de adicionar as tabelas faltantes para o sistema de despesas.

### 🎯 Objetivos da Migração

1. **Unificar Cidades e Filiais**: Eliminar duplicação conceitual
2. **Adicionar Tabelas Faltantes**: Implementar sistema completo de despesas e fornecedores
3. **Manter Integridade**: Preservar todos os dados existentes
4. **Otimizar Performance**: Melhorar estrutura e índices

---

## 🗂️ Arquivos Criados

### 📄 Arquivos de Migração

1. **`database/migration_unificacao.sql`**
   - Script SQL completo para migração
   - Criação de novas tabelas
   - Migração de dados
   - Atualização de referências

2. **`database/database_types_updated.ts`**
   - Tipos TypeScript atualizados
   - Novas interfaces
   - Helpers e constantes

3. **`MAPEAMENTO_BANCO_DADOS.md`**
   - Documentação completa do banco
   - Relacionamentos entre tabelas
   - Estrutura atual vs. futura

---

## 🚀 Processo de Implementação

### Fase 1: Preparação (⚠️ CRÍTICO)

#### 1.1 Backup Completo
```bash
# Fazer backup completo do banco de dados
pg_dump -h localhost -U postgres -d gestao_otica > backup_pre_migracao.sql
```

#### 1.2 Ambiente de Teste
```bash
# Criar banco de teste
createdb gestao_otica_teste

# Restaurar backup no teste
psql -h localhost -U postgres -d gestao_otica_teste < backup_pre_migracao.sql
```

#### 1.3 Verificações Pré-Migração
```sql
-- Verificar dados existentes
SELECT 'filiais' as tabela, COUNT(*) as registros FROM filiais
UNION ALL
SELECT 'cidades' as tabela, COUNT(*) as registros FROM cidades
UNION ALL
SELECT 'clientes' as tabela, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'agendamentos' as tabela, COUNT(*) as registros FROM agendamentos;

-- Verificar referências órfãs
SELECT 'Clientes sem cidade' as problema, COUNT(*) as quantidade
FROM clientes c
LEFT JOIN cidades ci ON c.cidade_id = ci.id
WHERE c.cidade_id IS NOT NULL AND ci.id IS NULL;
```

### Fase 2: Execução da Migração

#### 2.1 Executar Script Principal
```bash
# No ambiente de teste primeiro
psql -h localhost -U postgres -d gestao_otica_teste -f database/migration_unificacao.sql

# Verificar resultados
# Se tudo OK, executar em produção
psql -h localhost -U postgres -d gestao_otica -f database/migration_unificacao.sql
```

#### 2.2 Verificações Pós-Migração
```sql
-- Verificar novas tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categorias', 'despesas_fixas', 'despesas_diversas', 'fornecedores');

-- Verificar dados migrados
SELECT 'categorias' as tabela, COUNT(*) as registros FROM categorias
UNION ALL
SELECT 'despesas_fixas' as tabela, COUNT(*) as registros FROM despesas_fixas
UNION ALL
SELECT 'despesas_diversas' as tabela, COUNT(*) as registros FROM despesas_diversas
UNION ALL
SELECT 'fornecedores' as tabela, COUNT(*) as registros FROM fornecedores
UNION ALL
SELECT 'filiais_atualizadas' as tabela, COUNT(*) as registros FROM filiais
WHERE estado IS NOT NULL;

-- Verificar integridade referencial
SELECT 'Clientes com filial válida' as status, COUNT(*) as quantidade
FROM clientes c
JOIN filiais f ON c.cidade_id = f.id;
```

### Fase 3: Atualização do Código

#### 3.1 Atualizar Tipos TypeScript
```bash
# Substituir arquivo de tipos
cp database/database_types_updated.ts src/types/database.ts
```

#### 3.2 Componentes a Atualizar

##### 📁 `src/pages/cadastros/Cidades.tsx`
```typescript
// ANTES: Gerenciava tabela 'cidades'
// DEPOIS: Redirecionar para Filiais ou remover

// Opção 1: Redirecionar
import { Navigate } from 'react-router-dom'
export default function Cidades() {
  return <Navigate to="/cadastros/filiais" replace />
}

// Opção 2: Remover completamente e atualizar rotas
```

##### 📁 `src/pages/cadastros/Filiais.tsx`
```typescript
// Adicionar campos de cidade
interface FilialFormData {
  nome: string
  endereco: string
  telefone: string
  responsavel: string
  estado: string // NOVO
  cep: string // NOVO
  cidade: string // NOVO
  ativa: boolean
}

// Atualizar formulário
<TextField
  label="Estado"
  name="estado"
  value={formData.estado}
  onChange={handleInputChange}
  inputProps={{ maxLength: 2 }}
/>
<TextField
  label="CEP"
  name="cep"
  value={formData.cep}
  onChange={handleInputChange}
/>
<TextField
  label="Cidade"
  name="cidade"
  value={formData.cidade}
  onChange={handleInputChange}
/>
```

##### 📁 `src/pages/agendamentos/DatasDisponiveis.tsx`
```typescript
// ANTES: Buscava 'cidades'
const { data: cidades } = useQuery({
  queryKey: ['cidades'],
  queryFn: async () => {
    const { data } = await supabase
      .from('cidades')
      .select('*')
      .eq('ativa', true)
    return data || []
  }
})

// DEPOIS: Buscar 'filiais'
const { data: filiais } = useQuery({
  queryKey: ['filiais'],
  queryFn: async () => {
    const { data } = await supabase
      .from('filiais')
      .select('*')
      .eq('ativa', true)
    return data || []
  }
})

// Atualizar referências no JSX
{filiais?.map(filial => (
  <MenuItem key={filial.id} value={filial.id}>
    {filial.nome} - {filial.estado}
  </MenuItem>
))}
```

##### 📁 `src/pages/agendamentos/HistoricoAgendamentos.tsx`
```typescript
// Atualizar query para usar filiais
const { data: agendamentos } = useQuery({
  queryKey: ['agendamentos'],
  queryFn: async () => {
    const { data } = await supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(*),
        medico:medicos(*),
        filial:filiais(*)
      `)
    return data || []
  }
})
```

##### 📁 `src/pages/cadastros/Clientes.tsx`
```typescript
// Atualizar para usar filiais em vez de cidades
const { data: filiais } = useQuery({
  queryKey: ['filiais'],
  queryFn: async () => {
    const { data } = await supabase
      .from('filiais')
      .select('*')
      .eq('ativa', true)
    return data || []
  }
})

// Atualizar campo no formulário
<FormControl fullWidth>
  <InputLabel>Filial</InputLabel>
  <Select
    name="filial_id" // era cidade_id
    value={formData.filial_id}
    onChange={handleSelectChange}
  >
    {filiais?.map(filial => (
      <MenuItem key={filial.id} value={filial.id}>
        {filial.nome} - {filial.estado}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

#### 3.3 Atualizar Sidebar
```typescript
// src/components/Sidebar.tsx
// Remover ou comentar link para Cidades
/*
{
  text: 'Cidades',
  icon: <LocationCityIcon />,
  path: '/cadastros/cidades'
},
*/

// Manter apenas Filiais
{
  text: 'Filiais',
  icon: <BusinessIcon />,
  path: '/cadastros/filiais'
},
```

#### 3.4 Atualizar Rotas
```typescript
// src/App.tsx ou arquivo de rotas
// Remover rota para Cidades
// <Route path="/cadastros/cidades" element={<Cidades />} />

// Ou redirecionar
<Route path="/cadastros/cidades" element={<Navigate to="/cadastros/filiais" replace />} />
```

### Fase 4: Implementar Novas Funcionalidades

#### 4.1 Componente de Categorias
```typescript
// src/pages/cmv/Categorias.tsx
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Categoria, CategoriaInsert } from '../../types/database'

// Implementar CRUD completo para categorias
```

#### 4.2 Atualizar Despesas Fixas
```typescript
// src/pages/cmv/DespesasFixas.tsx
// Já implementado, mas verificar se usa as novas tabelas

// Atualizar queries para usar novas tabelas
const { data: despesas } = useQuery({
  queryKey: ['despesas-fixas'],
  queryFn: async () => {
    const { data } = await supabase
      .from('despesas_fixas')
      .select(`
        *,
        filial:filiais(*),
        categoria:categorias(*)
      `)
    return data || []
  }
})
```

#### 4.3 Implementar Despesas Diversas
```typescript
// src/pages/cmv/DespesasDiversas.tsx
// Implementar componente completo usando nova tabela
```

### Fase 5: Testes e Validação

#### 5.1 Testes Funcionais
- [ ] Login e autenticação
- [ ] Gestão de filiais (CRUD)
- [ ] Cadastro de clientes com filial
- [ ] Agendamentos com filial
- [ ] Despesas fixas (CRUD)
- [ ] Despesas diversas (CRUD)
- [ ] Relatórios financeiros

#### 5.2 Testes de Performance
```sql
-- Verificar performance das queries
EXPLAIN ANALYZE SELECT * FROM clientes c
JOIN filiais f ON c.filial_id = f.id
WHERE f.ativa = true;

-- Verificar índices
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('filiais', 'despesas_fixas', 'despesas_diversas', 'categorias');
```

#### 5.3 Testes de Integridade
```sql
-- Verificar constraints
SELECT conname, contype, confrelid::regclass, conkey, confkey
FROM pg_constraint
WHERE conrelid IN (
  'despesas_fixas'::regclass,
  'despesas_diversas'::regclass,
  'categorias'::regclass
);
```

### Fase 6: Limpeza Final

#### 6.1 Remover Tabela Cidades (Opcional)
```sql
-- APENAS após confirmar que tudo funciona
-- E após atualizar todo o código

-- Verificar se não há mais referências
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name LIKE '%cidade%'
AND table_schema = 'public';

-- Se tudo OK, remover
-- DROP TABLE cidades CASCADE;
```

#### 6.2 Otimizações Finais
```sql
-- Atualizar estatísticas
ANALYZE;

-- Reindexar se necessário
REINDEX DATABASE gestao_otica;
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Referência Órfã
```sql
-- Identificar registros órfãos
SELECT * FROM clientes c
LEFT JOIN filiais f ON c.cidade_id = f.id
WHERE c.cidade_id IS NOT NULL AND f.id IS NULL;

-- Corrigir manualmente ou criar filial padrão
INSERT INTO filiais (nome, endereco, ativa)
VALUES ('Filial Padrão', 'Endereço não informado', true);
```

#### 2. Erro de Tipo TypeScript
```typescript
// Limpar cache do TypeScript
// Reiniciar servidor de desenvolvimento
npm run dev

// Verificar imports
import { Filial } from '../types/database'
// em vez de
import { Cidade } from '../types/database'
```

#### 3. Erro de Query Supabase
```typescript
// Verificar se tabela existe
const { data, error } = await supabase
  .from('filiais')
  .select('*')
  .limit(1)

if (error) {
  console.error('Erro na query:', error)
}
```

### Rollback de Emergência

```bash
# Se algo der errado, restaurar backup
psql -h localhost -U postgres -d gestao_otica < backup_pre_migracao.sql

# Reverter arquivos de código
git checkout HEAD~1 src/types/database.ts
```

---

## 📊 Checklist de Validação

### ✅ Pré-Migração
- [ ] Backup completo realizado
- [ ] Ambiente de teste configurado
- [ ] Verificações de integridade executadas
- [ ] Equipe notificada sobre manutenção

### ✅ Durante Migração
- [ ] Script executado sem erros
- [ ] Dados migrados corretamente
- [ ] Índices criados
- [ ] Triggers funcionando
- [ ] RLS configurado

### ✅ Pós-Migração
- [ ] Tipos TypeScript atualizados
- [ ] Componentes React atualizados
- [ ] Rotas ajustadas
- [ ] Sidebar atualizada
- [ ] Testes funcionais passando
- [ ] Performance verificada

### ✅ Finalização
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Monitoramento ativo
- [ ] Backup pós-migração

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. **Consultar logs**: Verificar logs do PostgreSQL e da aplicação
2. **Verificar documentação**: Consultar `MAPEAMENTO_BANCO_DADOS.md`
3. **Testar em ambiente isolado**: Sempre testar mudanças antes de aplicar em produção
4. **Manter backups**: Sempre ter backup recente antes de mudanças

---

## 🎉 Benefícios Esperados

Após a migração completa:

- ✨ **Estrutura Unificada**: Eliminação de duplicação conceitual
- 🚀 **Performance Melhorada**: Menos JOINs desnecessários
- 🔧 **Manutenção Simplificada**: Menos tabelas para gerenciar
- 📊 **Relatórios Mais Precisos**: Dados centralizados
- 🛡️ **Segurança Aprimorada**: RLS configurado corretamente
- 📈 **Escalabilidade**: Estrutura preparada para crescimento

---

*Última atualização: $(date)*
*Versão: 1.0*