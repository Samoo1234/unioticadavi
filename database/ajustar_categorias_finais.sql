-- Transferir categorias específicas que estão faltando para a tabela categorias
INSERT INTO public.categorias (id, nome, tipo, descricao, created_at, updated_at)
VALUES
(22, 'Produto de Limpeza e Higiene', 'categoria_diversa', 'Produtos de limpeza e higiene para o estabelecimento', now(), now()),
(23, 'Doação e Ação Social', 'categoria_diversa', 'Doações e ações sociais', now(), now()),
(24, 'Insumos e Medicamentos', 'categoria_diversa', 'Insumos e medicamentos para uso interno', now(), now()),
(25, 'Fretes', 'categoria_diversa', 'Despesas com fretes e transportes', now(), now()),
(26, 'Propaganda', 'categoria_diversa', 'Gastos com propaganda e publicidade', now(), now())
ON CONFLICT (id) DO UPDATE 
SET nome = EXCLUDED.nome, 
    tipo = EXCLUDED.tipo,
    descricao = EXCLUDED.descricao;
