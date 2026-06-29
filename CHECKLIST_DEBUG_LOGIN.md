# 🔍 CHECKLIST DEBUG - Login Não Funciona

## Por favor, responda estas perguntas:

### 1. O que acontece EXATAMENTE quando clica "Entrar"?

Marque a opção:

**A) Botão não responde**
```
[ ] Clico em "Entrar" e nada acontece
[ ] Botão não muda para "Entrando..."
```

**B) Botão responde mas mostra erro**
```
[ ] Botão fica "Entrando..."
[ ] Mostra mensagem vermelha: "E-mail ou senha inválidos"
```

**C) Botão funciona mas fica no login**
```
[ ] Botão fica "Entrando..."
[ ] Depois volta para "Entrar"
[ ] Sem mensagem de erro
[ ] Fica na página de login
```

**D) Redireciona mas volta**
```
[ ] Vai para /dashboard rapidamente
[ ] Depois volta para /login
[ ] Loop entre páginas
```

### 2. DevTools (F12)

**Console (aba Console):**
```
[ ] Abri DevTools (F12)
[ ] Tem erro em vermelho?
[ ] Qual erro? _________________
```

**Network (aba Network):**
```
[ ] Filtrei por "auth"
[ ] Tem requisição para Supabase?
[ ] Status: _____ (200? 400? 500?)
```

### 3. Está testando onde?

```
[ ] Local (npm run dev - http://localhost:3000)
[ ] Vercel (https://xxx.vercel.app)
```

### 4. As credenciais estão corretas?

```
[ ] Sim, tenho certeza (já logou antes)
[ ] Não tenho certeza
[ ] É a primeira vez tentando logar
```

### 5. Já limpou o cache?

```
[ ] Sim, limpei completamente
[ ] Não, ainda não limpei
```

---

## Testes Rápidos

### Teste 1: Credencial Errada de Propósito

```
Tente fazer login com:
Email: teste@errado.com
Senha: 123456

Resultado:
[ ] Mostra "E-mail ou senha inválidos" ✅ (login funciona, credencial que está errada)
[ ] Nada acontece ❌ (login não está funcionando)
```

### Teste 2: DevTools Network

```
1. F12 → Aba Network
2. Marcar "Preserve log"
3. Tentar login
4. Procurar requisição com "auth" ou "signIn"

Aparece alguma requisição?
[ ] Sim, Status: _____
[ ] Não aparece nenhuma
```

### Teste 3: Console Errors

```
1. F12 → Aba Console
2. Limpar (ícone 🚫)
3. Tentar login
4. Aparece erro?

[ ] Sim: ________________
[ ] Não
```

---

## Screenshots Úteis

Se possível, tire print de:

1. **Página de login** (após clicar Entrar)
2. **Console (F12)** (se tiver erro)
3. **Network (F12)** (requisições)

---

Me responda essas perguntas para eu descobrir o problema exato! 🔍
