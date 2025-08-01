-- Corrigir medico_id NULL nas datas existentes

-- 1. Verificar médicos disponíveis
SELECT 
  id,
  nome,
  crm
FROM medicos 
WHERE ativo = true
ORDER BY nome;

-- 2. Atualizar datas_disponiveis com medico_id NULL
-- Usando o primeiro médico ativo como padrão
UPDATE datas_disponiveis 
SET medico_id = (
  SELECT id FROM medicos 
  WHERE ativo = true 
  ORDER BY nome 
  LIMIT 1
)
WHERE ativa = true 
  AND medico_id IS NULL;

-- 3. Verificar resultado
SELECT 
  id,
  filial_id,
  medico_id,
  data,
  horarios_disponiveis
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data; 