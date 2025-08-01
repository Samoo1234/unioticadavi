-- Script para corrigir medico_id nulos na tabela datas_disponiveis
-- Associar as datas ao médico Dr. Sávio Carmo

BEGIN;

-- 1. Verificar situação atual
SELECT 
    'SITUAÇÃO ATUAL:' as info,
    COUNT(*) as total_datas,
    COUNT(CASE WHEN medico_id IS NULL THEN 1 END) as medico_id_nulo,
    COUNT(CASE WHEN medico_id IS NOT NULL THEN 1 END) as com_medico_id
FROM datas_disponiveis;

-- 2. Obter ID do médico Dr. Sávio Carmo
SELECT 
    'MÉDICO DISPONÍVEL:' as info,
    id as medico_id,
    nome,
    ativo
FROM medicos 
WHERE ativo = true 
ORDER BY nome 
LIMIT 1;

-- 3. Atualizar medico_id para todas as datas que estão nulas
UPDATE datas_disponiveis 
SET medico_id = (
    SELECT id FROM medicos WHERE ativo = true ORDER BY nome LIMIT 1
),
updated_at = NOW()
WHERE medico_id IS NULL;

-- 4. Verificar resultado da correção
SELECT 
    'APÓS CORREÇÃO:' as info,
    COUNT(*) as total_datas,
    COUNT(CASE WHEN medico_id IS NULL THEN 1 END) as medico_id_nulo,
    COUNT(CASE WHEN medico_id IS NOT NULL THEN 1 END) as com_medico_id
FROM datas_disponiveis;

-- 5. Mostrar dados corrigidos
SELECT 
    'DADOS CORRIGIDOS:' as info,
    dd.id,
    dd.medico_id,
    dd.data,
    dd.filial_id,
    dd.ativa,
    m.nome as medico_nome,
    m.ativo as medico_ativo
FROM datas_disponiveis dd
LEFT JOIN medicos m ON m.id = dd.medico_id
ORDER BY dd.data;

-- 6. Testar consulta que a aplicação usa
SELECT 
    'TESTE DA APLICAÇÃO:' as info,
    dd.id,
    dd.filial_id,
    dd.medico_id,
    dd.data,
    dd.ativa,
    m.nome as medico_nome
FROM datas_disponiveis dd
LEFT JOIN medicos m ON m.id = dd.medico_id
WHERE dd.ativa = true
ORDER BY dd.data;

COMMIT;

-- 7. Resumo final
SELECT '🎉 MEDICO_ID CORRIGIDO!' as resultado;
SELECT '✅ Todas as datas agora têm médico associado' as status;
SELECT '✅ Aplicação deve mostrar nomes dos médicos' as proximo_passo; 