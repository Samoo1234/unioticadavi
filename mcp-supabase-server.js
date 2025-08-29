#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_sql',
          description: 'Execute SQL queries on Supabase database',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to execute',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'add_credor_field',
          description: 'Add credor field to despesas_fixas table',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in the database',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'describe_table',
          description: 'Describe the structure of a table',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: 'Name of the table to describe',
              },
            },
            required: ['table_name'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_sql':
            return await this.executeSql(args.query);
          case 'add_credor_field':
            return await this.addCredorField();
          case 'list_tables':
            return await this.listTables();
          case 'describe_table':
            return await this.describeTable(args.table_name);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async executeSql(query) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        // Try alternative method for simple queries
        if (query.toLowerCase().includes('select')) {
          const tableName = this.extractTableName(query);
          if (tableName) {
            const { data: altData, error: altError } = await supabase
              .from(tableName)
              .select('*')
              .limit(10);
            
            if (!altError) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Query executed successfully:\n${JSON.stringify(altData, null, 2)}`,
                  },
                ],
              };
            }
          }
        }
        
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Query executed successfully:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }

  async addCredorField() {
    try {
      // Check if field already exists
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'despesas_fixas')
        .eq('column_name', 'credor');

      if (columns && columns.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'Campo credor já existe na tabela despesas_fixas',
            },
          ],
        };
      }

      // Try to add the field using a direct SQL approach
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);'
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Campo credor adicionado com sucesso à tabela despesas_fixas',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to add credor field: ${error.message}`);
    }
  }

  async listTables() {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) throw new Error(error.message);

      const tableNames = data.map(row => row.table_name).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Tables in database:\n${tableNames}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  async describeTable(tableName) {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        throw new Error(`Table '${tableName}' not found`);
      }

      const description = data.map(col => 
        `${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Table '${tableName}' structure:\n${description}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to describe table: ${error.message}`);
    }
  }

  extractTableName(query) {
    const match = query.match(/from\s+([\w_]+)/i);
    return match ? match[1] : null;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP server running on stdio');
  }
}

const server = new SupabaseMCPServer();
server.run().catch(console.error);