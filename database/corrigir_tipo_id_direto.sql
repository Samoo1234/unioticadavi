-- Script DIRETO para corrigir os registros sem nenhuma verificação extra
-- Execute cada comando separadamente e verifique os resultados

-- Verificação atual dos registros com tipo='pagar' e tipo_id NULL
SELECT id, tipo, tipo_id FROM titulos WHERE tipo = 'pagar' AND tipo_id IS NULL;

-- Atualização DIRETA sem condições extras - APENAS EXECUTE ESTE COMANDO
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar';

-- Verificar se o UPDATE funcionou
SELECT id, tipo, tipo_id FROM titulos WHERE tipo = 'pagar';

-- Se ainda houver registros com tipo_id NULL, tente com a sintaxe mais simples possível
UPDATE titulos SET tipo_id = 1;

-- Verificar novamente
SELECT tipo, tipo_id FROM titulos WHERE tipo = 'pagar';

-- Se ainda não funcionar, verifique se há triggers ou restrições bloqueando a atualização
SELECT * FROM information_schema.triggers WHERE event_object_table = 'titulos';

-- Verificar permissões do usuário atual
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'titulos';

-- Verificar restrições na tabela
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'titulos';
