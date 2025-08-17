-- Script para corrigir os IDs de filiais nas despesas_diversas
-- Os IDs nas despesas_diversas (1, 4, 6) não existem na tabela filiais (18, 19)

-- Atualizar os registros que têm filial_id = 1 para usar filial_id = 18
UPDATE public.despesas_diversas
SET filial_id = 18
WHERE filial_id = 1;

-- Atualizar os registros que têm filial_id = 4 para usar filial_id = 19
UPDATE public.despesas_diversas
SET filial_id = 19
WHERE filial_id = 4;

-- Atualizar os registros que têm filial_id = 6 para usar filial_id = 18
UPDATE public.despesas_diversas
SET filial_id = 18
WHERE filial_id = 6;

-- Verificar se todos os registros foram atualizados
SELECT filial_id, COUNT(*) 
FROM despesas_diversas 
GROUP BY filial_id;
