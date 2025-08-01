# Sistema de Gestão Ótica - ÓTICADAVÍ

Sistema completo de gestão para ótica, desenvolvido com React, TypeScript, Material-UI e Supabase.

## 🚀 Funcionalidades

### 📅 Agendamentos
- **Formulário público** para agendamento de consultas
- **Sistema interno** para gerenciamento de agendamentos
- **Filtros** por filial, data e status
- **Controle de status** (Pendente, Confirmado, Cancelado)
- **Configuração de horários** por filial

### 🏢 Gestão de Filiais
- Cadastro e gerenciamento de filiais
- Configuração de horários de funcionamento
- Controle de datas disponíveis

### 👨‍⚕️ Gestão de Médicos
- Cadastro de médicos
- Controle de especialidades
- Status ativo/inativo

### 👥 Gestão de Clientes
- Cadastro de clientes
- Histórico de atendimentos
- Dados de contato

### 💰 Módulo Financeiro
- Controle de receitas e despesas
- Gestão de fornecedores
- Relatórios financeiros
- Títulos a pagar/receber

### 📋 Ordens de Serviço
- Criação de OS
- Controle de custos
- Acompanhamento de status

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **UI**: Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Build**: Vite
- **Roteamento**: React Router DOM

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Samoo1234/unioticadavi.git
cd unioticadavi
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Execute o projeto**
```bash
npm run dev
```

## 🗄️ Banco de Dados

O sistema utiliza Supabase com as seguintes tabelas principais:

- `filiais` - Filiais da ótica
- `medicos` - Médicos cadastrados
- `clientes` - Clientes cadastrados
- `agendamentos` - Agendamentos de consultas
- `datas_disponiveis` - Datas disponíveis para agendamento
- `configuracoes_horarios` - Configurações de horários por filial
- `usuarios` - Usuários do sistema
- `fornecedores` - Fornecedores
- `titulos` - Títulos a pagar/receber
- `ordens_servico` - Ordens de serviço
- `custos_os` - Custos das OS
- `movimentacoes_financeiras` - Movimentações financeiras

## 🔐 Autenticação

O sistema possui diferentes níveis de acesso:
- **Super Admin** - Acesso total
- **Admin** - Administração geral
- **Manager** - Gestão de filial
- **Receptionist** - Recepção e agendamentos
- **Financial** - Módulo financeiro
- **Doctor** - Acesso médico

## 📱 Páginas Principais

- **Página Inicial** - Formulário público de agendamento
- **Dashboard** - Visão geral do sistema
- **Agendamentos** - Gerenciamento de consultas
- **Filiais** - Gestão de filiais
- **Médicos** - Cadastro de médicos
- **Clientes** - Gestão de clientes
- **Financeiro** - Módulo financeiro
- **OS** - Ordens de serviço

## 🚀 Deploy

O sistema pode ser deployado em:
- Vercel
- Netlify
- GitHub Pages
- Qualquer servidor que suporte aplicações React

## 📄 Licença

Este projeto é privado e desenvolvido para uso específico da ÓTICADAVÍ.

## 👨‍💻 Desenvolvedor

Sistema desenvolvido para gestão completa de ótica, incluindo agendamentos, financeiro e controle de filiais.

---

**ÓTICADAVÍ** - Sistema de Gestão Ótica Completo