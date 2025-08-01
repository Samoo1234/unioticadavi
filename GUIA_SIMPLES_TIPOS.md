# 🔧 GUIA SIMPLES - MIGRAÇÃO PARA FILIAIS

## 📋 O QUE ESTÁ ACONTECENDO?

O problema é **MISTURA DE SISTEMAS**:

- Tabela `cidades` vem do **Firebase** (UUID, estrutura diferente)
- Tabela `filiais` é **nativa PostgreSQL** (BIGINT, mais eficiente)
- Melhor usar APENAS `filiais` e migrar todas as referências

## 🎯 SOLUÇÃO SIMPLES

### PASSO 1: Executar o Script de Correção
```sql
-- Execute este arquivo no Supabase:
f:\gestão otica\database\fix_migration_types.sql
```

### PASSO 2: O que o script faz?

1. **VERIFICA** a estrutura atual das tabelas
2. **CRIA** filiais baseadas nas cidades existentes
3. **ADICIONA** colunas `filial_id` onde necessário
4. **MIGRA** todas as referências para usar `filial_id`
5. **MANTÉM** `cidades` para compatibilidade (sem modificar)

## 📊 TIPOS DE DADOS EXPLICADOS

| Tipo | Exemplo | Uso |
|------|---------|-----|
| **BIGINT** | `123456` | Números inteiros grandes (IDs) |
| **UUID** | `550e8400-e29b-41d4-a716-446655440000` | Identificadores únicos (texto) |

## ✅ COMO EXECUTAR NO SUPABASE

1. Acesse o **SQL Editor** no Supabase
2. Copie todo o conteúdo de `fix_migration_types.sql`
3. Cole no editor
4. Clique em **RUN**
5. Aguarde a mensagem: "MIGRAÇÃO CONCLUÍDA COM SUCESSO!"

## 🚨 SE DER ERRO

### Erro: "cannot cast type bigint to uuid"
**Solução:** O script já resolve isso automaticamente

### Erro: "column does not exist"
**Solução:** Verifique se as tabelas existem no banco

### Erro: "permission denied"
**Solução:** Use uma conta com permissões de administrador

## 📝 RESUMO DO QUE VAI ACONTECER

**ANTES:**
- `cidades` = Firebase (UUID, complicado) ❌
- `agendamentos.cidade_id` = referência complicada ❌

**DEPOIS:**
- `filiais` = PostgreSQL nativo (BIGINT) ✅
- `agendamentos.filial_id` = referência simples ✅
- `cidades` = mantida para compatibilidade ✅
- Sistema unificado e eficiente

## 🎉 RESULTADO FINAL

- ✅ Sistema usando apenas `filiais` (PostgreSQL nativo)
- ✅ Todas as tabelas têm `filial_id` funcionando
- ✅ Sem conflitos de tipos UUID vs BIGINT
- ✅ `cidades` mantida para compatibilidade
- ✅ Performance melhorada

---

**💡 DICA:** Agora use `filial_id` em vez de `cidade_id` no seu código. A tabela `cidades` fica como backup.