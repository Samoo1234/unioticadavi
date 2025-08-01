-- Verificar o tipo atual da coluna medico_id
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis' 
  AND column_name = 'medico_id';

-- Verificar se há dados na tabela datas_disponiveis
SELECT 
  id,
  filial_id,
  medico_id,
  data,
  horarios_disponiveis
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data;

-- Verificar médicos disponíveis
SELECT 
  id,
  nome,
  crm
FROM medicos 
WHERE ativo = true
ORDER BY nome; 