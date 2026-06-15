# 🔒 Guia de Segurança do SupriFlow

## Arquitetura de Segurança Multi-Tenant

O SupriFlow implementa isolamento **total** entre tenants usando Row Level Security (RLS) do PostgreSQL.

### Regra de Ouro 🎯

```
NUNCA usar service_role_key no frontend
SEMPRE validar tenant_id em TODAS as queries
SEMPRE habilitar RLS em tabelas com dados de tenant
```

---

## 1. Row Level Security (RLS)

### Como Funciona

Cada usuário autenticado tem um JWT com:
```json
{
  "app_metadata": {
    "tenant_id": "uuid-do-tenant",
    "perfil": "ADMIN" | "GESTOR" | "COMPRADOR" | etc
  }
}
```

Todas as tabelas têm policies que verificam:
```sql
tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
```

### Tabelas com RLS Obrigatório

- ✅ `tenants` - Dados da empresa
- ✅ `profiles` - Usuários
- ✅ `requisicoes` - Requisições de compra
- ✅ `cotacoes` - Cotações
- ✅ `pedidos` / `ordens_compra` - Pedidos
- ✅ `fornecedores` - Fornecedores
- ✅ `contratos` - Contratos
- ✅ `notas_fiscais` - Notas fiscais
- ✅ `estoque` - Estoque
- ✅ `assinaturas` / `pagamentos` - Billing
- ✅ `notificacoes_pendentes` - Notificações

### Auditoria de RLS

Execute o script para verificar segurança:

```bash
# Via psql
psql -h seu-host -U postgres -d seu-db -f scripts/auditar-rls.sql

# Ou via Supabase SQL Editor
# Cole o conteúdo de scripts/auditar-rls.sql
```

**O que o script verifica:**
- ❌ Tabelas sem RLS habilitado
- ⚠️ Tabelas com `tenant_id` mas sem policy
- 📋 Lista todas as policies ativas
- 🔍 Verifica foreign keys sem CASCADE
- 📊 Conta registros por tenant

---

## 2. Middleware de Segurança

### O que o Middleware Faz

1. **Valida sessão** do usuário
2. **Verifica profile** e tenant_id
3. **Valida assinatura** (se trial/suspensa)
4. **Bloqueia acesso** se assinatura inativa
5. **Adiciona headers** com tenant_id (server-side)

### Rotas Protegidas

```typescript
// Públicas (sem autenticação)
/
/login
/cadastro
/planos
/api/webhooks/*

// Protegidas (requer autenticação + tenant válido)
/dashboard/*
/configuracoes/*
/requisicoes/*
/pedidos/*
// ... todas as outras
```

### Validação de Assinatura

```typescript
// Se assinatura SUSPENSA ou CANCELADA
→ Redireciona para /configuracoes/assinatura

// Se trial expirado
→ Redireciona para /configuracoes/planos

// Se SUPER_ADMIN
→ Bypass (acesso total)
```

---

## 3. Validação de Limites do Plano

### Limites por Plano

| Plano | Usuários | POs/Mês | Storage |
|-------|----------|---------|---------|
| Básico | 10 | 500 | 1 GB |
| Profissional | 50 | 5.000 | 10 GB |
| Enterprise | Ilimitado | Ilimitado | Ilimitado |

### Como Validar Antes de Criar Recurso

#### Frontend (React Hook)

```typescript
import { useCheckLimit } from '@/hooks/use-plan-limits'

function NovoUsuarioButton() {
  const { checkLimit, userUsage } = useCheckLimit('usuario')

  const handleCreate = () => {
    const { allowed, message } = checkLimit()

    if (!allowed) {
      toast.error(message)
      return
    }

    // Prosseguir com criação
  }

  return <Button onClick={handleCreate}>Adicionar Usuário</Button>
}
```

#### Backend (PostgreSQL Function)

```sql
SELECT verificar_limite_plano('usuario');
-- Retorna: { "permitido": true/false, "motivo": "..." }
```

### Componentes de UI

**Mostrar uso atual:**
```tsx
<UsageProgress
  type="po"
  used={150}
  limit={500}
/>
```

**Alertar quando limite atingido:**
```tsx
<LimitReachedAlert
  type="usuario"
  currentUsage={10}
  limit={10}
/>
```

---

## 4. Prevenção de Vazamento de Dados

### ❌ NUNCA Fazer

```typescript
// ERRADO: Query sem filtro de tenant
const { data } = await supabase
  .from('requisicoes')
  .select('*')  // ❌ Pode vazar dados de outros tenants!

// ERRADO: Usar service_role no frontend
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ❌ Bypassa RLS!
)
```

### ✅ SEMPRE Fazer

```typescript
// CERTO: RLS valida automaticamente via JWT
const { data } = await supabase
  .from('requisicoes')
  .select('*')  // ✅ RLS filtra por tenant_id automaticamente

// CERTO: Usar anon key no frontend
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY  // ✅ Respeita RLS
)
```

### Trigger Anti-Alteração

Para prevenir mudança maliciosa de `tenant_id`:

```sql
CREATE TRIGGER prevent_tenant_change_requisicoes
  BEFORE UPDATE ON requisicoes
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();
```

Se tentar `UPDATE requisicoes SET tenant_id = 'outro-tenant'`:
→ **ERROR:** Não é permitido alterar tenant_id

---

## 5. Segurança de APIs

### Webhooks (Externos)

Para webhooks de terceiros (Asaas, etc):

```typescript
// ✅ PODE usar service_role
// (webhook não tem sessão de usuário)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // OK aqui
)

// MAS: sempre validar assinatura/secret do webhook
const signature = request.headers.get('x-asaas-signature')
if (!validateSignature(signature, body)) {
  return new Response('Unauthorized', { status: 401 })
}
```

### Edge Functions

```typescript
// Edge Functions podem usar service_role
// MAS: sempre validar contexto antes de operar
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return new Response('Unauthorized', { status: 401 })
}

// Buscar tenant do usuário ANTES de qualquer operação
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', user.id)
  .single()

// Sempre filtrar por tenant ao usar service_role
const { data } = await supabase
  .from('requisicoes')
  .select('*')
  .eq('tenant_id', profile.tenant_id)  // ✅ Filtro explícito
```

---

## 6. Auditoria e Monitoramento

### Logs Críticos

Eventos que DEVEM ser logados:
- ❌ Tentativa de acesso a tenant diferente
- ❌ Tentativa de alterar tenant_id
- ✅ Login/Logout
- ✅ Criação de usuário
- ✅ Alteração de perfil/permissões
- ✅ Exportação em massa de dados

### Query de Auditoria

```sql
-- Ver tentativas de acesso negadas (RLS)
SELECT
  usename,
  query,
  query_start,
  state
FROM pg_stat_activity
WHERE query LIKE '%permission denied%'
ORDER BY query_start DESC;
```

### Alertas Sugeridos

Configure alertas para:
- 🚨 Mais de 10 erros RLS em 1 minuto
- 🚨 Tentativa de acesso direto ao banco (não via API)
- 🚨 Service role usada de IP desconhecido
- ⚠️ Assinatura suspensa por inadimplência

---

## 7. Checklist de Segurança

### Antes de Produção

- [ ] Todas as tabelas com `tenant_id` têm RLS habilitado
- [ ] Todas as tabelas têm policies testadas
- [ ] Service role NÃO está exposta no frontend
- [ ] Middleware valida tenant em todas as rotas
- [ ] Limites de plano são validados no backend
- [ ] Webhooks validam assinaturas/secrets
- [ ] Variáveis sensíveis estão no `.env` (não commitadas)
- [ ] Logs de auditoria estão funcionando
- [ ] Backup automático configurado
- [ ] SSL/TLS habilitado em todas as conexões

### Revisão Mensal

- [ ] Executar `scripts/auditar-rls.sql`
- [ ] Revisar logs de segurança
- [ ] Atualizar dependências (npm audit)
- [ ] Verificar usuários inativos
- [ ] Revisar permissões de API keys

---

## 8. Resposta a Incidentes

### Se Suspeitar de Vazamento de Dados

1. **Isolar:** Rotacione service_role_key imediatamente
2. **Investigar:** Rode `scripts/auditar-rls.sql`
3. **Auditar:** Verifique logs de acesso por tenant
4. **Notificar:** Informe tenants afetados (se confirmado)
5. **Corrigir:** Aplique fix e teste exaustivamente
6. **Documentar:** Registre causa raiz e prevenção

### Contatos de Emergência

- **Supabase Support:** https://supabase.com/support
- **Equipe Dev:** [seu e-mail]
- **Incident Response:** [playbook interno]

---

## 9. Recursos Adicionais

### Documentação Oficial

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Scripts Úteis

- `scripts/auditar-rls.sql` - Auditoria de segurança
- `supabase/migrations/20260615000002_rls_completo.sql` - Setup RLS completo

### Testes de Segurança

```bash
# Testar se RLS está funcionando
# 1. Login como Tenant A
# 2. Tentar acessar dados do Tenant B via browser dev tools
# 3. Deve receber: [] (vazio) ou erro 403

# Testar limites
# 1. Criar 10 usuários (limite do Básico)
# 2. Tentar criar 11º usuário
# 3. Deve receber: erro "Limite atingido"
```

---

## 10. Responsabilidades

| Camada | Responsabilidade | Quem |
|--------|------------------|------|
| RLS | Isolamento tenant | PostgreSQL |
| Middleware | Validação sessão | Next.js |
| Frontend | UX de limites | React |
| Backend | Lógica negócio | Edge Functions |
| Infra | Backups, SSL | Supabase |

**Lembre-se:** Segurança é responsabilidade de TODOS, em TODAS as camadas.

---

> 🔒 **Princípio de Menor Privilégio**
>
> Dê o mínimo de acesso necessário. Se dúvida, negue. É mais fácil liberar depois do que corrigir um vazamento.
