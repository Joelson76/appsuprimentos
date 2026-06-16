# 🧹 Relatório de Limpeza de Código
**Data:** 2026-06-15  
**Status:** Identificados arquivos para remoção/refatoração

---

## 📋 Sumário

| Categoria | Quantidade | Ação |
|-----------|------------|------|
| Arquivos `-old` | 1 | ❌ Deletar |
| Scripts de teste `.js` (raiz) | 29 | ⚠️ Mover ou deletar |
| TODOs no código | 2 | ✅ Implementar |
| Arquivos duplicados | 0 | ✅ OK |
| Imports não usados | ? | 🔍 Verificar |

---

## ❌ 1. Arquivos Obsoletos para DELETAR

### Arquivo `-old` (Dashboard antigo)
```
app/(dashboard)/dashboard/page-old.tsx
```

**Razão:** Existe `page-fase4.tsx` atualizado  
**Ação:** ❌ DELETAR imediatamente

**Comando:**
```bash
rm app/(dashboard)/dashboard/page-old.tsx
```

---

## ⚠️ 2. Scripts de Teste/Debug na Raiz (29 arquivos .js)

Esses arquivos estão na raiz do projeto e foram usados para testes durante desenvolvimento:

### Scripts de Verificação/Check
```
check-cotacao.js
check-estrutura.js
check-requisicoes.js
check-rls.js
check-schema.js
check-tables.js
check-tokens-novos.js
check-tokens.js
check-valores.js
debug-cotacao.js
debug-dashboard.js
ver-requisicao.js
verificar-estrutura-fornecedores.js
verificar-itens.js
verificar-pedidos.js
```

### Scripts de Teste
```
test-auth.js
test-fornecedores.js
test-numeracao.js
test-routes.js
test-update.js
testar-email-boas-vindas.js
testar-selecao.js
```

### Scripts de Alteração/Fix
```
apply-pedidos.js
apply-rls.js
fix-grants.js
limpar-resposta.js
limpar-todos.js
marcar-pedido-enviado.js
```

### Scripts de Listagem
```
list-cotacoes.js
```

**Ação Recomendada:**

**Opção 1 - Deletar tudo (RECOMENDADO):**
```bash
# Se você não precisa mais desses scripts
rm *.js
```

**Opção 2 - Mover para pasta `/scripts/debug/`:**
```bash
mkdir -p scripts/debug
mv *.js scripts/debug/
echo "scripts/debug/" >> .gitignore
```

**Opção 3 - Manter apenas os úteis:**
```bash
# Mover para scripts/
mkdir -p scripts/maintenance
mv check-rls.js scripts/maintenance/
mv test-auth.js scripts/maintenance/
# Deletar o resto
rm *.js
```

---

## ✅ 3. TODOs no Código (2 encontrados)

### TODO 1: Implementar e-mail de pedido
**Arquivo:** `app/api/pedidos/enviar-email/route.ts:62`
```typescript
// TODO: Implementar e-mail de pedido usando email-service-simple.ts
```

**Status:** ⚠️ Funcionalidade pendente  
**Impacto:** Médio - E-mail de pedido não está sendo enviado  
**Ação:** Implementar ou remover a rota se não for usada

### TODO 2: Implementar e-mail de boas-vindas
**Arquivo:** `app/api/auth/register/route.ts:94`
```typescript
// TODO: Implementar e-mail de boas-vindas usando email-service-simple.ts
```

**Status:** ⚠️ Funcionalidade pendente  
**Impacto:** Baixo - Nice to have  
**Ação:** Implementar ou converter em issue no GitHub

---

## 🔍 4. Verificações Adicionais Necessárias

### Imports Não Usados

Rodar ESLint para encontrar:
```bash
npm run lint
```

### Variáveis Não Usadas

TypeScript já detecta via `noUnusedLocals`:
```bash
npm run type-check
```

### Código Comentado

Buscar blocos grandes de código comentado:
```bash
# Buscar linhas começando com //
grep -r "^\s*//" app/ components/ lib/ hooks/ | wc -l
```

---

## 📦 5. Estrutura Recomendada de Pastas

### Antes:
```
appsuprimentos/
├── apply-pedidos.js          ❌ Na raiz
├── check-cotacao.js          ❌ Na raiz
├── test-auth.js              ❌ Na raiz
├── app/
└── components/
```

### Depois:
```
appsuprimentos/
├── scripts/
│   ├── maintenance/          ✅ Scripts de manutenção
│   │   ├── check-rls.js
│   │   └── test-auth.js
│   └── debug/                ✅ Scripts de debug (não commitar)
│       ├── check-cotacao.js
│       └── debug-dashboard.js
├── app/
└── components/
```

---

## 🎯 Plano de Ação Imediato

### ALTA PRIORIDADE (fazer agora)

```bash
# 1. Deletar arquivo obsoleto
rm app/(dashboard)/dashboard/page-old.tsx

# 2. Criar pasta de scripts
mkdir -p scripts/maintenance
mkdir -p scripts/debug

# 3. Mover scripts úteis
mv check-rls.js scripts/maintenance/
mv test-auth.js scripts/maintenance/

# 4. Deletar scripts de debug temporários
rm apply-*.js
rm check-*.js
rm debug-*.js
rm fix-*.js
rm limpar-*.js
rm list-*.js
rm marcar-*.js
rm test-*.js
rm testar-*.js
rm ver-*.js
rm verificar-*.js

# 5. Atualizar .gitignore
echo "scripts/debug/" >> .gitignore

# 6. Commit
git add .
git commit -m "chore: clean up obsolete files and organize scripts"
```

### MÉDIA PRIORIDADE (próximos dias)

- [ ] Implementar TODO de e-mail de pedido
- [ ] Implementar TODO de e-mail de boas-vindas
- [ ] Rodar `npm run lint --fix` para remover imports não usados
- [ ] Revisar código comentado e remover se desnecessário

### BAIXA PRIORIDADE (backlog)

- [ ] Configurar pre-commit hook para bloquear commits com TODOs
- [ ] Adicionar script de limpeza no package.json
- [ ] Configurar ESLint para detectar código morto

---

## 📊 Estatísticas

### Espaço em Disco
```
Scripts .js na raiz: ~100KB (29 arquivos)
page-old.tsx: ~5KB
```

**Total economizado:** ~105KB (pequeno, mas organiza o projeto)

### Impacto no Build
```
Arquivos .js na raiz: NÃO afetam build (Next.js ignora)
page-old.tsx: NÃO afeta build (não é referenciado)
```

**Impacto:** Apenas organizacional, não afeta performance

---

## ✅ Checklist de Limpeza

- [ ] Deletar `page-old.tsx`
- [ ] Organizar scripts `.js` em pastas
- [ ] Implementar ou remover TODOs
- [ ] Rodar `npm run lint --fix`
- [ ] Rodar `npm run type-check`
- [ ] Remover código comentado desnecessário
- [ ] Atualizar `.gitignore`
- [ ] Commit das mudanças

---

## 🚫 O QUE NÃO FAZER

❌ **Não deletar sem backup:**
```bash
# Ruim: deletar tudo de uma vez
rm -rf scripts/

# Bom: mover para backup primeiro
mkdir ../backup-scripts-$(date +%Y%m%d)
mv *.js ../backup-scripts-$(date +%Y%m%d)/
```

❌ **Não commitar scripts de debug:**
```bash
# Adicionar ao .gitignore
scripts/debug/
*.local.js
*.test.local.ts
```

❌ **Não deletar sem verificar dependências:**
```bash
# Verificar se algum arquivo importa antes de deletar
grep -r "import.*page-old" .
```

---

## 📝 Notas

1. **Scripts `.js` na raiz são seguros de mover/deletar** - não são parte do build do Next.js
2. **`page-old.tsx` é seguro deletar** - já existe versão atualizada (`page-fase4.tsx`)
3. **TODOs precisam ser resolvidos** - ou implementar ou remover
4. **Limpeza não afeta funcionalidade** - apenas organização

---

## 🔗 Recursos

- [Next.js File Conventions](https://nextjs.org/docs/app/building-your-application/routing)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Git Ignore Patterns](https://git-scm.com/docs/gitignore)

---

**Próxima revisão:** 2026-07-15 (mensal)
