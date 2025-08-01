-- Script de verificação para testar as correções do login
-- Execute após executar fix-database-inconsistencies.sql e setup-primeiro-usuario.sql

-- 1. Verificar se a tabela filiais existe e tem dados
SELECT 'Verificação da tabela filiais:' as info;
SELECT 
    COUNT(*) as total_filiais,
    string_agg(nome, ', ') as nomes_filiais
FROM filiais;

-- 2. Verificar estrutura da tabela usuarios
SELECT 'Estrutura da tabela usuarios:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('id', 'filial_id', 'nome', 'email', 'role', 'ativo')
ORDER BY ordinal_position;

-- 3. Verificar se existe usuário super_admin
SELECT 'Verificação do usuário super_admin:' as info;
SELECT 
    id,
    nome,
    email,
    role,
    filial_id,
    ativo,
    created_at
FROM usuarios 
WHERE role = 'super_admin';

-- 4. Verificar se existe usuário correspondente em auth.users
SELECT 'Verificação em auth.users:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    u.nome,
    u.role,
    u.ativo
FROM auth.users au
LEFT JOIN usuarios u ON au.id = u.id
WHERE au.email = 'admin@gestaooptica.com';

-- 5. Testar consulta que o AuthContext faz
SELECT 'Teste da consulta do AuthContext:' as info;
SELECT *
FROM usuarios
WHERE email = 'admin@gestaooptica.com'
AND ativo = true;

-- 6. Verificar políticas RLS
SELECT 'Políticas RLS da tabela usuarios:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'usuarios';

-- 7. Verificar se RLS está habilitado
SELECT 'Status do RLS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'usuarios';

-- INSTRUÇÕES PARA TESTE:
-- 1. Execute este script no Editor SQL do Supabase
-- 2. Verifique se todos os resultados estão corretos
-- 3. Teste o login na aplicação com:
--    Email: admin@gestaooptica.com
--    Senha: Admin123!@#
-- 4. Se ainda houver erro, verifique os logs do navegador