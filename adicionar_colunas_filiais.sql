-- Script para adicionar as colunas 'endereco' e 'telefone' na tabela filiais

-- Adicionar coluna 'endereco' como VARCHAR NOT NULL (com valor padrão temporário)
ALTER TABLE public.filiais ADD COLUMN endereco VARCHAR DEFAULT '' NOT NULL;

-- Adicionar coluna 'telefone' como VARCHAR (pode ser NULL)
ALTER TABLE public.filiais ADD COLUMN telefone VARCHAR;

-- Comentário para as colunas
COMMENT ON COLUMN public.filiais.endereco IS 'Endereço da filial';
COMMENT ON COLUMN public.filiais.telefone IS 'Número de telefone da filial';
