-- =============================================
-- SCRIPT PARA EXCLUIR TABELA CIDADES
-- Sistema de Gestão de Ótica
-- =============================================

-- ATENÇÃO: Execute este script APENAS após confirmar que:
-- 1. A migração para filiais foi concluída com sucesso
-- 2. Todos os dados foram migrados corretamente
-- 3. O sistema está funcionando apenas com a tabela filiais

-- =============================================
-- PASSO 1: VERIFICAR SE AINDA EXISTEM REFERÊNCIAS
-- =============================================

-- Verificar se alguma tabela ainda referencia cidades
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'cidades';

-- Verificar se ainda existem colunas cidade_id em uso
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'cidade_id'
    AND table_schema = 'public'
ORDER BY table_name;

-- =============================================
-- PASSO 2: REMOVER CONSTRAINTS E REFERÊNCIAS
-- =============================================

-- Remover foreign keys que referenciam cidades (se existirem)
-- NOTA: Execute apenas se o SELECT acima mostrar constraints ativas

-- Exemplo de como remover constraints (descomente se necessário):
-- ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cidade_id_fkey;
-- ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_cidade_id_fkey;
-- ALTER TABLE datas_disponiveis DROP CONSTRAINT IF EXISTS datas_disponiveis_cidade_id_fkey;
-- ALTER TABLE configuracoes_horarios DROP CONSTRAINT IF EXISTS configuracoes_horarios_cidade_id_fkey;

-- =============================================
-- PASSO 3: REMOVER COLUNAS CIDADE_ID (OPCIONAL)
-- =============================================

-- ATENÇÃO: Remover as colunas cidade_id é OPCIONAL
-- Você pode mantê-las para compatibilidade ou removê-las para limpeza

-- Descomente as linhas abaixo se quiser remover as colunas cidade_id:
-- ALTER TABLE clientes DROP COLUMN IF EXISTS cidade_id;
-- ALTER TABLE agendamentos DROP COLUMN IF EXISTS cidade_id;
-- ALTER TABLE datas_disponiveis DROP COLUMN IF EXISTS cidade_id;
-- ALTER TABLE configuracoes_horarios DROP COLUMN IF EXISTS cidade_id;

-- =============================================
-- PASSO 4: FAZER BACKUP DOS DADOS (RECOMENDADO)
-- =============================================

-- Criar backup da tabela cidades antes de excluir
CREATE TABLE IF NOT EXISTS cidades_backup AS 
SELECT * FROM cidades;

SELECT 'Backup da tabela cidades criado como cidades_backup' as info;

-- =============================================
-- PASSO 5: EXCLUIR A TABELA CIDADES
-- =============================================

-- ATENÇÃO: Esta ação é IRREVERSÍVEL!
-- Certifique-se de que:
-- 1. O backup foi criado
-- 2. Não existem mais referências à tabela
-- 3. O sistema está funcionando apenas com filiais

DROP TABLE IF EXISTS cidades CASCADE;

SELECT '🗑️ Tabela cidades excluída com sucesso!' as resultado;
SELECT '✅ Sistema agora usa APENAS a tabela filiais' as confirmacao;
SELECT '💾 Backup salvo em cidades_backup' as backup_info;

-- =============================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- =============================================

-- Verificar se a tabela foi realmente excluída
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cidades') 
        THEN '❌ Tabela cidades ainda existe'
        ELSE '✅ Tabela cidades foi excluída'
    END as status_exclusao;

-- Verificar se o backup existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cidades_backup') 
        THEN '✅ Backup cidades_backup existe'
        ELSE '❌ Backup não foi criado'
    END as status_backup;

-- Contar registros nas tabelas principais
SELECT 'ESTATÍSTICAS FINAIS:' as info;
SELECT 'Filiais:' as tabela, COUNT(*) as total FROM filiais;

-- Verificar clientes (com verificação dinâmica de coluna)
DO $$
DECLARE
    cliente_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'filial_id'
    ) THEN
        SELECT COUNT(*) INTO cliente_count FROM clientes WHERE filial_id IS NOT NULL;
        RAISE NOTICE 'Clientes com filial_id: %', cliente_count;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'cidade_id'
    ) THEN
        EXECUTE 'SELECT COUNT(*) FROM clientes WHERE cidade_id IS NOT NULL' INTO cliente_count;
        RAISE NOTICE 'Clientes com cidade_id: %', cliente_count;
    ELSE
        SELECT COUNT(*) INTO cliente_count FROM clientes;
        RAISE NOTICE 'Total de clientes: %', cliente_count;
    END IF;
END $$;

-- Verificar agendamentos (com verificação dinâmica de coluna)
DO $$
DECLARE
    agendamento_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'filial_id'
    ) THEN
        SELECT COUNT(*) INTO agendamento_count FROM agendamentos WHERE filial_id IS NOT NULL;
        RAISE NOTICE 'Agendamentos com filial_id: %', agendamento_count;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'cidade_id'
    ) THEN
        EXECUTE 'SELECT COUNT(*) FROM agendamentos WHERE cidade_id IS NOT NULL' INTO agendamento_count;
        RAISE NOTICE 'Agendamentos com cidade_id: %', agendamento_count;
    ELSE
        SELECT COUNT(*) INTO agendamento_count FROM agendamentos;
        RAISE NOTICE 'Total de agendamentos: %', agendamento_count;
    END IF;
END $$;

SELECT '🎉 LIMPEZA CONCLUÍDA!' as final_result;
SELECT '📋 Sistema agora usa exclusivamente FILIAIS' as final_note;