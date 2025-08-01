-- Script para inserir configurações de horários iniciais para as cidades
-- Este script deve ser executado após o schema.sql

BEGIN;

-- Inserir configurações de horários para as cidades existentes
-- Configuração padrão: 08:00 às 18:00, intervalos de 30 minutos, segunda a sexta
INSERT INTO configuracoes_horarios (
  cidade_id,
  horario_inicio,
  horario_fim,
  intervalo_minutos,
  horarios_almoco,
  dias_funcionamento
)
SELECT 
  c.id,
  '08:00'::TIME,
  '18:00'::TIME,
  30,
  '["12:00", "13:00"]'::JSONB, -- Horário de almoço das 12:00 às 13:00
  '[1,2,3,4,5]'::JSONB -- Segunda a sexta (1=segunda, 2=terça, etc.)
FROM cidades c
WHERE c.ativa = true
ON CONFLICT (cidade_id) DO UPDATE SET
  horario_inicio = EXCLUDED.horario_inicio,
  horario_fim = EXCLUDED.horario_fim,
  intervalo_minutos = EXCLUDED.intervalo_minutos,
  horarios_almoco = EXCLUDED.horarios_almoco,
  dias_funcionamento = EXCLUDED.dias_funcionamento,
  updated_at = NOW();

-- Inserir algumas datas disponíveis para teste (próximos 30 dias úteis)
-- Apenas para as cidades que têm configuração de horários
INSERT INTO datas_disponiveis (cidade_id, data, ativa)
SELECT 
  ch.cidade_id,
  generate_series(
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '30 days',
    INTERVAL '1 day'
  )::DATE as data,
  true
FROM configuracoes_horarios ch
WHERE EXTRACT(DOW FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  INTERVAL '1 day'
)) BETWEEN 1 AND 5 -- Segunda a sexta apenas
ON CONFLICT (cidade_id, data) DO NOTHING;

COMMIT;

-- Verificar os dados inseridos
SELECT 'Configurações de horários criadas:' as info;
SELECT 
  c.nome as cidade,
  ch.horario_inicio,
  ch.horario_fim,
  ch.intervalo_minutos,
  ch.dias_funcionamento
FROM configuracoes_horarios ch
JOIN cidades c ON c.id = ch.cidade_id
ORDER BY c.nome;

SELECT 'Datas disponíveis criadas por cidade:' as info;
SELECT 
  c.nome as cidade,
  COUNT(dd.id) as total_datas
FROM cidades c
LEFT JOIN datas_disponiveis dd ON dd.cidade_id = c.id AND dd.ativa = true
GROUP BY c.id, c.nome
ORDER BY c.nome;