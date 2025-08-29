-- Adicionar campo 'credor' na tabela despesas_fixas
ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS credor VARCHAR(255);

-- Comentário: Este campo armazenará o nome do credor/fornecedor da despesa fixa
-- Pode ser usado em conjunto ou como alternativa ao campo 'nome' existente