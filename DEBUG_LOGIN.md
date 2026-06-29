# 🔍 DEBUG - Login Não Funciona

## Informações Necessárias

Para descobrir o problema, preciso saber:

### 1. O que acontece quando clica "Entrar"?

**Opção A:**
```
- Botão fica "Entrando..."
- Depois volta para "Entrar"
- Fica na página de login
- Mostra mensagem de erro?
```

**Opção B:**
```
- Botão fica "Entrando..."
- Página pisca/recarrega
- Volta para login
- Sem mensagem de erro
```

**Opção C:**
```
- Botão fica "Entrando..." eternamente
- Nunca termina
- Trava no loading
```

### 2. Abrir DevTools (F12)

**Console (aba Console):**
```
- Tem algum erro em vermelho?
- Copiar e me mostrar
```

**Network (aba Network):**
```
- Clicar em "Entrar"
- Ver requisições que aparecem
- Procurar por "signInWithPassword"
- Status: 200 (sucesso) ou 400/500 (erro)?
```

### 3. Credenciais

**As credenciais estão corretas?**
```
- Email cadastrado
- Senha correta
```

**Testar com credencial errada:**
```
- Mostra "E-mail ou senha inválidos"?
```

---

## Possíveis Causas

### 1. Login Funciona mas Redirect Não

**Sintoma:**
- Botão fica "Entrando..."
- Depois volta para "Entrar"
- Sem mensagem de erro

**Causa:**
- Login OK no Supabase
- router.push('/dashboard') não funciona
- OU dashboard redireciona de volta

### 2. Login Falha

**Sintoma:**
- Mostra "E-mail ou senha inválidos"

**Causa:**
- Credenciais erradas
- OU problema no Supabase Auth

### 3. Erro de Código

**Sintoma:**
- Erro no console (F12)
- Requisição falha (Network)

**Causa:**
- Problema no código
- Problema na API

---

## Como Debugar

### Passo 1: DevTools

```
1. F12 (abrir DevTools)
2. Aba "Console"
3. Limpar console (ícone 🚫)
4. Tentar fazer login
5. Ver se aparece erro
6. Copiar erro e me mostrar
```

### Passo 2: Network

```
1. F12 → Aba "Network"
2. Marcar "Preserve log"
3. Tentar fazer login
4. Procurar requisição "signInWithPassword"
5. Clicar nela
6. Ver "Response" 
7. Me mostrar o que aparece
```

### Passo 3: Application

```
1. F12 → Aba "Application"
2. Storage → Cookies
3. Procurar cookies do Supabase
4. Existem?
```

---

## Fix Rápido - Testar Localmente

Se quiser testar local primeiro:

```bash
# Terminal
npm run dev

# Abrir
http://localhost:3000

# Fazer login
# Ver se funciona local
```

---

Me envie as informações acima para eu descobrir o problema exato! 🔍
