-- Script para verificar as políticas de acesso na tabela filiais
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename IN ('filiais', 'fornecedores');
