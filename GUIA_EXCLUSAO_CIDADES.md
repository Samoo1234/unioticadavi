# GUIA PARA EXCLUSÃO DA TABELA CIDADES

## 📋 Resumo
Este guia explica como excluir a tabela `cidades` do Supabase após a migração completa para a tabela `filiais`.

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

### Pré-requisitos
1. ✅ A migração para `filiais` foi executada com sucesso
2. ✅ Todos os dados foram migrados corretamente
3. ✅ O sistema está funcionando apenas com `filial_id`
4. ✅ Não há mais referências ativas à tabela `cidades`

### Riscos
- ❌ **AÇÃO IRREVERSÍVEL**: Uma vez excluída, a tabela não pode ser recuperada
- ❌ **PERDA DE DADOS**: Todos os dados da tabela `cidades` serão perdidos
- ❌ **QUEBRA DO SISTEMA**: Se ainda houver referências ativas, o sistema pode parar

## 🛠️ Como Usar o Script

### Arquivo: `drop_cidades_table.sql`

### Passo 1: Verificação
O script primeiro verifica:
- Se existem foreign keys apontando para `cidades`
- Se ainda existem colunas `cidade_id` em uso

### Passo 2: Backup Automático
- Cria automaticamente `cidades_backup` antes da exclusão
- Preserva todos os dados originais

### Passo 3: Exclusão
- Remove a tabela `cidades` com `CASCADE`
- Remove todas as dependências automaticamente

### Passo 4: Verificação Final
- Confirma que a tabela foi excluída
- Verifica se o backup foi criado
- Mostra estatísticas das tabelas restantes

## 📝 Execução no Supabase

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Cole o conteúdo de `drop_cidades_table.sql`**
4. **Execute o script completo**
5. **Verifique os resultados**

## 🔍 O Que o Script Faz

### Verificações Iniciais
```sql
-- Mostra todas as foreign keys que referenciam cidades
-- Lista todas as colunas cidade_id ainda existentes
```

### Backup Automático
```sql
-- Cria cidades_backup com todos os dados
CREATE TABLE cidades_backup AS SELECT * FROM cidades;
```

### Exclusão Segura
```sql
-- Remove a tabela e todas as dependências
DROP TABLE IF EXISTS cidades CASCADE;
```

### Verificação Final
```sql
-- Confirma exclusão e backup
-- Mostra estatísticas das tabelas restantes
```

## 📊 Resultado Esperado

Após a execução bem-sucedida:

### ✅ Sucesso
- 🗑️ Tabela `cidades` excluída
- 💾 Backup `cidades_backup` criado
- 📋 Sistema usando apenas `filiais`
- 📈 Estatísticas das tabelas atualizadas

### ❌ Possíveis Erros
- **Foreign key constraints**: Ainda existem referências ativas
- **Tabela em uso**: Alguma query ainda está usando `cidades`
- **Permissões**: Usuário sem permissão para DROP TABLE

## 🔧 Solução de Problemas

### Se der erro de Foreign Key:
1. Execute apenas a parte de verificação do script
2. Identifique quais tabelas ainda referenciam `cidades`
3. Remova essas referências manualmente
4. Execute o script novamente

### Se der erro de Permissão:
1. Verifique se você tem permissões de administrador
2. Execute no SQL Editor do Supabase como owner do projeto

### Para Reverter (se necessário):
```sql
-- Restaurar a tabela a partir do backup
CREATE TABLE cidades AS SELECT * FROM cidades_backup;
```

## 🎯 Benefícios da Exclusão

1. **Limpeza**: Remove tabela desnecessária
2. **Performance**: Menos tabelas para gerenciar
3. **Simplicidade**: Estrutura mais limpa
4. **Consistência**: Apenas `filiais` como referência

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Execute apenas as verificações primeiro
3. Mantenha o backup `cidades_backup` sempre
4. Teste em ambiente de desenvolvimento primeiro

---

**⚠️ LEMBRE-SE**: Esta operação é irreversível. Execute apenas quando tiver certeza de que a migração para `filiais` está funcionando perfeitamente!