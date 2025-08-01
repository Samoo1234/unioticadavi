-- Script para corrigir a tabela usuarios no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, vamos remover a tabela existente (se houver)
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Remover função e trigger existentes (se houverem)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Criar a tabela usuarios completa
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  filial_id INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_filial_id ON usuarios(filial_id);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas de segurança
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Apenas administradores podem inserir novos usuários
CREATE POLICY "Apenas admins podem inserir usuários" ON usuarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Apenas administradores podem deletar usuários
CREATE POLICY "Apenas admins podem deletar usuários" ON usuarios
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- 9. Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 10. Agora você pode executar o script setup-primeiro-usuario.sql para inserir seu usuário
-- Ou inserir manualmente um usuário admin temporário:
/*
INSERT INTO usuarios (id, nome, email, role, ativo)
VALUES (
    'SEU_USER_ID_DO_SUPABASE_AUTH',
    'Seu Nome',
    'seu.email@exemplo.com',
    'super_admin',
    true
);
*/