-- Verificar configurações de horários

-- 1. Verificar se a tabela existe
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'configuracoes_horarios'
ORDER BY ordinal_position;

-- 2. Verificar dados na tabela configuracoes_horarios
SELECT 
  id,
  filial_id,
  horario_inicio,
  horario_fim,
  intervalo_minutos,
  horarios_almoco,
  dias_funcionamento,
  created_at,
  updated_at
FROM configuracoes_horarios
ORDER BY filial_id;

-- 3. Verificar filiais disponíveis
SELECT 
  id,
  nome,
  ativa
FROM filiais
WHERE ativa = true
ORDER BY nome; 