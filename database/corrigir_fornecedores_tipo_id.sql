-- Script para verificar a estrutura da tabela fornecedores
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;

-- Script para corrigir o campo tipo_id na tabela fornecedores se necessário
-- Para o caso de precisar atualizar fornecedores existentes que possam estar com tipo incorreto
-- Primeiramente verificamos fornecedores sem tipo_id
SELECT id, nome, tipo_id FROM fornecedores WHERE tipo_id IS NULL;

-- Atualizamos fornecedores sem tipo para usar um tipo padrão (neste caso o ID 1)
-- Descomente e execute se necessário:
-- UPDATE fornecedores SET tipo_id = 1 WHERE tipo_id IS NULL;

-- Verificar se os tipos de fornecedores existem
SELECT id, nome FROM tipos_fornecedores ORDER BY id;

-- Atualizar a referência de tipos nos fornecedores para corrigir qualquer inconsistência
-- Descomente e execute apenas se necessário após analisar os dados:
/*
UPDATE fornecedores f
SET tipo_id = (
    SELECT id FROM tipos_fornecedores tf
    WHERE LOWER(tf.nome) = LOWER(f.tipo)
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM tipos_fornecedores tf
    WHERE LOWER(tf.nome) = LOWER(f.tipo)
);
*/
