-- Script para inserir usuário na tabela usuarios do Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- IMPORTANTE: Se você recebeu erro "column 'nome' does not exist",
-- execute primeiro o arquivo create-usuarios-table.sql para criar a tabela

-- 1. Primeiro, verifique se o usuário de autenticação existe
-- Substitua 'seu-email@exemplo.com' pelo email que você usou para criar a conta
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- 2. Copie o ID do usuário retornado acima e use no INSERT abaixo
-- Substitua os valores conforme necessário:
-- - 'USER_ID_AQUI' pelo ID retornado na consulta acima
-- - 'Seu Nome' pelo nome desejado
-- - 'seu-email@exemplo.com' pelo seu email
-- - 'admin' pelo role desejado (admin, manager, user, etc.)

INSERT INTO usuarios (
  id,
  nome,
  email,
  role,
  filial_id,
  ativo,
  created_at,
  updated_at
) VALUES (
  'USER_ID_AQUI',  -- Substitua pelo ID do usuário de auth.users
  'Seu Nome',      -- Substitua pelo seu nome
  'seu-email@exemplo.com',  -- Substitua pelo seu email
  'admin',         -- Role: admin, manager, user, receptionist, financial
  NULL,            -- filial_id (pode ser NULL inicialmente)
  true,            -- ativo
  NOW(),           -- created_at
  NOW()            -- updated_at
);

-- 3. Verifique se o usuário foi inserido corretamente
SELECT * FROM usuarios WHERE email = 'seu-email@exemplo.com';

-- ROLES DISPONÍVEIS:
-- 'super_admin' - Acesso total ao sistema
-- 'admin' - Administrador com acesso a maioria das funcionalidades
-- 'manager' - Gerente com acesso a relatórios e configurações
-- 'receptionist' - Recepcionista com acesso a agendamentos
-- 'financial' - Financeiro com acesso a relatórios financeiros
-- 'user' - Usuário básico com acesso limitado