# Instruções para Corrigir o Problema tipo_id NULL

## Problema Identificado
- A coluna `tipo_id` na tabela `titulos` está com valores NULL para registros com `tipo = 'pagar'` e outros
- Isso está causando falha nos filtros da aplicação que usam `tipo_id`

## Possíveis Causas para o UPDATE não funcionar
1. **Permissões RLS (Row Level Security) no Supabase**
2. **Triggers que bloqueiam a atualização**
3. **Restrições de chave estrangeira**
4. **Usuário sem permissões suficientes**

## Solução Passo a Passo

### 1. Execute como Administrador
Use uma conexão com privilégios de administrador no Supabase SQL Editor, não através da API.

### 2. Desative RLS Temporariamente
```sql
ALTER TABLE titulos DISABLE ROW LEVEL SECURITY;
```

### 3. Execute a Atualização Direta
```sql
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar';

-- Para outros tipos (ajuste os IDs conforme necessário)
UPDATE titulos SET tipo_id = 2 WHERE tipo ILIKE 'arma%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 3 WHERE tipo ILIKE 'lente%' AND tipo_id IS NULL;
```

### 4. Verifique o Resultado
```sql
SELECT COUNT(*) FROM titulos WHERE tipo = 'pagar' AND tipo_id IS NULL;
```

### 5. Habilite RLS Novamente
```sql
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;
```

## Se o problema persistir:

1. **Verifique permissões do usuário**:
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'titulos';
```

2. **Verifique triggers e restrições**:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'titulos';

SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'titulos';
```

3. **Atualize através de uma função SQL privilegiada**:
```sql
CREATE OR REPLACE FUNCTION admin_update_tipo_id()
RETURNS void AS $$
BEGIN
  UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute a função
SELECT admin_update_tipo_id();
```

O arquivo `solucao_final_tipo_id.sql` contém o script completo para resolver este problema.
