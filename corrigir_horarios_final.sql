-- Script final para corrigir horarios_disponiveis

-- 1. Primeiro, vamos verificar o estado atual sem usar jsonb_typeof
SELECT 
  id,
  data,
  filial_id,
  horarios_disponiveis,
  CASE 
    WHEN horarios_disponiveis IS NULL THEN 'NULL'
    WHEN horarios_disponiveis = '[]' THEN 'Array vazio'
    WHEN horarios_disponiveis = '' THEN 'String vazia'
    WHEN horarios_disponiveis = 'null' THEN 'String null'
    ELSE 'Outro formato'
  END as status_horarios
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data;

-- 2. Corrigir strings vazias primeiro (sem usar jsonb_typeof)
UPDATE datas_disponiveis 
SET horarios_disponiveis = '[]'::jsonb
WHERE ativa = true 
  AND horarios_disponiveis = '';

-- 3. Corrigir strings 'null'
UPDATE datas_disponiveis 
SET horarios_disponiveis = '[]'::jsonb
WHERE ativa = true 
  AND horarios_disponiveis = 'null';

-- 4. Corrigir valores NULL
UPDATE datas_disponiveis 
SET horarios_disponiveis = '[]'::jsonb
WHERE ativa = true 
  AND horarios_disponiveis IS NULL;

-- 5. Adicionar horários de exemplo para as próximas 3 datas
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

-- 6. Verificar resultado final
SELECT 
  id,
  data,
  filial_id,
  horarios_disponiveis,
  jsonb_array_length(horarios_disponiveis) as qtd_horarios
FROM datas_disponiveis 
WHERE ativa = true
ORDER BY data; 