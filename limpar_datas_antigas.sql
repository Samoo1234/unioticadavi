-- Limpar datas antigas do banco de dados

-- 1. Verificar datas existentes
SELECT 
  id,
  filial_id,
  medico_id,
  data,
  ativa,
  created_at
FROM datas_disponiveis 
ORDER BY data;

-- 2. Excluir todas as datas (hard delete)
DELETE FROM datas_disponiveis;

-- 3. Verificar se foi limpo
SELECT 
  id,
  filial_id,
  medico_id,
  data,
  ativa
FROM datas_disponiveis 
ORDER BY data;

-- 4. Verificar contagem
SELECT COUNT(*) as total_datas FROM datas_disponiveis; 