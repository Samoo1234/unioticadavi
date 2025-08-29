# Configuração MCP Supabase - Gestão Ótica

## 📋 Visão Geral

Este guia explica como configurar o Model Context Protocol (MCP) para o Supabase no projeto Gestão Ótica, facilitando operações de banco de dados diretamente através do Claude Desktop ou outros clientes MCP.

## 🚀 Configuração Rápida

### 1. Pré-requisitos

- Node.js instalado
- Acesso ao Supabase Dashboard
- Cliente MCP (Claude Desktop, etc.)

### 2. Instalação das Dependências

```bash
npm install @modelcontextprotocol/sdk @supabase/supabase-js
```

### 3. Adicionar Campo Credor no Banco

**IMPORTANTE**: Execute este SQL no Supabase Dashboard primeiro:

1. Acesse: https://supabase.com/dashboard/project/dmsaqxuoruinwpnonpky/sql
2. Execute o comando:

```sql
ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);
```

### 4. Configurar Cliente MCP

Adicione a configuração do arquivo `mcp-supabase-config.json` no seu cliente MCP:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["mcp-supabase-server.js"],
      "env": {
        "SUPABASE_URL": "https://dmsaqxuoruinwpnonpky.supabase.co",
        "SUPABASE_ANON_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

### 5. Testar Configuração

```bash
node setup-mcp-supabase.js
```

## 🛠️ Ferramentas Disponíveis

Após a configuração, você terá acesso às seguintes ferramentas MCP:

### `execute_sql`
Executa queries SQL diretamente no banco Supabase.

**Exemplo:**
```sql
SELECT * FROM despesas_fixas WHERE credor IS NOT NULL;
```

### `list_tables`
Lista todas as tabelas disponíveis no banco.

### `describe_table`
Descreve a estrutura de uma tabela específica.

**Exemplo:**
```
describe_table: despesas_fixas
```

### `add_credor_field`
Adiciona o campo credor na tabela despesas_fixas (se ainda não existir).

## 📁 Arquivos do Projeto

- `mcp-supabase-server.js` - Servidor MCP customizado
- `mcp-supabase-config.json` - Configuração do cliente MCP
- `setup-mcp-supabase.js` - Script de configuração e teste
- `add-credor-field.js` - Script alternativo para adicionar campo
- `add_credor_field.sql` - SQL para adicionar campo credor

## 🔧 Configuração no Claude Desktop

Para usar com Claude Desktop:

1. Localize o arquivo de configuração:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Adicione a configuração do Supabase:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["F:\\gestão otica\\mcp-supabase-server.js"],
      "env": {
        "SUPABASE_URL": "https://dmsaqxuoruinwpnonpky.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU"
      }
    }
  }
}
```

3. Reinicie o Claude Desktop

## ✅ Verificação

Após a configuração, você deve conseguir:

1. ✅ Executar queries SQL diretamente no chat
2. ✅ Listar tabelas do banco
3. ✅ Verificar estrutura das tabelas
4. ✅ Adicionar/modificar campos conforme necessário

## 🐛 Solução de Problemas

### Erro de Conexão
- Verifique se as credenciais do Supabase estão corretas
- Confirme se o projeto Supabase está ativo

### Campo Credor Não Aparece
- Execute o SQL manualmente no Supabase Dashboard
- Verifique se a query foi executada com sucesso

### MCP Não Funciona
- Verifique se o Node.js está instalado
- Confirme se as dependências foram instaladas
- Reinicie o cliente MCP após mudanças na configuração

## 📞 Suporte

Para problemas específicos:
1. Execute `node setup-mcp-supabase.js` para diagnóstico
2. Verifique os logs do cliente MCP
3. Confirme se todas as dependências estão instaladas

---

**Projeto**: Gestão Ótica  
**Versão**: 1.0  
**Data**: Janeiro 2025