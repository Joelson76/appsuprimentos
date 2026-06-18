# Componente Logo - SupriFlow

## 📋 Uso

A logo JLS Tecnologia está integrada em todo o sistema através de componentes reutilizáveis.

## 🎨 Componentes Disponíveis

### 1. Logo Completa (com texto)

```tsx
import { Logo } from '@/components/logo'

// Uso básico
<Logo />

// Tamanhos disponíveis
<Logo size="sm" />   // 32x32px
<Logo size="md" />   // 50x50px (padrão)
<Logo size="lg" />   // 70x70px
<Logo size="xl" />   // 100x100px

// Sem tagline "by JLS Tecnologia"
<Logo showTagline={false} />

// Apenas imagem, sem texto
<Logo showText={false} />

// Com className customizada
<Logo className="my-4" />
```

### 2. Logo Icon (apenas imagem)

```tsx
import { LogoIcon } from '@/components/logo'

<LogoIcon size="md" />
```

## 📍 Onde a Logo Está Implementada

### Landing Page (`app/page.tsx`)
- ✅ Header: Logo + SupriFlow + tagline
- ✅ Footer: Logo + SupriFlow + tagline + copyright

### Página de Login (`app/(auth)/login/page.tsx`)
- ✅ Card header: Logo (80px) + título + tagline

### Página de Cadastro (`app/(auth)/cadastro/page.tsx`)
- ✅ Card header: Logo (70px) + título + tagline

### Apresentações Externas
- ✅ `APRESENTACAO_SUPRIFLOW.html` - header e footer
- ✅ `EMAIL_APRESENTACAO.html` - header e footer
- ✅ `APRESENTACAO_SUPRIFLOW.md` - topo e rodapé

## 🎨 Identidade Visual

### Logo
- **Arquivo:** `public/logo-jls.jpg`
- **Formato:** PNG com transparência
- **Cores:** Azul/Teal (#2C5F6F)
- **Tamanho:** 1892KB (alta resolução)

### Marca
- **Produto:** SupriFlow
- **Empresa:** JLS Tecnologia
- **Tagline:** "by JLS Tecnologia"
- **Cores do Gradiente:** `from-blue-600 to-cyan-500`

### Copyright
```
© 2026 JLS Tecnologia - SupriFlow. Todos os direitos reservados.
```

## 🔧 Próximas Implementações Sugeridas

Para integrar a logo em todo o dashboard:

### 1. Sidebar do Dashboard
```tsx
// components/dashboard/sidebar.tsx
import { Logo } from '@/components/logo'

<aside>
  <Logo size="sm" />
  {/* resto do menu */}
</aside>
```

### 2. Header do Dashboard
```tsx
// components/dashboard/header.tsx
import { LogoIcon } from '@/components/logo'

<header>
  <LogoIcon size="sm" />
  {/* resto do header */}
</header>
```

### 3. Emails do Sistema
```tsx
// lib/email/templates/base.tsx
import { Logo } from '@/components/logo'

// Usar nos templates de email
<Logo size="md" />
```

### 4. Páginas de Erro (404, 500)
```tsx
// app/error.tsx, app/not-found.tsx
import { Logo } from '@/components/logo'

<div className="text-center">
  <Logo size="lg" />
  <h1>Página não encontrada</h1>
</div>
```

### 5. Loading States
```tsx
// components/loading.tsx
import { LogoIcon } from '@/components/logo'

<div className="flex items-center justify-center">
  <LogoIcon size="lg" className="animate-pulse" />
</div>
```

## 📝 Notas Técnicas

1. **Next.js Image Component**: Usa `next/image` para otimização automática
2. **Priority Loading**: Logo marcada como `priority` para carregar primeiro
3. **Responsive**: Tamanhos adaptativos via props
4. **Acessibilidade**: Alt text apropriado em todas as imagens
5. **Performance**: Imagem otimizada e com cache

## 🎯 Checklist de Branding

- [x] Landing page
- [x] Login
- [x] Cadastro
- [x] Apresentações externas
- [x] Componente reutilizável criado
- [ ] Dashboard sidebar
- [ ] Dashboard header
- [ ] Emails transacionais
- [ ] Páginas de erro
- [ ] Loading states
- [ ] Documentos PDF gerados
- [ ] Relatórios exportados

## 🔄 Atualizar Logo

Para substituir a logo no futuro:

1. Substituir arquivo `public/logo-jls.jpg`
2. Manter mesmo nome ou atualizar imports
3. Recomendado: PNG transparente, ~300x150px
4. Testar em todos os tamanhos (sm, md, lg, xl)

---

**Desenvolvido com ❤️ por JLS Tecnologia**
