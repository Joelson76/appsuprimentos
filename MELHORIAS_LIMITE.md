# Melhorias no Sistema de Validação de Limites

## ❌ ANTES (403 genérico)

```json
HTTP 403 Forbidden
{
  "error": "Limite de pedidos atingido",
  "detalhes": "Você já criou 50/50 pedidos..."
}
```

**Problemas:**
- Erro HTTP sem contexto visual
- Usuário precisa interpretar JSON
- Não mostra quanto foi usado
- Não sugere solução clara
- Experiência ruim (quebra o fluxo)

---

## ✅ DEPOIS (Sistema completo)

### 1️⃣ **Validação PRÉVIA (antes de tentar criar)**

```tsx
// Hook personalizado
const { verificarAntesDeCriar } = useVerificarLimite()

<Button onClick={() => {
  verificarAntesDeCriar('pedidos', () => {
    router.push('/pedidos/novo') // Só executa se dentro do limite
  })
}}>
  Novo Pedido
</Button>
```

### 2️⃣ **Modal Visual com Informações Completas**

Quando limite atingido:
- ✅ Ícone de alerta vermelho
- ✅ Título claro: "Limite de pedidos atingido"
- ✅ Barra de progresso: 50/50 (100%)
- ✅ Descrição do problema
- ✅ **Sugestão de plano específico** (Profissional ou Enterprise)
- ✅ Benefícios do upgrade
- ✅ Preço do plano sugerido
- ✅ Botão direto "Ver Planos e Fazer Upgrade"

### 3️⃣ **Interceptação Automática de 403**

```ts
// Cliente HTTP customizado
await ApiClient.post('/api/pedidos/criar', data)
// Se retornar 403 com LIMITE_ATINGIDO → abre modal automaticamente
```

### 4️⃣ **Resposta API Enriquecida**

```json
HTTP 403 Forbidden
{
  "error": "LIMITE_ATINGIDO",
  "tipo": "pedidos",
  "mensagem": "Limite de pedidos atingido",
  "descricao": "Você já criou 50/50 pedidos este mês...",
  "detalhes": {
    "usado": 50,
    "limite": 50,
    "percentual": 100
  },
  "action_required": "upgrade",
  "upgrade_url": "/configuracoes/planos",
  "sugestao_plano": "PROFISSIONAL"
}
```

### 5️⃣ **Alertas Proativos (80% do limite)**

Componente `<AlertaLimitePedidos />` mostra:
- ⚠️ Alerta laranja quando atinge 80%
- 🚨 Alerta vermelho quando atinge 100%
- Barra de progresso visual
- Botão de upgrade

---

## 📦 Componentes Criados

1. **`ModalLimiteAtingido`** - Modal visual bonito
2. **`ProviderLimite`** - Provider global que escuta eventos
3. **`useVerificarLimite`** - Hook para validação prévia
4. **`ApiClient`** - Cliente HTTP com interceptação
5. **`AlertaLimitePedidos`** - Alerta proativo no dashboard

---

## 🎯 Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| UX | Erro genérico | Modal visual explicativo |
| Timing | Erro após tentar criar | Validação prévia |
| Informação | Só mensagem de erro | Uso, limite, percentual, sugestão |
| Ação | Usuário perdido | Botão direto para upgrade |
| Conversão | Baixa | Alta (path claro) |

---

## 🔄 Fluxos

### Fluxo 1: Validação Prévia (Recomendado)
```
Usuário clica "Novo Pedido"
  ↓
Hook verifica limite via API
  ↓
Se OK → navega para /pedidos/novo
Se BLOQUEADO → abre modal de upgrade
```

### Fluxo 2: Interceptação de 403
```
Form submete POST /api/pedidos/criar
  ↓
API valida limite no middleware
  ↓
Se OK → cria pedido
Se BLOQUEADO → retorna 403 enriquecido
  ↓
ApiClient intercepta → abre modal
```

### Fluxo 3: Alerta Proativo
```
Dashboard carrega
  ↓
<AlertaLimitePedidos /> verifica uso
  ↓
Se < 80% → nada
Se 80-99% → alerta laranja
Se 100% → alerta vermelho
```

---

## 📝 Como Usar

### Em qualquer botão de criação:
```tsx
import { useVerificarLimite } from '@/hooks/use-verificar-limite'

const { verificarAntesDeCriar } = useVerificarLimite()

<Button onClick={() => {
  verificarAntesDeCriar('pedidos', () => {
    // Sua lógica aqui (só executa se dentro do limite)
  })
}}>
  Criar
</Button>
```

### Em APIs (validação server-side):
```ts
import { validarLimitePedidosMiddleware } from '@/lib/middleware/validar-limites'

export async function POST(request: Request) {
  const limiteError = await validarLimitePedidosMiddleware(tenantId)
  if (limiteError) return limiteError // Retorna 403 enriquecido
  
  // Continua criando...
}
```
