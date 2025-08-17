# Instruções para Corrigir o Problema tipo_id NULL

## Problema Identificado
- A coluna `tipo_id` na tabela `titulos` está com valores NULL para diversos registros
- Isso está causando falha nos filtros da aplicação que usam `tipo_id`

## Estrutura Real dos Dados
De acordo com o arquivo `titulos_rows.csv`, a estrutura esperada é:
- `tipo_id = 1` corresponde a "Lentes"
- `tipo_id = 2` corresponde a "Armações"

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

### 3. Verifique os IDs Corretos na Tabela tipos_fornecedores
```sql
SELECT id, nome FROM tipos_fornecedores ORDER BY id;
```

### 4. Execute a Atualização Direta
```sql
-- Atualize qualquer registro com tipo 'pagar' para o tipo_id correspondente
-- (normalmente seria 1 se corresponder a tipo "Lentes", verifique primeiro)
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;

-- Para os demais registros
UPDATE titulos SET tipo_id = 2 WHERE tipo ILIKE 'arma%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 1 WHERE tipo ILIKE 'lente%' AND tipo_id IS NULL;
```

### 5. Verifique o Resultado
```sql
SELECT COUNT(*) FROM titulos WHERE tipo_id IS NULL;

-- Ver a distribuição dos tipos após a atualização
SELECT t.tipo_id, tf.nome, t.tipo, COUNT(*) 
FROM titulos t
LEFT JOIN tipos_fornecedores tf ON t.tipo_id = tf.id
GROUP BY t.tipo_id, tf.nome, t.tipo
ORDER BY COUNT(*) DESC;
```

### 6. Habilite RLS Novamente
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
  UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;
  -- adicione os outros updates conforme necessário
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute a função
SELECT admin_update_tipo_id();
```

O arquivo `solucao_final_tipo_id_v2.sql` contém o script atualizado considerando a estrutura real da tabela.
