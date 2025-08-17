-- Script para corrigir o relacionamento entre titulos e tipos_fornecedores

-- Verificar a estrutura atual da tabela titulos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'titulos' 
ORDER BY ordinal_position;

-- Verificar se já existe um campo tipo_id
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'titulos' AND column_name = 'tipo_id';

-- Verificar se existe chave estrangeira entre titulos e tipos_fornecedores
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='titulos' 
    AND ccu.table_name='tipos_fornecedores';

-- 1. Adicionar coluna tipo_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'titulos' AND column_name = 'tipo_id'
    ) THEN
        ALTER TABLE titulos ADD COLUMN tipo_id INT;
        RAISE NOTICE 'Coluna tipo_id adicionada à tabela titulos';
    ELSE
        RAISE NOTICE 'Coluna tipo_id já existe na tabela titulos';
    END IF;
END $$;

-- 2. Atualizar o campo tipo_id baseado no campo tipo existente
UPDATE titulos t
SET tipo_id = (
    SELECT id FROM tipos_fornecedores tf
    WHERE LOWER(tf.nome) = LOWER(t.tipo)
    LIMIT 1
)
WHERE t.tipo IS NOT NULL 
  AND t.tipo_id IS NULL
  AND EXISTS (
    SELECT 1 FROM tipos_fornecedores tf
    WHERE LOWER(tf.nome) = LOWER(t.tipo)
  );

-- 3. Verificar quantos registros foram atualizados e quantos ainda precisam de tipo_id
SELECT COUNT(*) AS registros_com_tipo_id FROM titulos WHERE tipo_id IS NOT NULL;
SELECT COUNT(*) AS registros_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 4. Adicionar chave estrangeira se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY' 
          AND table_name = 'titulos'
          AND constraint_name = 'titulos_tipo_id_fkey'
    ) THEN
        -- Adicionar a restrição de chave estrangeira
        ALTER TABLE titulos
        ADD CONSTRAINT titulos_tipo_id_fkey
        FOREIGN KEY (tipo_id) 
        REFERENCES tipos_fornecedores(id);
        
        RAISE NOTICE 'Chave estrangeira adicionada entre titulos.tipo_id e tipos_fornecedores.id';
    ELSE
        RAISE NOTICE 'Chave estrangeira já existe';
    END IF;
END $$;

-- 5. Verificar se a chave estrangeira foi adicionada
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='titulos' 
    AND ccu.table_name='tipos_fornecedores';
