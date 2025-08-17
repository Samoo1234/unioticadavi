# Padronização das Páginas Despesas Fixas e Despesas Diversas

## Alterações feitas no banco de dados

1. Adicionamos os campos abaixo na tabela `despesas_fixas` para seguir o mesmo padrão da tabela `despesas_diversas`:
   - `data_pagamento` (date) - para registrar quando a despesa foi paga
   - `forma_pagamento` (varchar) - para registrar a forma de pagamento
   - `comprovante_url` (varchar) - para armazenar link para comprovante de pagamento
   - Renomeamos `observacao` para `observacoes` para padronizar com a outra tabela

2. Adicionamos chaves estrangeiras:
   - `despesas_fixas_filial_id_fkey` - relaciona `filial_id` com a tabela `filiais`
   - `despesas_fixas_categoria_id_fkey` - relaciona `categoria_id` com a tabela `categorias`

## Modificações necessárias na interface

Para padronizar a página de Despesas Fixas com a página de Despesas Diversas, precisamos:

1. Atualizar a estrutura do componente:
   - Adicionar filtros de filial
   - Manter a visualização de despesas inativas através de toggle
   - Adicionar exibição do estado de pagamento na tabela
   - Implementar função para registrar pagamentos

2. Implementar componentes visuais no mesmo padrão:
   - Cards para filtros
   - Layout da tabela semelhante
   - Ícones consistentes para ações
   - Diálogos para edição/criação/pagamento no mesmo estilo visual

3. Implementar tratamento para os novos campos:
   - `data_pagamento` 
   - `forma_pagamento`
   - `comprovante_url`

4. Preservar funcionalidades específicas da página Despesas Fixas:
   - Periodicidade e dia de vencimento
   - Geração automática de vencimentos

## Abordagem para implementação

Como o arquivo é grande, vamos dividir as modificações em etapas:

1. Atualizar imports e definição de tipos
2. Implementar novos estados e filtros
3. Atualizar funções de busca e manipulação de dados
4. Atualizar layout dos filtros e componentes superiores
5. Atualizar tabela e ações
6. Implementar novos diálogos (pagamento)
7. Atualizar diálogos existentes
