-- Adicionar uma coluna 'tipo_id' à tabela categorias para permitir organização por tipo (despesa, categoria despesa, etc)
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS tipo_id INTEGER;

-- Migrar dados da tabela categorias_despesas para a tabela categorias
-- Primeiro, adicionando registros de categorias_despesas que ainda não existem em categorias
INSERT INTO public.categorias (nome, descricao, created_at, updated_at, tipo)
SELECT cd.nome, cd.descricao, cd.created_at, cd.updated_at, 'categoria_despesa'
FROM public.categorias_despesas cd
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias c WHERE LOWER(c.nome) = LOWER(cd.nome) AND c.tipo = 'categoria_despesa'
);

-- Criar view para manter compatibilidade com código existente
CREATE OR REPLACE VIEW public.categorias_despesas AS
SELECT id, nome, descricao, created_at, updated_at
FROM public.categorias
WHERE tipo = 'categoria_despesa';

-- Criar função para manter a view atualizável
CREATE OR REPLACE FUNCTION public.categorias_despesas_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categorias (nome, descricao, created_at, updated_at, tipo)
    VALUES (NEW.nome, NEW.descricao, NEW.created_at, NEW.updated_at, 'categoria_despesa')
    RETURNING id, nome, descricao, created_at, updated_at INTO NEW;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.categorias_despesas_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.categorias
    SET nome = NEW.nome, descricao = NEW.descricao, updated_at = NEW.updated_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.categorias_despesas_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.categorias
    WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para a view
DROP TRIGGER IF EXISTS categorias_despesas_insert_trigger ON public.categorias_despesas;
CREATE TRIGGER categorias_despesas_insert_trigger
INSTEAD OF INSERT ON public.categorias_despesas
FOR EACH ROW EXECUTE FUNCTION public.categorias_despesas_insert_trigger();

DROP TRIGGER IF EXISTS categorias_despesas_update_trigger ON public.categorias_despesas;
CREATE TRIGGER categorias_despesas_update_trigger
INSTEAD OF UPDATE ON public.categorias_despesas
FOR EACH ROW EXECUTE FUNCTION public.categorias_despesas_update_trigger();

DROP TRIGGER IF EXISTS categorias_despesas_delete_trigger ON public.categorias_despesas;
CREATE TRIGGER categorias_despesas_delete_trigger
INSTEAD OF DELETE ON public.categorias_despesas
FOR EACH ROW EXECUTE FUNCTION public.categorias_despesas_delete_trigger();

-- Atualizar referências de categorias na tabela despesas_fixas
-- Não é necessário porque já está usando a tabela categorias

-- Manter a segurança (RLS) na tabela categorias
-- As políticas já foram criadas anteriormente

-- Comentários para documentação
COMMENT ON VIEW public.categorias_despesas IS 'View para manter compatibilidade com componentes que usam a tabela categorias_despesas';
COMMENT ON COLUMN public.categorias.tipo IS 'Tipo da categoria (despesa_fixa, categoria_despesa, etc)';
