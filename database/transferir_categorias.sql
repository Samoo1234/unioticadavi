-- Transferir as categorias que ainda não existem na tabela categorias
INSERT INTO public.categorias (id, nome, tipo, descricao, created_at, updated_at)
SELECT 
    cd.id, 
    cd.nome, 
    CASE 
        WHEN cd.tipo = 'fixa' THEN 'categoria_fixa'
        WHEN cd.tipo = 'diversa' THEN 'categoria_diversa'
        ELSE cd.tipo
    END,
    '', -- descrição em branco para categorias importadas
    cd.created_at, 
    cd.updated_at
FROM public.categorias_despesas cd
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias c WHERE c.id = cd.id
)
ON CONFLICT (id) DO NOTHING;
