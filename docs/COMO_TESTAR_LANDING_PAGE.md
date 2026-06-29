# Como Testar a Landing Page de Trial

## 🚀 Quick Start

### 1. Servidor já está rodando!
```
✅ Next.js Server: http://localhost:3000
```

### 2. Acesse a Landing Page de Trial
```
URL: http://localhost:3000/trial
```

## ✅ Checklist de Teste

### Teste Visual (5 minutos)

**Desktop (Tela Grande)**
- [ ] Abra: http://localhost:3000/trial
- [ ] Verifique se o header aparece corretamente (logo + botão "Entrar")
- [ ] Leia o headline: "Reduza 20% dos custos de compras em 60 dias"
- [ ] Veja se o badge aparece: "✅ Usado por +50 indústrias..."
- [ ] Confira os 4 benefits bullets com ícones verdes
- [ ] Formulário à direita deve ter 4 campos
- [ ] Scroll para baixo e veja as 3 seções de benefícios (cards)
- [ ] FAQ deve ter 6 perguntas (clique para expandir)
- [ ] Banner azul/roxo no final com CTA

**Mobile (Tela Pequena)**
- [ ] Abra DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Selecione "iPhone 12 Pro" ou "Pixel 5"
- [ ] Recarregue a página
- [ ] Formulário deve aparecer ABAIXO do texto (não ao lado)
- [ ] Botões devem ser grandes e fáceis de tocar
- [ ] Scroll suave e legível

### Teste de Interação (3 minutos)

**Formulário**
- [ ] Clique no campo "Nome completo" → Digite seu nome
- [ ] Clique no campo "E-mail corporativo" → Digite um e-mail
- [ ] Clique no campo "Empresa" → Digite nome de empresa
- [ ] Campo "Telefone" é opcional → Pode deixar vazio
- [ ] Clique no botão "Iniciar teste grátis por 14 dias"
- [ ] Abra o Console (F12 → Console)
- [ ] Deve aparecer: `Trial signup: {nome: "...", email: "...", ...}`

**FAQ (Perguntas Frequentes)**
- [ ] Scroll até a seção "Perguntas frequentes"
- [ ] Clique em "O que está incluído no teste gratuito?"
- [ ] Pergunta deve expandir mostrando a resposta
- [ ] Clique novamente para fechar
- [ ] Teste todas as 6 perguntas

**CTAs (Calls to Action)**
- [ ] Clique no botão final "Começar teste grátis agora"
- [ ] Deve fazer scroll automático para o topo (formulário)

### Teste de Responsividade (2 minutos)

**Abra DevTools (F12) → Responsive Mode**

Teste nos seguintes tamanhos:
- [ ] **Desktop Large**: 1920x1080 → Tudo centralizado, espaçamento amplo
- [ ] **Laptop**: 1366x768 → Layout 2 colunas funciona
- [ ] **Tablet**: 768x1024 → Form abaixo do texto
- [ ] **Mobile Large**: 414x896 (iPhone 11) → Cards empilhados
- [ ] **Mobile Small**: 375x667 (iPhone SE) → Tudo legível

### Teste de Performance (1 minuto)

**Lighthouse Audit**
- [ ] Abra DevTools (F12) → Tab "Lighthouse"
- [ ] Selecione "Desktop" e "Performance"
- [ ] Clique "Analyze page load"
- [ ] Score esperado: 90+ (verde)

### Teste de Acessibilidade (1 minuto)

- [ ] **Tab Navigation**: Pressione TAB várias vezes
  - Deve navegar pelos campos do form em ordem lógica
  - Botões devem ter foco visível
- [ ] **Labels**: Cada campo tem label clara acima
- [ ] **Contraste**: Texto legível (slate-900 em fundo claro)

## 🐛 Problemas Comuns e Soluções

### Problema: Página não carrega
**Solução:**
```bash
# Verifique se o servidor está rodando
# Deve ver: "Ready in X.Xs"
# Se não estiver, reinicie:
npm run dev
```

### Problema: Formulário não envia
**Solução:**
```
Isso é NORMAL! O formulário ainda não está conectado à API.
Por enquanto, apenas loga no console (F12 → Console).
```

### Problema: Estilos quebrados
**Solução:**
```bash
# Limpe o cache do Next.js
rm -rf .next
npm run dev
```

### Problema: Erro de TypeScript
**Solução:**
```bash
# Verifique se os componentes UI existem
ls components/ui/button.tsx
ls components/ui/input.tsx
ls components/ui/label.tsx

# Se não existirem, rode:
npx shadcn-ui@latest add button input label
```

## 📸 Screenshots Recomendados

Tire screenshots para documentação:

1. **Hero Section (above the fold)**
   - Desktop: Headline + Form lado a lado
   - Mobile: Headline em cima, Form embaixo

2. **Benefits Section**
   - 3 cards com ícones

3. **FAQ Section**
   - Perguntas expandidas

4. **Final CTA**
   - Banner azul/roxo gradiente

## 🎨 Customizações Rápidas

Se quiser testar variações:

### Mudar Headline
Edite: `app/trial/page.tsx` linha ~56
```tsx
<h1 className="...">
  Sua nova headline aqui
</h1>
```

### Mudar CTA Button Text
Edite: `app/trial/page.tsx` linha ~158
```tsx
<Button ...>
  Seu novo texto aqui
</Button>
```

### Mudar Cores do Gradiente
Edite: `app/trial/page.tsx` linha ~158
```tsx
className="... from-blue-600 to-purple-600"
// Mude para:
className="... from-green-600 to-teal-600"
```

## 🧪 Teste A/B Manual

Para testar diferentes headlines:

1. **Copie o arquivo**
```bash
cp app/trial/page.tsx app/trial-variant-b/page.tsx
```

2. **Mude a headline no variant B**

3. **Acesse:**
   - Variant A: http://localhost:3000/trial
   - Variant B: http://localhost:3000/trial-variant-b

4. **Compare** qual prefere

## 📊 Métricas para Observar (Quando em Produção)

Quando conectar analytics:

**Micro-conversões:**
- Quantos scrollam 50% da página
- Quantos clicam no CTA
- Quantos começam a preencher o form

**Macro-conversão:**
- Quantos submetem o formulário
- Taxa de conversão final: Visitantes → Trials

**Meta:** 15-25% de conversão (visitantes → trials)

## 🔧 Próximos Passos Após Teste Visual

Após confirmar que está tudo OK visualmente:

1. **Conectar com API**
   - Criar endpoint `/api/trial/create`
   - Conectar form submit com API

2. **Adicionar Validação**
   - react-hook-form + zod
   - Validação de e-mail corporativo
   - Validação de CNPJ (se aplicável)

3. **Adicionar Analytics**
   - Google Analytics 4 ou Plausible
   - Eventos: page_view, cta_click, form_submit

4. **Otimizar Performance**
   - Lazy load de imagens
   - Otimizar fonts
   - Comprimir assets

5. **SEO**
   - Meta tags (title, description)
   - Open Graph para social sharing
   - Schema.org markup

## ✅ Teste Completo - Checklist Final

- [ ] Servidor rodando em http://localhost:3000
- [ ] Landing page visível em /trial
- [ ] Layout responsivo (desktop + mobile)
- [ ] Formulário interativo (mesmo sem backend)
- [ ] FAQ expansível funcionando
- [ ] CTAs com scroll funcionando
- [ ] Console mostra dados do form quando submete
- [ ] Sem erros no console do navegador
- [ ] Performance 90+ no Lighthouse

**Se todos os itens acima estão ✅, a landing page está pronta para conectar com a API!**

## 🆘 Precisa de Ajuda?

**Erro no código:**
```bash
# Veja os logs do servidor
npm run dev
# Ou no terminal, procure por erros em vermelho
```

**Quer fazer mudanças:**
- Edite `app/trial/page.tsx`
- Salve (Ctrl+S)
- A página recarrega automaticamente (hot reload)

**Testar em dispositivo real:**
```bash
# Encontre seu IP local
ipconfig

# Acesse de outro dispositivo na mesma rede:
http://SEU_IP:3000/trial
# Exemplo: http://192.168.1.100:3000/trial
```

---

**Criado em:** 2026-06-29  
**Página testada:** `/trial`  
**Status:** ✅ Pronta para teste visual e interação
