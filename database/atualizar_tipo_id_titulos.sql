-- Script para atualizar o campo tipo_id em registros existentes na tabela titulos

-- Verificar os registros sem tipo_id
SELECT COUNT(*) as registros_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- Verificar tipos de fornecedores disponíveis
SELECT id, nome FROM tipos_fornecedores ORDER BY id;

-- Verificar valores únicos no campo 'tipo' da tabela titulos
SELECT DISTINCT tipo FROM titulos WHERE tipo IS NOT NULL ORDER BY tipo;

-- Verificar correspondência entre os valores 'tipo' e tipos_fornecedores
SELECT t.tipo, tf.nome, tf.id 
FROM titulos t
LEFT JOIN tipos_fornecedores tf ON LOWER(tf.nome) = LOWER(t.tipo)
WHERE t.tipo IS NOT NULL
GROUP BY t.tipo, tf.nome, tf.id
ORDER BY t.tipo;

-- ATUALIZAÇÃO DE TIPO_ID BASEADA NO NOME DO TIPO
-- Atualiza tipo_id em titulos para corresponder ao id em tipos_fornecedores
-- onde os nomes são iguais (ignorando maiúsculas/minúsculas)
UPDATE titulos t
SET tipo_id = tf.id
FROM tipos_fornecedores tf
WHERE LOWER(t.tipo) = LOWER(tf.nome)
AND t.tipo_id IS NULL;

-- Verificar quantos registros foram atualizados
SELECT COUNT(*) as registros_com_tipo_id FROM titulos WHERE tipo_id IS NOT NULL;
SELECT COUNT(*) as registros_ainda_sem_tipo_id FROM titulos WHERE tipo_id IS NULL;

-- Para registros que ainda não têm correspondência, podemos usar uma abordagem mais flexível
-- Esta consulta mostra possíveis correspondências parciais para análise
SELECT DISTINCT t.tipo, tf.nome, tf.id
FROM titulos t
CROSS JOIN tipos_fornecedores tf
WHERE t.tipo_id IS NULL
AND (
  LOWER(tf.nome) LIKE '%' || LOWER(t.tipo) || '%' OR
  LOWER(t.tipo) LIKE '%' || LOWER(tf.nome) || '%'
)
ORDER BY t.tipo, tf.nome;

-- ATUALIZAÇÃO MANUAL PARA CASOS ESPECÍFICOS
-- Descomente e ajuste conforme necessário após verificar os resultados acima

-- Exemplo: Para títulos com tipo 'Armação' que devem corresponder a tipo_id 1
-- UPDATE titulos SET tipo_id = 1 WHERE LOWER(tipo) = 'armação' AND tipo_id IS NULL;

-- Exemplo: Para títulos com tipo 'Lente' que devem corresponder a tipo_id 2
-- UPDATE titulos SET tipo_id = 2 WHERE LOWER(tipo) = 'lente' AND tipo_id IS NULL;

-- OPCIONAL: Definir um tipo padrão para registros que ainda estão sem tipo_id
-- Use apenas após verificar quais registros estão sem correspondência
-- UPDATE titulos SET tipo_id = 1 WHERE tipo_id IS NULL;

-- Verificação final
SELECT tipo, COUNT(*) as quantidade FROM titulos WHERE tipo_id IS NULL GROUP BY tipo ORDER BY COUNT(*) DESC;
