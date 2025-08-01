-- Script simples para corrigir horários_disponiveis

-- 1. Verificar estado atual
SELECT 
  id,
  data,
  filial_id,
  horarios_disponiveis,
  CASE 
    WHEN horarios_disponiveis IS NULL THEN 'NULL'
    WHEN horarios_disponiveis = '[]' THEN 'Array vazio'
    WHEN horarios_disponiveis = '' THEN 'String vazia'
    WHEN jsonb_typeof(horarios_disponiveis) = 'array' THEN 'Array válido'
    ELSE 'Formato inválido'
  END as status_horarios
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data;

-- 2. Corrigir valores NULL ou vazios para arrays vazios
UPDATE datas_disponiveis 
SET horarios_disponiveis = '[]'::jsonb
WHERE ativa = true 
  AND (horarios_disponiveis IS NULL OR horarios_disponiveis = '' OR horarios_disponiveis = 'null');

-- 3. Adicionar horários de exemplo para as próximas 3 datas
UPDATE datas_disponiveis 
SET horarios_disponiveis = '["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"]'::jsonb
WHERE id IN (
  SELECT id FROM datas_disponiveis 
  WHERE ativa = true 
    AND data >= CURRENT_DATE
    AND horarios_disponiveis = '[]'::jsonb
  ORDER BY data
  LIMIT 3
);

-- 4. Verificar resultado
SELECT 
  id,
  data,
  filial_id,
  horarios_disponiveis,
  jsonb_array_length(horarios_disponiveis) as qtd_horarios
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data; 