# 📋 Pendências e TODOs do Projeto

**Última atualização:** 2026-06-15

---

## 🚨 TODOs Encontrados no Código

### 1. ⚠️ E-mail de Pedido para Fornecedor
**Arquivo:** `app/api/pedidos/enviar-email/route.ts:62`  
**Linha:** 62  
**Código:**
```typescript
// TODO: Implementar e-mail de pedido usando email-service-simple.ts
```

**Contexto:**
- Rota API existe: `POST /api/pedidos/enviar-email`
- Template de e-mail já existe: `lib/email-templates/pedido-fornecedor.tsx`
- Serviço de e-mail disponível: `lib/email-service-simple.ts`
- Resend já configurado

**O que falta:**
```typescript
import { enviarEmailSimples } from '@/lib/email-service-simple'
import PedidoFornecedorEmail from '@/lib/email-templates/pedido-fornecedor'

// Implementar:
await enviarEmailSimples({
  to: fornecedor.email,
  subject: `Pedido de Compra ${pedido.numero}`,
  react: PedidoFornecedorEmail({ 
    pedido, 
    fornecedor, 
    itens, 
    tenant 
  })
})
```

**Prioridade:** MÉDIA  
**Estimativa:** 30 minutos  
**Depende de:** Nada (tudo pronto)

---

### 2. ✅ E-mail de Boas-Vindas
**Arquivo:** `app/api/auth/register/route.ts:94`  
**Linha:** 94  
**Código:**
```typescript
// TODO: Implementar e-mail de boas-vindas usando email-service-simple.ts
```

**Contexto:**
- Disparar quando novo usuário se cadastra
- Serviço de e-mail disponível: `lib/email-service-simple.ts`
- Resend configurado

**O que falta:**
1. Criar template de e-mail de boas-vindas
2. Implementar chamada no registro

**Implementação:**
```typescript
// 1. Criar lib/email-templates/boas-vindas.tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

export default function BoasVindasEmail({ 
  nome, 
  tenantNome,
  plano 
}: { 
  nome: string
  tenantNome: string
  plano: string
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc' }}>
        <Container>
          <Heading>Bem-vindo ao SupriFlow, {nome}!</Heading>
          <Text>
            Sua conta foi criada com sucesso para a empresa <strong>{tenantNome}</strong>.
          </Text>
          <Text>
            Plano ativo: <strong>{plano}</strong>
          </Text>
          <Button href="https://supriflow.com.br/dashboard">
            Acessar Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

// 2. Implementar em app/api/auth/register/route.ts
import { enviarEmailSimples } from '@/lib/email-service-simple'
import BoasVindasEmail from '@/lib/email-templates/boas-vindas'

await enviarEmailSimples({
  to: email,
  subject: 'Bem-vindo ao SupriFlow!',
  react: BoasVindasEmail({ 
    nome, 
    tenantNome: tenant.nome,
    plano: assinatura.plano
  })
})
```

**Prioridade:** BAIXA (nice to have)  
**Estimativa:** 1 hora  
**Depende de:** Template de e-mail

---

## 🔧 Melhorias Recomendadas

### 1. Middleware de Autenticação Global
**Arquivo:** `middleware.ts`  
**Status:** ⚠️ Implementado parcialmente

**Problema:**
- Middleware existe mas só redireciona rotas públicas/privadas
- Não valida assinatura expirada
- Não bloqueia acesso se tenant suspenso

**Solução:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && isProtectedRoute) {
    return NextResponse.redirect('/login')
  }
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(status), assinaturas(ativa, trial_fim)')
      .single()
    
    // Verificar se assinatura está ativa
    if (!profile.assinaturas.ativa && !isSuperAdmin) {
      return NextResponse.redirect('/configuracoes/assinatura')
    }
    
    // Verificar se trial expirou
    if (profile.tenants.status === 'TRIAL' && isTrialExpired(profile.assinaturas.trial_fim)) {
      return NextResponse.redirect('/configuracoes/planos')
    }
  }
  
  return NextResponse.next()
}
```

**Prioridade:** ALTA  
**Estimativa:** 2 horas

---

### 2. Logs de Auditoria
**Arquivo:** Novo - `supabase/migrations/audit_logs.sql`  
**Status:** ❌ Não implementado

**Implementação:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'access_denied'
  resource_type TEXT NOT NULL, -- 'requisicao', 'pedido', 'usuario'
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_audit" ON audit_logs
  FOR ALL USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Trigger automático
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em tabelas críticas
CREATE TRIGGER audit_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

**Prioridade:** MÉDIA  
**Estimativa:** 3 horas

---

### 3. Triggers Anti-Alteração de tenant_id
**Arquivo:** Novo - migration  
**Status:** ❌ Não implementado

**Implementação:**
```sql
CREATE OR REPLACE FUNCTION prevent_tenant_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tenant_id IS NOT NULL AND NEW.tenant_id != OLD.tenant_id THEN
    RAISE EXCEPTION 'Não é permitido alterar tenant_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com tenant_id
CREATE TRIGGER prevent_tenant_change_requisicoes
  BEFORE UPDATE ON requisicoes
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();

CREATE TRIGGER prevent_tenant_change_cotacoes
  BEFORE UPDATE ON cotacoes
  FOR EACH ROW EXECUTE FUNCTION prevent_tenant_id_change();

-- ... (repetir para todas as tabelas)
```

**Prioridade:** MÉDIA  
**Estimativa:** 1 hora

---

### 4. Rate Limiting nas APIs
**Arquivo:** `middleware.ts` ou Vercel config  
**Status:** ❌ Não implementado

**Opção 1 - Vercel (Recomendado):**
```typescript
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-RateLimit-Limit",
          "value": "100"
        },
        {
          "key": "X-RateLimit-Window",
          "value": "60s"
        }
      ]
    }
  ]
}
```

**Opção 2 - upstash/ratelimit:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // ... continuar
}
```

**Prioridade:** ALTA  
**Estimativa:** 2 horas

---

## 📊 Resumo de Prioridades

### ALTA (fazer agora)
- [ ] Middleware de validação de assinatura
- [ ] Rate limiting nas APIs

### MÉDIA (próximos 30 dias)
- [ ] E-mail de pedido para fornecedor
- [ ] Logs de auditoria
- [ ] Triggers anti-alteração tenant_id

### BAIXA (backlog)
- [ ] E-mail de boas-vindas
- [ ] Testes de penetração
- [ ] WAF (Cloudflare)

---

## 🎯 Estimativas Totais

| Prioridade | Itens | Tempo Total |
|------------|-------|-------------|
| ALTA | 2 | ~4 horas |
| MÉDIA | 3 | ~4.5 horas |
| BAIXA | 3 | ~3 horas |
| **TOTAL** | **8** | **~11.5 horas** |

---

## ✅ Checklist de Implementação

### E-mail de Pedido
- [ ] Implementar chamada ao email-service
- [ ] Testar envio de e-mail
- [ ] Remover TODO do código
- [ ] Adicionar testes

### E-mail de Boas-Vindas
- [ ] Criar template de e-mail
- [ ] Implementar chamada no registro
- [ ] Testar envio
- [ ] Remover TODO do código

### Middleware de Segurança
- [ ] Adicionar validação de assinatura
- [ ] Adicionar verificação de trial
- [ ] Testar bloqueio de acesso
- [ ] Documentar em SECURITY.md

### Logs de Auditoria
- [ ] Criar migration
- [ ] Criar triggers
- [ ] Criar interface de visualização
- [ ] Testar logs

### Rate Limiting
- [ ] Escolher solução (Vercel vs Upstash)
- [ ] Implementar
- [ ] Testar limites
- [ ] Documentar

---

**Próxima revisão:** 2026-07-15
