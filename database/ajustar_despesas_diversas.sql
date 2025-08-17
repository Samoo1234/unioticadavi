-- Adicionar colunas que possam estar faltando na tabela despesas_diversas
ALTER TABLE public.despesas_diversas 
ADD COLUMN IF NOT EXISTS filial_id INTEGER,
ADD COLUMN IF NOT EXISTS nome VARCHAR,
ADD COLUMN IF NOT EXISTS data_despesa DATE,
ADD COLUMN IF NOT EXISTS data_pagamento DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR,
ADD COLUMN IF NOT EXISTS comprovante_url VARCHAR;
