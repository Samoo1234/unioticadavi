-- SOLUÇÃO FINAL: Script ajustado conforme estrutura real dos dados

-- PARTE 1: DESATIVAR RLS E TRIGGERS TEMPORARIAMENTE (se existirem)
-- Isso pode ser necessário se houver políticas RLS impedindo a atualização

-- Desabilitar RLS temporariamente (Execute primeiro)
ALTER TABLE titulos DISABLE ROW LEVEL SECURITY;

-- PARTE 2: VERIFICAR VALORES REAIS PARA TIPO_ID EM TIPOS_FORNECEDORES
SELECT id, nome FROM tipos_fornecedores ORDER BY id;

-- PARTE 3: ATUALIZAÇÃO DIRETA DOS VALORES NULL
-- Com base nos dados do arquivo CSV:
-- tipo_id = 1 corresponde a "Lentes"
-- tipo_id = 2 corresponde a "Armações"

-- Atualizar tipo_id para registros onde tipo='pagar'
-- Atenção: verifique o ID correto após executar a consulta acima
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;

-- Atualizar outros registros com base no valor de 'tipo'
UPDATE titulos SET tipo_id = 2 WHERE tipo ILIKE 'arma%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 1 WHERE tipo ILIKE 'lente%' AND tipo_id IS NULL;

-- PARTE 4: VERIFICAR RESULTADOS
-- Confirmar se não há mais registros com tipo_id NULL
SELECT COUNT(*) AS registros_ainda_null FROM titulos WHERE tipo_id IS NULL;

-- Listar distribuição dos tipos
SELECT t.tipo_id, tf.nome, t.tipo, COUNT(*) 
FROM titulos t
LEFT JOIN tipos_fornecedores tf ON t.tipo_id = tf.id
GROUP BY t.tipo_id, tf.nome, t.tipo
ORDER BY COUNT(*) DESC;

-- PARTE 5: HABILITAR RLS NOVAMENTE (se foi desabilitado)
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;
