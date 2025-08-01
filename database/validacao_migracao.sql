-- =============================================
-- SCRIPT DE VALIDAÇÃO DA MIGRAÇÃO
-- Sistema de Gestão de Ótica
-- =============================================
-- Este script valida a integridade dos dados antes e depois da migração

-- =============================================
-- VALIDAÇÕES PRÉ-MIGRAÇÃO
-- =============================================

\echo '=== VALIDAÇÕES PRÉ-MIGRAÇÃO ==='

-- 1. Contagem de registros nas tabelas principais
\echo '1. Contagem de registros atuais:'
SELECT 
  'filiais' as tabela, 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN ativa = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativa = false THEN 1 END) as inativos
FROM filiais

UNION ALL

SELECT 
  'cidades' as tabela, 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN ativa = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativa = false THEN 1 END) as inativos
FROM cidades

UNION ALL

SELECT 
  'clientes' as tabela, 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM clientes

UNION ALL

SELECT 
  'agendamentos' as tabela, 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN status NOT IN ('cancelado') THEN 1 END) as ativos,
  COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as inativos
FROM agendamentos

UNION ALL

SELECT 
  'usuarios' as tabela, 
  COUNT(*) as total_registros,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM usuarios;

-- 2. Verificar integridade referencial atual
\echo '2. Verificação de integridade referencial:'

-- Clientes com cidade_id inválido
SELECT 
  'Clientes com cidade_id inválido' as problema,
  COUNT(*) as quantidade
FROM clientes c
LEFT JOIN cidades ci ON c.cidade_id = ci.id
WHERE c.cidade_id IS NOT NULL AND ci.id IS NULL

UNION ALL

-- Agendamentos com cidade_id inválido
SELECT 
  'Agendamentos com cidade_id inválido' as problema,
  COUNT(*) as quantidade
FROM agendamentos a
LEFT JOIN cidades ci ON a.cidade_id = ci.id
WHERE a.cidade_id IS NOT NULL AND ci.id IS NULL

UNION ALL

-- Agendamentos com filial_id inválido
SELECT 
  'Agendamentos com filial_id inválido' as problema,
  COUNT(*) as quantidade
FROM agendamentos a
LEFT JOIN filiais f ON a.filial_id = f.id
WHERE a.filial_id IS NOT NULL AND f.id IS NULL

UNION ALL

-- Usuários com filial_id inválido
SELECT 
  'Usuários com filial_id inválido' as problema,
  COUNT(*) as quantidade
FROM usuarios u
LEFT JOIN filiais f ON u.filial_id = f.id
WHERE u.filial_id IS NOT NULL AND f.id IS NULL

UNION ALL

-- Datas disponíveis com cidade_id inválido
SELECT 
  'Datas disponíveis com cidade_id inválido' as problema,
  COUNT(*) as quantidade
FROM datas_disponiveis dd
LEFT JOIN cidades ci ON dd.cidade_id = ci.id
WHERE dd.cidade_id IS NOT NULL AND ci.id IS NULL;

-- 3. Análise de duplicatas entre cidades e filiais
\echo '3. Análise de duplicatas entre cidades e filiais:'
SELECT 
  c.nome as cidade_nome,
  c.estado as cidade_estado,
  f.nome as filial_nome,
  CASE 
    WHEN f.id IS NULL THEN 'Cidade sem filial correspondente'
    WHEN LOWER(c.nome) = LOWER(f.nome) THEN 'Nomes idênticos'
    ELSE 'Nomes diferentes'
  END as status_correspondencia
FROM cidades c
LEFT JOIN filiais f ON LOWER(c.nome) = LOWER(f.nome)
ORDER BY c.nome;

-- 4. Verificar estrutura atual das tabelas
\echo '4. Estrutura atual das tabelas principais:'
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('filiais', 'cidades', 'clientes', 'agendamentos', 'usuarios')
ORDER BY table_name, ordinal_position;

-- =============================================
-- VALIDAÇÕES PÓS-MIGRAÇÃO
-- =============================================

\echo '=== VALIDAÇÕES PÓS-MIGRAÇÃO ==='

-- 5. Verificar se novas tabelas foram criadas
\echo '5. Verificação de novas tabelas:'
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('categorias', 'despesas_fixas', 'despesas_diversas') THEN 'Nova tabela criada'
    ELSE 'Tabela existente'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categorias', 'despesas_fixas', 'despesas_diversas', 'filiais', 'cidades')
ORDER BY table_name;

-- 6. Contagem de registros após migração
\echo '6. Contagem de registros após migração:'
SELECT 'categorias' as tabela, COUNT(*) as registros FROM categorias
UNION ALL
SELECT 'despesas_fixas' as tabela, COUNT(*) as registros FROM despesas_fixas
UNION ALL
SELECT 'despesas_diversas' as tabela, COUNT(*) as registros FROM despesas_diversas
UNION ALL
SELECT 'fornecedores' as tabela, COUNT(*) as registros FROM fornecedores
UNION ALL
SELECT 'filiais_com_estado' as tabela, COUNT(*) as registros 
FROM filiais WHERE estado IS NOT NULL;

-- 7. Verificar integridade após migração
\echo '7. Verificação de integridade pós-migração:'

-- Clientes com filial válida (usando cidade_id que agora aponta para filiais)
SELECT 
  'Clientes com filial válida' as status,
  COUNT(*) as quantidade
FROM clientes c
JOIN filiais f ON c.cidade_id = f.id

UNION ALL

-- Agendamentos com filial válida
SELECT 
  'Agendamentos com filial válida' as status,
  COUNT(*) as quantidade
FROM agendamentos a
JOIN filiais f ON a.cidade_id = f.id

UNION ALL

-- Despesas fixas com filial válida
SELECT 
  'Despesas fixas com filial válida' as status,
  COUNT(*) as quantidade
FROM despesas_fixas df
JOIN filiais f ON df.filial_id = f.id

UNION ALL

-- Despesas diversas com filial válida
SELECT 
  'Despesas diversas com filial válida' as status,
  COUNT(*) as quantidade
FROM despesas_diversas dd
JOIN filiais f ON dd.filial_id = f.id

UNION ALL

-- Fornecedores com filial válida
SELECT 
  'Fornecedores com filial válida' as status,
  COUNT(*) as quantidade
FROM fornecedores fr
JOIN filiais f ON fr.filial_id = f.id;

-- 8. Verificar índices criados
\echo '8. Verificação de índices:'
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('categorias', 'despesas_fixas', 'despesas_diversas', 'fornecedores')
ORDER BY tablename, indexname;

-- 9. Verificar triggers
\echo '9. Verificação de triggers:'
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('categorias', 'despesas_fixas', 'despesas_diversas', 'fornecedores')
ORDER BY event_object_table, trigger_name;

-- 10. Verificar políticas RLS
\echo '10. Verificação de políticas RLS:'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('categorias', 'despesas_fixas', 'despesas_diversas', 'fornecedores')
ORDER BY tablename, policyname;

-- =============================================
-- TESTES DE FUNCIONALIDADE
-- =============================================

\echo '=== TESTES DE FUNCIONALIDADE ==='

-- 11. Teste de inserção em novas tabelas
\echo '11. Teste de inserção (será revertido):'
BEGIN;

-- Teste categoria
INSERT INTO categorias (nome, tipo, descricao) 
VALUES ('Teste Categoria', 'despesa_fixa', 'Categoria de teste');

-- Teste despesa fixa (usando primeira filial disponível)
INSERT INTO despesas_fixas (filial_id, nome, valor, periodicidade, dia_vencimento)
SELECT 
  f.id,
  'Teste Despesa Fixa',
  100.00,
  'mensal',
  15
FROM filiais f
WHERE f.ativa = true
LIMIT 1;

-- Teste fornecedor (usando primeira filial disponível)
INSERT INTO fornecedores (filial_id, nome, cnpj, telefone, email)
SELECT 
  f.id,
  'Teste Fornecedor',
  '12.345.678/0001-99',
  '(11) 99999-9999',
  'teste@fornecedor.com'
FROM filiais f
WHERE f.ativa = true
LIMIT 1;

-- Verificar se inserções funcionaram
SELECT 'Teste inserção categorias' as teste, COUNT(*) as resultado
FROM categorias WHERE nome = 'Teste Categoria'
UNION ALL
SELECT 'Teste inserção despesas_fixas' as teste, COUNT(*) as resultado
FROM despesas_fixas WHERE nome = 'Teste Despesa Fixa'
UNION ALL
SELECT 'Teste inserção fornecedores' as teste, COUNT(*) as resultado
FROM fornecedores WHERE nome = 'Teste Fornecedor';

-- Reverter testes
ROLLBACK;

-- 12. Teste de consultas com JOIN
\echo '12. Teste de consultas com JOIN:'

-- Consulta complexa para testar relacionamentos
SELECT 
  f.nome as filial,
  f.estado,
  COUNT(DISTINCT c.id) as total_clientes,
  COUNT(DISTINCT a.id) as total_agendamentos,
  COUNT(DISTINCT u.id) as total_usuarios
FROM filiais f
LEFT JOIN clientes c ON c.cidade_id = f.id
LEFT JOIN agendamentos a ON a.cidade_id = f.id
LEFT JOIN usuarios u ON u.filial_id = f.id
WHERE f.ativa = true
GROUP BY f.id, f.nome, f.estado
ORDER BY f.nome;

-- 13. Verificar performance de consultas
\echo '13. Análise de performance:'
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  c.nome as cliente,
  f.nome as filial,
  a.data_agendamento,
  a.status
FROM clientes c
JOIN filiais f ON c.cidade_id = f.id
JOIN agendamentos a ON a.cliente_id = c.id
WHERE f.ativa = true
AND a.data_agendamento >= CURRENT_DATE - INTERVAL '30 days'
LIMIT 10;

-- =============================================
-- RELATÓRIO FINAL
-- =============================================

\echo '=== RELATÓRIO FINAL DE VALIDAÇÃO ==='

-- 14. Resumo geral
\echo '14. Resumo geral da migração:'
SELECT 
  'Tabelas principais' as categoria,
  COUNT(*) as quantidade
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('filiais', 'cidades', 'clientes', 'agendamentos', 'usuarios')

UNION ALL

SELECT 
  'Novas tabelas (despesas)' as categoria,
  COUNT(*) as quantidade
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categorias', 'despesas_fixas', 'despesas_diversas')

UNION ALL

SELECT 
  'Índices nas novas tabelas' as categoria,
  COUNT(*) as quantidade
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('categorias', 'despesas_fixas', 'despesas_diversas')

UNION ALL

SELECT 
  'Políticas RLS ativas' as categoria,
  COUNT(*) as quantidade
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('categorias', 'despesas_fixas', 'despesas_diversas');

-- 15. Status final
\echo '15. Status final da migração:'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categorias')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despesas_fixas')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'despesas_diversas')
    THEN '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO'
    ELSE '❌ MIGRAÇÃO INCOMPLETA - VERIFICAR ERROS'
  END as status_migracao;

-- 16. Próximos passos
\echo '16. Próximos passos recomendados:'
SELECT 
  'Próximos Passos' as categoria,
  unnest(ARRAY[
    '1. Atualizar tipos TypeScript (database_types_updated.ts)',
    '2. Modificar componentes React para usar filiais',
    '3. Atualizar queries do Supabase',
    '4. Testar funcionalidades críticas',
    '5. Implementar componentes de despesas',
    '6. Atualizar documentação',
    '7. Treinar equipe nas mudanças',
    '8. Monitorar performance pós-migração'
  ]) as acao;

-- =============================================
-- COMANDOS ÚTEIS PARA TROUBLESHOOTING
-- =============================================

/*
=== COMANDOS ÚTEIS PARA TROUBLESHOOTING ===

-- Ver todas as tabelas
\dt

-- Ver estrutura de uma tabela específica
\d+ filiais
\d+ categorias
\d+ despesas_fixas

-- Ver índices de uma tabela
\di+ filiais

-- Ver políticas RLS
\dp+ categorias

-- Ver triggers
SELECT * FROM information_schema.triggers WHERE event_object_table = 'despesas_fixas';

-- Verificar espaço em disco
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar conexões ativas
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity
WHERE state = 'active';

-- Verificar locks
SELECT 
  locktype,
  database,
  relation::regclass,
  page,
  tuple,
  virtualxid,
  transactionid,
  mode,
  granted
FROM pg_locks
WHERE NOT granted;

*/

\echo '=== VALIDAÇÃO CONCLUÍDA ==='
\echo 'Consulte o relatório acima para verificar o status da migração.'
\echo 'Em caso de problemas, consulte a seção de troubleshooting no final do script.';