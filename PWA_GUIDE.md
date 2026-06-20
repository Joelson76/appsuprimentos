# 📱 Guia do PWA - SupriFlow

## 🎉 O SupriFlow agora é um Progressive Web App (PWA)!

### ✨ Benefícios

- **📱 Instalável** - Pode ser instalado no celular e desktop
- **⚡ Rápido** - Carrega instantaneamente
- **📴 Offline** - Funciona mesmo sem internet
- **🔔 Notificações** - Receba alertas importantes
- **🚀 Experiência nativa** - Parece um app de verdade

---

## 🔧 Como Funciona

### Arquivos Principais

1. **`public/manifest.json`** - Configuração do app
   - Nome, ícones, cores, atalhos
   - Shortcuts para ações rápidas
   - Configuração de compartilhamento

2. **`public/sw.js`** - Service Worker
   - Cache de arquivos
   - Funcionamento offline
   - Sincronização em background
   - Push notifications

3. **`components/pwa/install-prompt.tsx`** - Prompt de instalação
   - Detecta se pode instalar
   - Mostra instruções para iOS
   - Botão de instalação para Android/Desktop

4. **`components/pwa/service-worker-register.tsx`** - Registro do SW
   - Registra o service worker
   - Detecta atualizações
   - Notifica nova versão

---

## 📱 Como Instalar

### Android (Chrome)

1. Acesse https://appsuprimentosnao.vercel.app
2. Um banner aparecerá na tela: "Instalar SupriFlow"
3. Clique em **"Instalar Agora"**
4. Pronto! O app estará na sua tela inicial

**OU:**

1. Menu (⋮) > "Instalar app" ou "Adicionar à tela inicial"

### iOS (Safari)

1. Acesse https://appsuprimentos.vercel.app
2. Toque no ícone de **compartilhar** (□↑)
3. Role para baixo
4. Toque em **"Adicionar à Tela de Início"**
5. Toque em **"Adicionar"**
6. Pronto! O app estará na sua tela inicial

### Desktop (Chrome/Edge)

1. Acesse https://appsuprimentos.vercel.app
2. Procure o ícone de instalação (⊕) na barra de endereço
3. Clique em **"Instalar"**
4. O app abrirá em janela própria

---

## 🎯 Recursos Disponíveis

### ⚡ Atalhos (App Shortcuts)

Pressione e segure o ícone do app para ver atalhos rápidos:

- 📝 **Nova Requisição** - Criar requisição de compra
- 📦 **Estoque** - Ver produtos em estoque
- 📊 **Dashboard** - Painel principal

### 📴 Modo Offline

O app funciona offline com as seguintes limitações:

✅ **Funciona offline:**
- Visualizar páginas já visitadas
- Ver dados em cache
- Interface completa carregada

❌ **Requer internet:**
- Buscar novos dados do Supabase
- Criar/editar registros
- Enviar e-mails
- Gerar relatórios

### 🔔 Notificações Push

O sistema está preparado para enviar notificações push sobre:

- ✅ Requisição aprovada/rejeitada
- 📧 Nova cotação recebida
- ⚠️ Estoque baixo
- 💳 Fatura próxima do vencimento

*(Implementação futura via Supabase Realtime + Push API)*

---

## 🧪 Como Testar Localmente

### 1. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

### 2. Abrir DevTools

Pressione **F12** e vá em **Application**

### 3. Verificar Manifest

- Application > Manifest
- Confira nome, ícones, cores
- Veja os app shortcuts

### 4. Verificar Service Worker

- Application > Service Workers
- Status deve estar "activated and is running"
- Teste indo offline: Network > Offline

### 5. Testar Instalação

- Application > Manifest > "Add to homescreen"
- Ou use o banner que aparece

---

## 🚀 Deploy para Produção

### Vercel (Automático)

```bash
git add -A
git commit -m "feat: add PWA support"
git push origin master
```

O Vercel detecta automaticamente:
- ✅ `manifest.json`
- ✅ `sw.js` servido corretamente
- ✅ HTTPS habilitado (obrigatório para PWA)

### Testar em Produção

1. Acesse: https://appsuprimentos.vercel.app
2. Abra DevTools > Application
3. Verifique se Service Worker está ativo
4. Teste instalação

---

## 📊 Estratégia de Cache

### Network First

```
1. Tenta buscar da rede (internet)
2. Se falhar, busca do cache
3. Se não tiver no cache, mostra página offline
```

**Por quê?**
- Sempre mostra dados mais recentes
- Fallback para cache se offline
- Experiência fluida

### Cache Runtime

Páginas visitadas são automaticamente cacheadas:
- `/dashboard`
- `/requisicoes`
- `/estoque`
- `/cotacoes`
- etc.

### Cache Estático

Arquivos sempre em cache:
- `/` (homepage)
- `/login`
- `/manifest.json`

**Nota:** A página offline é gerada dinamicamente pelo Service Worker quando necessário (não precisa estar em cache).

---

## 🔄 Atualizações do App

### Detecção Automática

O service worker verifica atualizações a cada hora.

Quando há nova versão:
1. Baixa em background
2. Mostra notificação: "Nova versão disponível"
3. Usuário clica em "Recarregar"
4. App atualiza

### Forçar Atualização

```bash
# No DevTools
Application > Service Workers > Update
```

---

## 🎨 Personalização

### Mudar Cores

Edite `public/manifest.json`:

```json
{
  "theme_color": "#667eea",
  "background_color": "#ffffff"
}
```

### Mudar Ícones

1. Substitua os arquivos em `public/icon-*.png`
2. Ou edite `scripts/generate-pwa-icons.js`
3. Execute: `node scripts/generate-pwa-icons.js`

### Adicionar Shortcuts

Edite `public/manifest.json`:

```json
{
  "shortcuts": [
    {
      "name": "Nova Funcionalidade",
      "url": "/nova-funcionalidade",
      "icons": [...]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Service Worker não registra

1. Verifique HTTPS (obrigatório)
2. Abra DevTools > Console
3. Procure erros `[SW]`
4. Verifique `public/sw.js` existe

### App não oferece instalação

1. Já está instalado?
2. HTTPS habilitado?
3. Manifest válido? (DevTools > Application > Manifest)
4. Ícones corretos?

### Página offline não aparece

1. Certifique-se que o Service Worker está ativo (DevTools > Application > Service Workers)
2. Teste acessando qualquer página enquanto offline
3. A página offline será gerada automaticamente pelo Service Worker

### Cache antigo não atualiza

1. DevTools > Application > Clear storage
2. Marque "Unregister service workers"
3. Clear site data
4. Recarregue

---

## 📈 Métricas e Analytics

### Verificar Instalações

Use Google Analytics 4 com eventos customizados:

```javascript
// Quando usuário instala
window.addEventListener('appinstalled', () => {
  gtag('event', 'app_installed', {
    method: 'pwa'
  })
})
```

### Lighthouse PWA Score

```bash
# Testar performance PWA
npx lighthouse https://appsuprimentos.vercel.app --view
```

Metas:
- ✅ PWA Score: 100
- ✅ Performance: 90+
- ✅ Accessibility: 95+

---

## 🎯 Próximos Passos

1. ✅ **Notificações Push** - Implementar com Supabase Realtime
2. ✅ **Background Sync** - Sincronizar dados ao voltar online
3. ✅ **Periodic Sync** - Buscar atualizações automaticamente
4. ✅ **Share Target** - Receber compartilhamentos de outros apps
5. ✅ **Web Share API** - Compartilhar requisições/pedidos

---

## 📚 Referências

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Next.js PWA](https://ducanh-next-pwa.vercel.app/)
- [PWA Builder](https://www.pwabuilder.com/)

---

🎉 **SupriFlow é agora um PWA completo!**

Teste, instale e aproveite a experiência mobile! 📱✨
