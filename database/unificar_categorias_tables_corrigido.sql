-- 1. Primeiro migrar os dados da tabela categorias_despesas para categorias
INSERT INTO public.categorias (nome, descricao, created_at, updated_at, tipo)
SELECT cd.nome, cd.descricao, cd.created_at, cd.updated_at, 'categoria_despesa'
FROM public.categorias_despesas cd
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias c WHERE LOWER(c.nome) = LOWER(cd.nome) AND c.tipo = 'categoria_despesa'
);

-- 2. Atualizar DespesasFixas.tsx para usar a tabela categorias com tipo = 'despesa_fixa'
-- Este comentário é apenas para documentação, não afeta o SQL

-- 3. Verificar se há referências para categorias_despesas em outros lugares antes de remover
-- Este comentário é apenas para documentação, não afeta o SQL

-- 4. Adicionar as categorias de despesas marcadas como 'categoria_despesa'
UPDATE public.categorias 
SET tipo = 'categoria_despesa' 
WHERE tipo IS NULL AND id IN (
    SELECT c.id FROM public.categorias c
    JOIN public.categorias_despesas cd ON LOWER(c.nome) = LOWER(cd.nome)
);

-- 5. Verificar possíveis duplicações e resolver
-- Por exemplo, se tivermos nomes iguais em ambas as tabelas
-- mas com descrições diferentes, podemos decidir manter ambas
-- mas com tipos diferentes para diferenciá-las.

-- Comentários para documentação
COMMENT ON COLUMN public.categorias.tipo IS 'Tipo da categoria (despesa_fixa, categoria_despesa, etc)';
