-- Adicionando coluna 'tipo' à tabela categorias_despesas se não existir
ALTER TABLE public.categorias_despesas 
ADD COLUMN IF NOT EXISTS tipo VARCHAR;
