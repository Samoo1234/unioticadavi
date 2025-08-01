# 🔧 Guia de Solução de Problemas - Desenvolvimento

## Problema: Servidor não mantém consistência / Precisa reiniciar

### 🚀 Soluções Rápidas

#### 1. **Usar servidor otimizado**
```bash
npm run dev:optimized
```

#### 2. **Limpar cache e reiniciar**
```bash
npm run dev:clean
```

#### 3. **Forçar reinicialização**
```bash
npm run restart
```

### 🔍 Diagnóstico

#### Verificar se a porta está ocupada:
```bash
npm run kill-port
npm run dev
```

#### Verificar configurações do Vite:
```bash
# Verificar se o arquivo vite.config.ts está correto
cat vite.config.ts
```

### ⚙️ Configurações Otimizadas

#### Scripts disponíveis:
- `npm run dev` - Servidor padrão
- `npm run dev:fast` - Servidor com --force
- `npm run dev:optimized` - Servidor com otimizações
- `npm run dev:clean` - Limpa cache e inicia
- `npm run restart` - Reinicia completamente
- `npm run kill-port` - Mata processo na porta 3002

### 🛠️ Configurações do Vite

O arquivo `vite.config.ts` foi otimizado com:

```typescript
server: {
  port: 3002,
  host: true,
  hmr: {
    overlay: true,
    port: 3002
  },
  watch: {
    usePolling: true,
    interval: 100
  }
}
```

### 🔧 Problemas Comuns

#### 1. **HMR não funciona**
- Verificar se não há erros no console
- Tentar `npm run dev:clean`
- Verificar firewall/antivírus

#### 2. **Porta ocupada**
```bash
npm run kill-port
npm run dev
```

#### 3. **Cache corrompido**
```bash
npm run clean
npm run dev
```

#### 4. **Dependências desatualizadas**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 📱 Acesso Externo

O servidor está configurado para aceitar conexões externas:
- **Local:** http://localhost:3002
- **Rede:** http://[seu-ip]:3002

### 🔄 Hot Module Replacement (HMR)

O HMR está configurado para:
- ✅ Recarregar automaticamente mudanças
- ✅ Manter estado do componente
- ✅ Mostrar erros na tela
- ✅ Funcionar com TypeScript

### 💡 Dicas

1. **Use `npm run dev:optimized`** para melhor performance
2. **Mantenha o console aberto** para ver erros
3. **Use `Ctrl+S`** para forçar recarregamento
4. **Verifique a aba Network** no DevTools
5. **Limpe cache regularmente** se houver problemas

### 🚨 Se nada funcionar

```bash
# Solução nuclear
rm -rf node_modules package-lock.json dist
npm install
npm run dev:clean
``` 