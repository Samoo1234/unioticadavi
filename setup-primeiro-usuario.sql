-- Script para inserir o primeiro usuário admin no Supabase
-- Execute este script APÓS executar o fix-usuarios-table.sql

-- 1. Primeiro, vamos verificar se a tabela usuarios existe e está vazia
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- 2. Temporariamente desabilitar RLS para inserir o primeiro usuário
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se o usuário foi inserido corretamente no auth.users
-- Substitua 'seu.email@exemplo.com' pelo email que você usou para se registrar
SELECT * FROM auth.users WHERE email = 'samtecsolucoes@gmail.com';

-- 4. Inserir o primeiro usuário admin
-- IMPORTANTE: Substitua os valores abaixo pelos seus dados reais
-- O ID deve ser o mesmo ID do auth.users que você obteve na consulta acima
INSERT INTO usuarios (id, nome, email, role, ativo)
VALUES (
    'fc132221-875a-4407-88f0-25d088505cb7', -- Substitua pelo ID real do auth.users
    'Samoel Duarte',            -- Substitua pelo seu nome
    'samtecsolucoes@gmail.com',        -- Substitua pelo seu email
    'super_admin',                  -- Role de super administrador
    true                            -- Usuário ativo
);

-- 5. Verificar se o usuário foi inserido corretamente
SELECT * FROM usuarios;

-- 6. Reabilitar RLS após inserir o primeiro usuário
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 7. Testar se as políticas estão funcionando
-- Esta consulta deve retornar apenas o usuário logado
SELECT * FROM usuarios WHERE auth.uid() = id;

-- INSTRUÇÕES:
-- 1. Execute o script fix-usuarios-table.sql primeiro
-- 2. Faça login no Supabase com sua conta
-- 3. Vá para Authentication > Users e copie seu User ID
-- 4. Substitua 'COLE_AQUI_O_ID_DO_AUTH_USERS' pelo seu User ID real
-- 5. Substitua 'Seu Nome Completo' pelo seu nome real
-- 6. Substitua 'seu.email@exemplo.com' pelo seu email real
-- 7. Execute este script
-- 8. Teste o login na aplicação