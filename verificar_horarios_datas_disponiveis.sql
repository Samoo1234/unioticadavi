-- Verificar horários configurados na tabela datas_disponiveis
SELECT 
  dd.id,
  dd.data,
  dd.filial_id,
  f.nome as filial_nome,
  dd.horarios_disponiveis,
  CASE 
    WHEN dd.horarios_disponiveis IS NULL THEN 'NULL'
    WHEN dd.horarios_disponiveis = '[]' THEN 'Array vazio'
    WHEN jsonb_array_length(dd.horarios_disponiveis) = 0 THEN 'Array vazio'
    ELSE 'Tem horários'
  END as status_horarios,
  jsonb_array_length(dd.horarios_disponiveis) as qtd_horarios
FROM datas_disponiveis dd
LEFT JOIN filiais f ON dd.filial_id = f.id
WHERE dd.ativa = true
ORDER BY dd.data, f.nome;

-- Verificar se há alguma data com horários configurados
SELECT 
  COUNT(*) as total_datas,
  COUNT(CASE WHEN horarios_disponiveis IS NOT NULL AND horarios_disponiveis != '[]' AND jsonb_array_length(horarios_disponiveis) > 0 THEN 1 END) as datas_com_horarios,
  COUNT(CASE WHEN horarios_disponiveis IS NULL OR horarios_disponiveis = '[]' OR jsonb_array_length(horarios_disponiveis) = 0 THEN 1 END) as datas_sem_horarios
FROM datas_disponiveis 
WHERE ativa = true; 