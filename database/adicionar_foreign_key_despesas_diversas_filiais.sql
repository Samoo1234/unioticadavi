-- Script para adicionar chave estrangeira entre despesas_diversas e filiais
-- Isto corrige o erro: "Could not find a relationship between 'despesas_diversas' and 'filiais'"

-- Verificar se a constraint já existe e remover se necessário
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'despesas_diversas_filial_id_fkey' 
        AND table_name = 'despesas_diversas'
    ) THEN
        ALTER TABLE public.despesas_diversas DROP CONSTRAINT despesas_diversas_filial_id_fkey;
    END IF;
END $$;

-- Adicionar a chave estrangeira
ALTER TABLE public.despesas_diversas
ADD CONSTRAINT despesas_diversas_filial_id_fkey
FOREIGN KEY (filial_id)
REFERENCES public.filiais(id);

-- Verificar se a constraint foi criada
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'despesas_diversas'
    AND ccu.table_name = 'filiais';
