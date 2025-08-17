-- Criar a tabela categorias_despesas
CREATE TABLE IF NOT EXISTS public.categorias_despesas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar comentário à tabela
COMMENT ON TABLE public.categorias_despesas IS 'Tabela para armazenar categorias de despesas para classificação financeira';

-- Adicionar políticas RLS (Row Level Security) para a tabela
ALTER TABLE public.categorias_despesas ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar todas as categorias" 
  ON public.categorias_despesas FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política para permitir inserção a usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir categorias" 
  ON public.categorias_despesas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização a usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar categorias" 
  ON public.categorias_despesas FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Política para permitir exclusão a usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir categorias" 
  ON public.categorias_despesas FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Inserir algumas categorias iniciais para exemplo
INSERT INTO public.categorias_despesas (nome, descricao) VALUES
('Aluguel', 'Despesas com aluguel do imóvel'),
('Energia', 'Despesas com energia elétrica'),
('Água', 'Despesas com água e esgoto'),
('Internet', 'Despesas com internet e telefonia'),
('Salários', 'Pagamento de funcionários'),
('Marketing', 'Despesas com publicidade e marketing'),
('Manutenção', 'Manutenção de equipamentos e instalações'),
('Impostos', 'Despesas com impostos e taxas'),
('Material de Escritório', 'Compra de materiais para escritório'),
('Outros', 'Outras despesas não categorizadas');
