-- Script para padronizar a estrutura das tabelas despesas_fixas e despesas_diversas
-- Este script faz com que a tabela despesas_fixas siga o mesmo padrão da tabela despesas_diversas

-- 1. Adicionar chave estrangeira para a tabela filiais caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'despesas_fixas_filial_id_fkey' 
        AND table_name = 'despesas_fixas'
    ) THEN
        ALTER TABLE public.despesas_fixas
        ADD CONSTRAINT despesas_fixas_filial_id_fkey
        FOREIGN KEY (filial_id)
        REFERENCES public.filiais(id);
    END IF;
END $$;

-- 2. Adicionar chave estrangeira para a tabela categorias caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'despesas_fixas_categoria_id_fkey' 
        AND table_name = 'despesas_fixas'
    ) THEN
        ALTER TABLE public.despesas_fixas
        ADD CONSTRAINT despesas_fixas_categoria_id_fkey
        FOREIGN KEY (categoria_id)
        REFERENCES public.categorias(id);
    END IF;
END $$;

-- 3. Verificar se existem campos que precisam ser adicionados para padronizar com despesas_diversas
DO $$
BEGIN
    -- Adicionar coluna data_pagamento se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_fixas' AND column_name = 'data_pagamento'
    ) THEN
        ALTER TABLE public.despesas_fixas ADD COLUMN data_pagamento date;
    END IF;

    -- Adicionar coluna forma_pagamento se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_fixas' AND column_name = 'forma_pagamento'
    ) THEN
        ALTER TABLE public.despesas_fixas ADD COLUMN forma_pagamento varchar;
    END IF;

    -- Padronizar nome do campo de observações
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_fixas' AND column_name = 'observacao'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_fixas' AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE public.despesas_fixas RENAME COLUMN observacao TO observacoes;
    END IF;
    
    -- Adicionar coluna comprovante_url se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_fixas' AND column_name = 'comprovante_url'
    ) THEN
        ALTER TABLE public.despesas_fixas ADD COLUMN comprovante_url varchar;
    END IF;
END $$;

-- 4. Verificar se a coluna status tem os mesmos valores possíveis
-- Verificar quais valores estão sendo usados na tabela
SELECT DISTINCT status FROM public.despesas_fixas;
SELECT DISTINCT status FROM public.despesas_diversas;

-- Comentário: Após verificar os valores, ajustar se necessário
-- A tabela despesas_diversas usa 'pendente'/'pago'
-- A tabela despesas_fixas usa 'ativo'/'inativo'
