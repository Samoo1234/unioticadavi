# Solução Completa para Problema de Filtragem por Tipo

## Problemas Identificados

Analisando o screenshot e os logs da aplicação, identifiquei dois problemas principais:

1. **Valores NULL no campo tipo_id**: Impede filtragem correta dos títulos
2. **Erro de política RLS (Row Level Security)**: Mensagem "New violation row-level security policy for table titulos"
3. **Erros de parsing de valores**: "The specified value 'NS 1' cannot be parsed" indicando problemas na conversão de strings para números

## Soluções Implementadas

### 1. Script para corrigir valores NULL em tipo_id
Arquivo: `solucao_final_tipo_id_v2.sql`
- Desabilita RLS temporariamente
- Atualiza registros com tipo_id NULL de acordo com o valor do campo tipo
- Considera os valores reais da tabela (tipo_id 1 = Lentes, tipo_id 2 = Armações)

### 2. Configuração de políticas RLS
Arquivo: `configurar_politicas_titulos.sql`
- Configura políticas RLS para permitir SELECT, INSERT, UPDATE e DELETE para usuários autenticados
- Remove políticas conflitantes existentes
- Inclui verificação das políticas após aplicação

### 3. Correção de erros de parsing no código
Arquivo: `EmissaoTitulos.tsx`
- Implementada validação para garantir que os valores tipo_id sejam tratados como números para comparação
- Adicionada função de utilidade `parseNumberSafely` para conversão segura de valores
- Corrigido método `handleFilialChange` para tratar valores não numéricos

### 4. Biblioteca de utilitários para tratamento seguro
Arquivo: `CorrecaoFiltros.tsx`
- Funções para parsing e comparação segura de valores
- Garantia de compatibilidade entre valores de diferentes tipos
- Verificação de valores contra listas de valores válidos

## Instruções de Execução

1. Execute `solucao_final_tipo_id_v2.sql` no Supabase SQL Editor como administrador para corrigir os valores NULL
2. Execute `configurar_politicas_titulos.sql` para configurar as políticas RLS corretamente
3. Verifique se os títulos têm seus valores tipo_id preenchidos corretamente
4. As alterações no código TypeScript já foram aplicadas e devem corrigir os erros de parsing

## Verificações Finais

Após executar os scripts, confirme:
1. Não há mais registros com `tipo_id IS NULL` na tabela `titulos`
2. As políticas RLS estão configuradas corretamente
3. A aplicação filtra corretamente por tipo de fornecedor sem erros de parsing
