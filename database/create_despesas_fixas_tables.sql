-- Criar a tabela categorias (usada para categorizar despesas)
CREATE TABLE IF NOT EXISTS public.categorias (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL, -- 'despesa_fixa', 'despesa_variavel', etc.
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar políticas RLS para a tabela categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar todas as categorias" 
  ON public.categorias FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir categorias" 
  ON public.categorias FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar categorias" 
  ON public.categorias FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem excluir categorias" 
  ON public.categorias FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Criar a tabela despesas_fixas
CREATE TABLE IF NOT EXISTS public.despesas_fixas (
  id BIGSERIAL PRIMARY KEY,
  filial_id INTEGER NOT NULL REFERENCES public.filiais(id),
  categoria_id INTEGER REFERENCES public.categorias(id),
  nome VARCHAR NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  periodicidade VARCHAR NOT NULL CHECK (periodicidade IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  observacao TEXT,
  status VARCHAR NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar políticas RLS para a tabela despesas_fixas
ALTER TABLE public.despesas_fixas ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar todas as despesas fixas" 
  ON public.despesas_fixas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir despesas fixas" 
  ON public.despesas_fixas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar despesas fixas" 
  ON public.despesas_fixas FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem excluir despesas fixas" 
  ON public.despesas_fixas FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Criar a tabela despesas_diversas (usada na função handleGenerateVencimentos)
CREATE TABLE IF NOT EXISTS public.despesas_diversas (
  id BIGSERIAL PRIMARY KEY,
  despesa_fixa_id INTEGER REFERENCES public.despesas_fixas(id),
  data DATE NOT NULL,
  descricao VARCHAR NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  categoria_id INTEGER REFERENCES public.categorias(id),
  forma_pagamento VARCHAR,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar políticas RLS para a tabela despesas_diversas
ALTER TABLE public.despesas_diversas ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar todas as despesas diversas" 
  ON public.despesas_diversas FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir despesas diversas" 
  ON public.despesas_diversas FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar despesas diversas" 
  ON public.despesas_diversas FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem excluir despesas diversas" 
  ON public.despesas_diversas FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Inserir algumas categorias iniciais para despesas fixas
INSERT INTO public.categorias (nome, tipo, descricao) VALUES
('Aluguel', 'despesa_fixa', 'Despesas com aluguel de imóveis'),
('Água', 'despesa_fixa', 'Contas de água e esgoto'),
('Energia', 'despesa_fixa', 'Contas de energia elétrica'),
('Internet', 'despesa_fixa', 'Serviços de internet e telefonia'),
('Salários', 'despesa_fixa', 'Pagamento de funcionários'),
('Impostos', 'despesa_fixa', 'Impostos e taxas periódicas'),
('Manutenção', 'despesa_fixa', 'Manutenção de equipamentos e instalações'),
('Seguros', 'despesa_fixa', 'Seguros de qualquer natureza'),
('Software', 'despesa_fixa', 'Assinaturas de software'),
('Outros', 'despesa_fixa', 'Outras despesas fixas');
