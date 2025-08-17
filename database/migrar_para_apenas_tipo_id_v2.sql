-- Script aprimorado para migrar completamente de 'tipo' para 'tipo_id' na tabela titulos

-- 0. Desativar RLS para evitar problemas de permissão durante o processo
ALTER TABLE public.titulos DISABLE ROW LEVEL SECURITY;

-- 1. Verificar quantos registros ainda estão com tipo_id NULL
SELECT COUNT(*) as registros_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 2. Listar todos os tipos distintos que ainda não têm tipo_id
SELECT DISTINCT tipo FROM titulos WHERE tipo_id IS NULL ORDER BY tipo;

-- 3. Verificar os tipos disponíveis em tipos_fornecedores
SELECT id, nome FROM tipos_fornecedores ORDER BY id;

-- 4. Atualizar registros que ainda têm tipo_id NULL baseado no mapeamento correto
-- Exemplo: Se tipo_id 1 = Lentes e tipo_id 2 = Armações
-- Atualizar registros com tipo 'Lentes' ou similar para tipo_id = 1
UPDATE titulos SET tipo_id = 1 
WHERE tipo_id IS NULL AND (
    LOWER(tipo) LIKE '%lente%' OR 
    LOWER(tipo) = 'pagar' -- Adicionar outros padrões conforme necessário
);

-- Atualizar registros com tipo 'Armações' ou similar para tipo_id = 2
UPDATE titulos SET tipo_id = 2 
WHERE tipo_id IS NULL AND (
    LOWER(tipo) LIKE '%armac%' OR 
    LOWER(tipo) LIKE '%armaç%' OR
    LOWER(tipo) LIKE '%oculos%' OR
    LOWER(tipo) LIKE '%óculos%'
);

-- 5. Verificar se ainda há registros sem tipo_id
SELECT COUNT(*) as registros_ainda_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 6. Backup dos registros que ainda não têm tipo_id antes de atribuir valor padrão
CREATE TEMP TABLE IF NOT EXISTS titulos_sem_tipo_id AS
SELECT * FROM titulos WHERE tipo_id IS NULL;

-- 7. Atribuir valor padrão para registros restantes sem tipo_id
UPDATE titulos SET tipo_id = 1 WHERE tipo_id IS NULL;

-- 8. Verificar novamente se todos os registros têm tipo_id
SELECT COUNT(*) as registros_sem_tipo_id_final FROM titulos WHERE tipo_id IS NULL;

-- 9. Adicionar restrição de chave estrangeira (se ainda não existir)
-- Primeiro verificar se a chave já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'titulos_tipo_id_fkey' 
        AND table_name = 'titulos'
    ) THEN
        ALTER TABLE titulos 
        ADD CONSTRAINT titulos_tipo_id_fkey 
        FOREIGN KEY (tipo_id) REFERENCES tipos_fornecedores(id);
    END IF;
END $$;

-- 10. Adicionar restrição NOT NULL à coluna tipo_id
ALTER TABLE titulos ALTER COLUMN tipo_id SET NOT NULL;

-- 11. Criar uma visualização para manter compatibilidade com código legado
-- que ainda depende da coluna 'tipo'
CREATE OR REPLACE VIEW titulos_com_tipo AS
SELECT 
    t.*,
    tf.nome AS tipo_nome
FROM 
    titulos t
LEFT JOIN 
    tipos_fornecedores tf ON t.tipo_id = tf.id;

-- 12. OPCIONAL: Remover a coluna 'tipo' (apenas quando estiver seguro)
-- ATENÇÃO: Execute apenas quando a aplicação estiver atualizada para usar apenas tipo_id
-- ALTER TABLE titulos DROP COLUMN tipo;

-- 13. Reativar RLS
ALTER TABLE public.titulos ENABLE ROW LEVEL SECURITY;

-- 14. Verificação final do estado da tabela
SELECT 
    COUNT(*) as total_titulos,
    COUNT(tipo_id) as titulos_com_tipo_id,
    COUNT(DISTINCT tipo_id) as tipos_distintos_usados
FROM titulos;

-- 15. Mostrar alguns registros para validação
SELECT 
    id, 
    tipo_id, 
    tipo, 
    (SELECT nome FROM tipos_fornecedores WHERE id = titulos.tipo_id) as nome_tipo
FROM titulos
LIMIT 10;
