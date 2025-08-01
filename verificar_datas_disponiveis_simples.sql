-- Script SIMPLES para verificar a tabela datas_disponiveis
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
    'TABELA EXISTE:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'datas_disponiveis' 
        AND table_schema = 'public'
    ) as tabela_existe;

-- 2. Mostrar estrutura atual da tabela
SELECT 
    'ESTRUTURA ATUAL:' as info,
    column_name, 
    data_type, 
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 3. Verificar se colunas específicas existem
SELECT 'COLUNA ID EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'id') as existe;

SELECT 'COLUNA FILIAL_ID EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'filial_id') as existe;

SELECT 'COLUNA MEDICO_ID EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'medico_id') as existe;

SELECT 'COLUNA CIDADE_ID EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'cidade_id') as existe;

SELECT 'COLUNA DATA EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'data') as existe;

SELECT 'COLUNA ATIVA EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'ativa') as existe;

-- 4. Contar registros existentes
SELECT 'TOTAL DE REGISTROS:' as info, COUNT(*) as total FROM datas_disponiveis;

-- 5. Mostrar alguns registros (se existirem)
SELECT 'EXEMPLO DE REGISTROS:' as info, * FROM datas_disponiveis LIMIT 3;

-- 6. Verificar se tabelas relacionadas existem
SELECT 'TABELA FILIAIS EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'filiais') as existe;

SELECT 'TABELA MEDICOS EXISTE:' as info, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicos') as existe; 