# Instruções de Migração - Filiais

## Problema Identificado

A tabela `datas_disponiveis` existe no Supabase, mas o código estava tentando usar a coluna `filial_id` que ainda não existia na estrutura do banco. A tabela ainda estava usando `cidade_id` da estrutura anterior.

## Migração Necessária

Para resolver este problema, você precisa executar os seguintes scripts SQL no seu banco Supabase:

### 1. Migração da tabela `datas_disponiveis` (RECOMENDADO)

Execute o arquivo: `fix_datas_disponiveis_migration.sql`

Este script corrigido irá:
- Verificar a estrutura atual dos dados
- Adicionar a coluna `filial_id` à tabela
- Migrar os dados considerando os tipos corretos (uuid para integer)
- Adicionar constraints e índices necessários

### 1.1. Alternativa (se preferir o script original corrigido)

Execute o arquivo: `add_filial_id_to_datas_disponiveis.sql` (já corrigido para lidar com tipos diferentes)

### 2. Migração da tabela `configuracoes_horarios` (MAIS SIMPLES - RECOMENDADO)

Execute o arquivo: `simple_configuracoes_horarios_fix.sql`

Este script simples irá:
- Verificar a estrutura atual sem assumir colunas específicas
- Atualizar apenas registros com `filial_id` NULL
- Adicionar constraints e índices necessários

### 2.1. Alternativa (script mais completo)

Execute o arquivo: `fix_configuracoes_horarios_migration.sql` (já corrigido para não referenciar cidade_id)

### 2.2. Alternativa (script original)

Execute o arquivo: `add_filial_id_to_configuracoes_horarios.sql` (já corrigido para verificar se a coluna existe)

## Como Executar

1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Execute primeiro o script `add_filial_id_to_datas_disponiveis.sql`
4. Execute depois o script `add_filial_id_to_configuracoes_horarios.sql`
5. Verifique se os dados foram migrados corretamente

## Verificação

Após executar os scripts, você pode verificar se a migração funcionou executando:

```sql
-- Verificar estrutura da tabela datas_disponiveis
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis';

-- Verificar dados migrados
SELECT id, cidade_id, filial_id, data 
FROM datas_disponiveis 
LIMIT 5;
```

## Observações

- Os scripts mantêm a coluna `cidade_id` por segurança
- Após confirmar que tudo funciona, você pode opcionalmente remover as colunas `cidade_id`
- As definições de tipos TypeScript já foram atualizadas no arquivo `database.ts`