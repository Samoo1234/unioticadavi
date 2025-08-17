-- Script focado especificamente em corrigir os registros com tipo = 'pagar'

-- 1. Verificar o ID correto do tipo de fornecedor para 'pagar'
SELECT id, nome FROM tipos_fornecedores WHERE nome ILIKE 'pagar';

-- 2. Verificar os registros atuais com tipo = 'pagar'
SELECT id, tipo, tipo_id FROM titulos WHERE tipo = 'pagar';

-- 3. Atualizar DIRETAMENTE os registros com tipo = 'pagar'
-- Substitua o '1' pelo ID correto obtido na consulta acima se for diferente
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;

-- 4. Verificar se a atualização funcionou
SELECT id, tipo, tipo_id FROM titulos WHERE tipo = 'pagar';

-- 5. Se ainda houver problemas, tente com COMMIT explícito
BEGIN;
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;
COMMIT;

-- 6. Verifique novamente após o COMMIT
SELECT id, tipo, tipo_id FROM titulos WHERE tipo = 'pagar';
