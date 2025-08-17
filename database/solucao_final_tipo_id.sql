-- SOLUÇÃO FINAL: Script simplificado e direto para corrigir o problema tipo_id NULL

-- PARTE 1: DESATIVAR RLS E TRIGGERS TEMPORARIAMENTE (se existirem)
-- Isso pode ser necessário se houver políticas RLS impedindo a atualização

-- Desabilitar RLS temporariamente (Execute primeiro)
ALTER TABLE titulos DISABLE ROW LEVEL SECURITY;

-- PARTE 2: ATUALIZAÇÃO DIRETA E SIMPLES
-- Atualizar TODOS os registros onde tipo='pagar' para tipo_id=1
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar';

-- Verificar se outros registros com tipo_id NULL existem
SELECT DISTINCT tipo FROM titulos WHERE tipo_id IS NULL;

-- PARTE 3: ATUALIZAR OUTROS REGISTROS COM tipo_id NULL (ajuste conforme necessário)
-- Supondo que você tenha os seguintes tipos (verifique e ajuste os IDs):
-- 1 = Pagar, 2 = Armações, 3 = Lentes, etc.

UPDATE titulos SET tipo_id = 2 WHERE tipo ILIKE 'arma%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 3 WHERE tipo ILIKE 'lente%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 1 WHERE tipo_id IS NULL; -- Valor padrão para quaisquer outros

-- PARTE 4: VERIFICAR RESULTADOS
-- Confirmar se não há mais registros com tipo_id NULL
SELECT COUNT(*) AS registros_ainda_null FROM titulos WHERE tipo_id IS NULL;

-- Listar distribuição dos tipos
SELECT t.tipo_id, tf.nome, COUNT(*) 
FROM titulos t
LEFT JOIN tipos_fornecedores tf ON t.tipo_id = tf.id
GROUP BY t.tipo_id, tf.nome
ORDER BY COUNT(*) DESC;

-- PARTE 5: HABILITAR RLS NOVAMENTE (se foi desabilitado)
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;
