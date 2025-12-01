# Integração API Centralizada de Clientes

## 📋 Resumo

Implementação completa da integração com a API REST centralizada de clientes do VisionCare, permitindo sincronização automática de dados de clientes entre o sistema local e o banco de dados central.

## 🔗 URL da API

```
https://visioncare-2025.vercel.app
```

## 📁 Arquivos Modificados

### 1. **src/services/clientes-api.ts** (NOVO)
Serviço completo para comunicação com a API centralizada.

**Funcionalidades:**
- ✅ Buscar cliente por telefone
- ✅ Buscar cliente por ID
- ✅ Criar novo cliente (cadastro mínimo ou completo)
- ✅ Atualizar cliente existente
- ✅ Excluir cliente
- ✅ Listar clientes com filtros

**Interfaces:**
```typescript
interface ClienteCentral {
  id: string;
  nome: string;
  telefone: string;
  cpf?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  codigo?: string;
  cadastro_completo: boolean;
  created_at?: string;
  updated_at?: string;
}
```

### 2. **src/pages/Clientes.tsx**
Página de gerenciamento de clientes totalmente integrada com a API central.

**Mudanças principais:**
- ✅ `loadClients()` - Busca clientes da API central
- ✅ `handleSubmit()` - Cria/atualiza via API central
- ✅ `handleDeleteConfirm()` - Exclui via API central (com validação de agendamentos)
- ✅ Estatísticas alteradas: "Cadastro Completo" vs "Cadastro Básico"
- ✅ Filtros atualizados para usar `cadastro_completo`
- ⚠️ Status ativo/inativo removido (API central não suporta ainda)

### 3. **src/pages/Agendamentos.tsx**
Integração automática ao criar agendamentos.

**Mudanças principais:**
- ✅ `buscarOuCriarCliente()` - Busca cliente ao digitar telefone
- ✅ Feedback visual no campo telefone:
  - 🔄 Loading spinner durante busca
  - ✅ Ícone verde quando cliente encontrado
  - ℹ️ Mensagem "Cliente encontrado no sistema!"
  - 📝 Mensagem "Novo cliente será cadastrado"
- ✅ `handleSubmit()` - Garante que cliente existe na API antes de criar agendamento
- ✅ Auto-preenchimento do nome quando telefone é encontrado

## 🔄 Fluxo de Integração

### Página de Clientes
```
1. Usuário acessa página Clientes
2. Sistema busca todos os clientes da API central
3. Clientes são exibidos com status "Completo" ou "Básico"
4. Ao criar/editar: dados são enviados para API central
5. Ao excluir: verifica agendamentos locais antes de excluir na API
```

### Página de Agendamentos
```
1. Usuário digita telefone no formulário
2. Quando telefone completo (10 ou 11 dígitos):
   a. Sistema busca cliente na API central
   b. Se encontrado: preenche nome automaticamente
   c. Se não encontrado: aguarda nome para criar
3. Ao salvar agendamento:
   a. Verifica se cliente existe na API
   b. Se não existe: cria cadastro básico (nome + telefone + cidade)
   c. Salva agendamento no Supabase local
```

## 📊 Tipos de Cadastro

### Cadastro Básico
- Nome
- Telefone
- `cadastro_completo: false`

### Cadastro Completo
- Nome
- Telefone
- Email (opcional)
- CPF (opcional)
- Endereço (opcional)
- Cidade (opcional)
- `cadastro_completo: true`

## ⚠️ Pontos de Atenção

### 1. Relacionamento Agendamento ↔ Cliente
- Agendamentos ficam no **Supabase local**
- Clientes ficam na **API central**
- Relacionamento por **telefone** (campo comum)

### 2. Validação de Exclusão
Antes de excluir um cliente:
```typescript
// Verifica se tem agendamentos no Supabase local
const { data: appointments } = await supabase
  .from('agendamentos')
  .select('id')
  .eq('telefone', cliente.telefone)
  .limit(1);

if (appointments && appointments.length > 0) {
  toast.warning('Cliente possui agendamentos e não pode ser excluído!');
  return;
}
```

### 3. Tratamento de Erros
- Erros da API são capturados e exibidos ao usuário
- Falhas na sincronização não bloqueiam agendamentos
- Logs detalhados no console para debug

### 4. Campos Removidos/Alterados
- ❌ `active` (ativo/inativo) - API central não suporta
- ✅ `cadastro_completo` - Novo campo da API
- ✅ `codigo` - Código único do cliente (gerado pela API)

## 🧪 Como Testar

### Teste 1: Criar Cliente na Página Clientes
```
1. Acesse "Clientes"
2. Clique em "Novo Cliente"
3. Preencha nome e telefone
4. Salve
5. Verifique se aparece na lista com status "Básico"
```

### Teste 2: Busca Automática em Agendamentos
```
1. Acesse "Agendamentos"
2. Clique em "Novo Agendamento"
3. Digite um telefone existente
4. Observe:
   - Loading spinner aparece
   - Nome é preenchido automaticamente
   - Mensagem "Cliente encontrado no sistema!"
```

### Teste 3: Criar Cliente via Agendamento
```
1. Acesse "Agendamentos"
2. Clique em "Novo Agendamento"
3. Digite telefone NOVO
4. Digite nome
5. Preencha demais campos
6. Salve
7. Verifique em "Clientes" se foi criado
```

### Teste 4: Editar Cliente
```
1. Acesse "Clientes"
2. Clique em "Editar" em um cliente
3. Altere dados (email, cidade, etc)
4. Salve
5. Verifique se status mudou para "Completo"
```

### Teste 5: Excluir Cliente
```
1. Acesse "Clientes"
2. Tente excluir cliente COM agendamento
   - Deve mostrar erro
3. Tente excluir cliente SEM agendamento
   - Deve excluir com sucesso
```

## 🔧 Configuração

### Variáveis de Ambiente
Não é necessário adicionar variáveis de ambiente. A URL da API está hardcoded no serviço:

```typescript
// src/services/clientes-api.ts
const VISIONCARE_API = 'https://visioncare-2025.vercel.app';
```

### Dependências
Nenhuma dependência adicional foi necessária. Usa apenas:
- `fetch` (nativo do navegador)
- `react-toastify` (já existente)

## ✅ Correções Implementadas

### 12/Nov/2025 - Correção de Parsing de Resposta
- ✅ Todas as funções agora extraem corretamente `result.data` da resposta da API
- ✅ Suporte a múltiplos formatos de resposta (`result.data || result`)
- ✅ Função `listar()` agora trata o formato `{ data: [], pagination: {} }`

## 📝 Próximos Passos (Sugestões)

1. **Adicionar campo de status ativo/inativo na API central**

3. **Sincronização bidirecional:**
   - Webhook para notificar mudanças na API
   - Atualização automática de dados locais

4. **Cache local:**
   - Armazenar clientes em localStorage
   - Reduzir chamadas à API

5. **Busca avançada:**
   - Buscar por nome, CPF, email
   - Filtros mais complexos

## 🐛 Troubleshooting

### Erro: "Failed to fetch"
- Verificar se a API está online
- Verificar URL da API
- Verificar CORS na API

### Cliente não aparece na lista
- Verificar console do navegador
- Verificar se API retornou dados
- Verificar formato de resposta da API

### Nome não preenche automaticamente
- Verificar se telefone está no formato correto
- Verificar se cliente existe na API
- Verificar logs no console

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verificar logs do console do navegador
2. Verificar logs da API no Vercel
3. Verificar este documento de integração
