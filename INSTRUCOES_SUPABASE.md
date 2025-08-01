# Instruções para Configurar a Tabela Usuarios no Supabase

## Problema Identificado
A tabela `usuarios` no seu banco Supabase existe parcialmente, mas está faltando algumas colunas (como `ativo`), causando erros na aplicação.

## Solução: Executar Scripts em Sequência

### Passo 1: Corrigir a Tabela Usuarios
1. Abra o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o arquivo `fix-usuarios-table.sql`
   - Este script vai remover a tabela existente e recriar completamente
   - Inclui todas as colunas necessárias, índices, triggers e políticas de segurança

### Passo 2: Obter seu User ID do Supabase Auth
1. No Supabase Dashboard, vá para **Authentication > Users**
2. Encontre seu usuário na lista
3. Copie o **User ID** (formato UUID)

### Passo 3: Inserir o Primeiro Usuário Admin
1. Abra o arquivo `setup-primeiro-usuario.sql`
2. **IMPORTANTE**: Substitua os seguintes valores:
   - `COLE_AQUI_O_ID_DO_AUTH_USERS` → Cole seu User ID real
   - `Seu Nome Completo` → Seu nome real
   - `seu.email@exemplo.com` → Seu email real
3. Execute o script modificado no **SQL Editor**

### Passo 4: Configurar Variáveis de Ambiente
1. No arquivo `.env` do projeto, configure:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

### Passo 5: Testar a Aplicação
1. Certifique-se de que o servidor está rodando: `npm run dev`
2. Acesse `http://localhost:3008/`
3. Faça login com suas credenciais
4. Verifique se o dashboard carrega sem erros

## Scripts Criados

- **`fix-usuarios-table.sql`**: Corrige/recria a tabela usuarios completamente
- **`setup-primeiro-usuario.sql`**: Insere o primeiro usuário admin
- **`create-usuarios-table.sql`**: Script original (use apenas se a tabela não existir)
- **`setup-usuario.sql`**: Script original para inserir usuário (pode não funcionar devido às políticas)

## Ordem de Execução
1. `fix-usuarios-table.sql` (sempre execute primeiro)
2. `setup-primeiro-usuario.sql` (com seus dados reais)

## Troubleshooting

### Se ainda houver erros:
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme que o User ID foi copiado corretamente
3. Verifique se o email no script corresponde ao email de login
4. Certifique-se de que a tabela `filiais` existe (se necessário)

### Para verificar se tudo funcionou:
```sql
-- Execute no SQL Editor para verificar
SELECT * FROM usuarios;
```

Deveria retornar seu usuário com todas as colunas preenchidas.