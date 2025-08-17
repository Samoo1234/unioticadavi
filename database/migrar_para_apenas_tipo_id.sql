-- Script para migrar completamente de 'tipo' para 'tipo_id' na tabela titulos

-- 1. Primeiro garantimos que todos os valores tipo_id estejam preenchidos
-- Verificar quantos registros ainda estão com tipo_id NULL
SELECT COUNT(*) as registros_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 2. Atualizar registros que ainda têm tipo_id NULL baseado nos tipos existentes
-- Listar todos os tipos distintos que ainda não têm tipo_id
SELECT DISTINCT tipo FROM titulos WHERE tipo_id IS NULL ORDER BY tipo;

-- 3. Mapear cada tipo com seu correto id em tipos_fornecedores
SELECT id, nome FROM tipos_fornecedores ORDER BY id;

-- 4. Atualizar cada tipo específico que ainda está NULL
-- Exemplo para tipo "pagar" - ajuste o ID conforme necessário após verificar tipos_fornecedores
UPDATE titulos SET tipo_id = 1 WHERE LOWER(tipo) = 'pagar' AND tipo_id IS NULL;

-- 5. Adicionar quaisquer outros tipos específicos que precisam ser mapeados
-- UPDATE titulos SET tipo_id = 2 WHERE LOWER(tipo) = 'outro_tipo' AND tipo_id IS NULL;
-- UPDATE titulos SET tipo_id = 3 WHERE LOWER(tipo) = 'mais_um_tipo' AND tipo_id IS NULL;

-- 6. Verificar se ainda há registros sem tipo_id
SELECT COUNT(*) as registros_ainda_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 7. Se ainda houver registros sem tipo_id, considere atribuir um valor padrão
-- UPDATE titulos SET tipo_id = 1 WHERE tipo_id IS NULL;

-- 8. Verificar novamente se todos os registros têm tipo_id
SELECT COUNT(*) as registros_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- 9. Adicionar restrição NOT NULL à coluna tipo_id (só faça isso após garantir que não há valores NULL)
-- ALTER TABLE titulos ALTER COLUMN tipo_id SET NOT NULL;

-- 10. Opcional: Remover a coluna 'tipo' se desejar (CUIDADO - faça backup antes)
-- Este comando só deve ser executado quando tiver certeza que a aplicação está usando apenas tipo_id
-- e não depende mais da coluna tipo

-- ALTERAÇÃO DE ALTO RISCO - Comente este comando até que esteja certo que pode ser executado!
-- ALTER TABLE titulos DROP COLUMN tipo;

-- 11. Verificação final
SELECT COUNT(*) FROM titulos;
