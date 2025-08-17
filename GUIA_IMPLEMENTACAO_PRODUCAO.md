# Guia de Implementação em Produção

Este documento fornece instruções detalhadas para implementar as correções dos problemas de filtragem por tipo_id em ambiente de produção.

## Preparação

1. **Backup do Banco de Dados**
   - Faça um backup completo do banco de dados antes de qualquer alteração
   - No Supabase: Vá para Database → Backups → Create Backup

2. **Verificação do Ambiente**
   - Confirme o acesso com privilégios administrativos ao banco de dados
   - Verifique se você tem acesso para modificar políticas RLS

## Etapa 1: Execução dos Scripts SQL

Execute os scripts na seguinte ordem:

1. **Desativar RLS temporariamente e corrigir valores tipo_id**
   ```sql
   -- Execute o script solucao_final_tipo_id_v2.sql
   ```

2. **Configurar políticas RLS corretas para a tabela titulos**
   ```sql
   -- Execute o script configurar_politicas_titulos.sql
   ```

3. **Verificação de Resultados**
   ```sql
   -- Verificar se não há mais registros com tipo_id NULL
   SELECT COUNT(*) FROM titulos WHERE tipo_id IS NULL;
   
   -- Verificar se as políticas foram aplicadas
   SELECT schemaname, tablename, policyname FROM pg_policies
   WHERE tablename = 'titulos';
   ```

## Etapa 2: Atualização do Código da Aplicação

1. **Atualize os Componentes React**
   - Implante a nova versão de `EmissaoTitulos.tsx`
   - Adicione o novo arquivo `CorrecaoFiltros.tsx` ao projeto

2. **Construa e Implante a Aplicação**
   ```bash
   # Exemplo com npm
   npm run build
   # Implante para sua plataforma de hospedagem
   ```

## Etapa 3: Testes Pós-Implantação

1. **Testes de Aceitação**
   - Verifique se a filtragem por tipo funciona corretamente
   - Confirme que os títulos são exibidos com os tipos corretos

2. **Monitoramento**
   - Observe os logs da aplicação por 24-48 horas após a implantação
   - Procure por erros relacionados à RLS ou conversão de tipos

## Etapa 4: Limpeza (Opcional)

Após confirmar que tudo está funcionando corretamente por pelo menos uma semana:

1. **Considere remover a coluna 'tipo' redundante**
   ```sql
   -- Não execute imediatamente - aguarde confirmação de estabilidade
   -- ALTER TABLE titulos DROP COLUMN tipo;
   ```

2. **Remova logs de depuração desnecessários do código**

## Solução de Problemas

### Se ocorrerem erros RLS após a implantação:
1. Verifique os logs do Supabase para mensagens específicas
2. Execute novamente o script `configurar_politicas_titulos.sql`
3. Verifique se o usuário da aplicação tem os privilégios corretos

### Se os filtros ainda não funcionarem:
1. Confirme que todos os registros têm `tipo_id` válido usando a consulta de verificação
2. Verifique os console.logs no navegador para erros de tipo
3. Use as funções utilitárias de `CorrecaoFiltros.tsx` para debugging adicional
