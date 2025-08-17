# Consolidação das Tabelas de Despesas

## Resumo das Alterações

Este documento descreve as alterações realizadas para consolidar e unificar as tabelas relacionadas a despesas no sistema, bem como as correções de integridade referencial.

## Estrutura Original

Inicialmente, existiam as seguintes tabelas:
- `categorias` - Para categorias gerais
- `categorias_despesas` - Para categorias específicas de despesas
- `despesas_fixas` - Para despesas de valor fixo recorrentes
- `despesas_diversas` - Para despesas variáveis ou não recorrentes
- `filiais` - Para as diferentes filiais da ótica

## Alterações Realizadas

### 1. Unificação de Categorias

- Mantida a tabela `categorias` como tabela principal para todas as categorias
- Adicionado campo `tipo` na tabela `categorias` para distinguir:
  - `despesa_fixa` - Categorias para despesas fixas
  - `categoria_despesa` - Categorias gerais de despesas
  - `categoria_diversa` - Categorias para despesas diversas

- Mantida a tabela `categorias_despesas` por compatibilidade, mas todas as categorias foram duplicadas na tabela `categorias` unificada

### 2. Ajustes na Tabela `despesas_diversas`

- Corrigida a estrutura de colunas para compatibilizar com a estrutura existente:
  - Verificado que a coluna `data` é obrigatória (NOT NULL)
  - Dados importados usam esta coluna ao invés de `data_despesa`
  - Adicionada coluna `observacao` para comentários adicionais

### 3. Importação de Dados

- Importados dados do arquivo `categorias_despesas_rows.sql` para a tabela `categorias_despesas`
- Migrados dados da tabela `categorias_despesas` para a tabela `categorias` unificada
- Importados dados do arquivo `despesas_diversas_rows.sql` para a tabela `despesas_diversas`

## Próximos Passos Recomendados

1. **Atualizar os componentes frontend**:
   - Modificar `CategoriasDespesas.tsx` para usar a tabela `categorias` filtrada por tipo
   - Atualizar `DespesasFixas.tsx` para usar a tabela `categorias` filtrada por tipo

2. **Considerar eventual remoção da tabela `categorias_despesas`**:
   - Quando todos os componentes estiverem atualizados para usar a tabela unificada
   - Criar uma view com o mesmo nome para manter compatibilidade com código legado

3. **Padronizar nomes de colunas**:
   - Decidir entre `data_despesa` e `data` como padrão
   - Padronizar nomes de colunas como `observacao` e `observacoes`

## Scripts SQL Criados

1. `ajustar_categorias_despesas.sql` - Adiciona coluna `tipo` à tabela categorias_despesas
2. `ajustar_despesas_diversas.sql` - Adiciona coluna `observacao` à tabela despesas_diversas
3. `ajustar_categorias_finais.sql` - Atualiza categorias específicas na tabela categorias
4. `transferir_categorias.sql` - Transfere categorias da tabela categorias_despesas para categorias
5. `ajustar_import_despesas_diversas.sql` - Script ajustado para importação de despesas diversas
6. `corrigir_filial_id_despesas_diversas.sql` - Corrige os IDs de filiais nas despesas diversas (mapeando IDs antigos 1→18, 4→19, 6→18)
7. `adicionar_foreign_key_despesas_diversas_filiais.sql` - Adiciona chave estrangeira entre despesas_diversas e filiais

## Correções de Integridade Referencial

Foram identificados e corrigidos problemas de integridade referencial:

1. **Tabela `despesas_diversas` faltando relação com `filiais`**:
   - Identificado erro: "Could not find a relationship between 'despesas_diversas' and 'filiais'"
   - Faltava uma chave estrangeira entre as tabelas
   - IDs incompatíveis: despesas_diversas usava filial_id 1, 4, 6, mas filiais tinha apenas IDs 18 e 19
   - Correção: IDs foram mapeados e a chave estrangeira foi adicionada

## Conclusão

A consolidação das tabelas foi concluída com sucesso, mantendo a compatibilidade com o código existente enquanto se prepara para uma eventual simplificação do esquema no futuro.

Os dados foram importados corretamente, as tabelas estão com a integridade referencial adequada e estão prontas para uso pelos componentes frontend.
