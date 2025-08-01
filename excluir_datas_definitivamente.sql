-- Excluir datas definitivamente do banco

-- 1. Verificar todas as datas (incluindo as marcadas como inativas)
SELECT 
  id,
  filial_id,
  medico_id,
  data,
  ativa,
  horarios_disponiveis
FROM datas_disponiveis 
ORDER BY data;

-- 2. Excluir TODAS as datas (hard delete)
DELETE FROM datas_disponiveis;

-- 3. Verificar se foi limpo completamente
SELECT COUNT(*) as total_datas FROM datas_disponiveis;

-- 4. Verificar se a tabela está vazia
SELECT * FROM datas_disponiveis LIMIT 5; 