# Skills Personalizadas Instaladas

## 📦 Novas Skills Adicionadas

Instalei **5 skills personalizadas** do diretório `C:\Users\admin\Downloads\skill`:

---

## ✅ Skills Instaladas

### 1. **brainstorming**
**Localização:** `.claude/skills/brainstorming/`

**Descrição:**
Skill para explorar ideias antes de implementar. DEVE ser usada antes de qualquer trabalho criativo - criar features, componentes, ou modificar comportamento.

**Quando usar:**
- Antes de criar novas funcionalidades
- Antes de adicionar componentes
- Antes de modificar comportamento do sistema
- Qualquer trabalho criativo/design

**Fluxo:**
1. Explorar contexto do projeto
2. Fazer perguntas de esclarecimento
3. Propor 2-3 abordagens
4. Apresentar design
5. Escrever doc de design
6. Transição para implementação

**Comando:** `/brainstorming`

---

### 2. **copywriting**
**Localização:** `.claude/skills/copywriting/`

**Descrição:**
Expert em escrita de copy para marketing e conversão. Cria textos persuasivos para páginas web.

**Quando usar:**
- Escrever/reescrever copy de páginas
- Headlines e CTAs
- Value propositions
- Taglines e subheadlines
- Hero sections
- Descrições de produto

**Lê automaticamente:** `.agents/product-marketing.md` (contexto do produto)

**Comando:** `/copywriting`

**Nota:** Esta skill SOBRESCREVE a que já estava instalada (do marketingskills). A versão personalizada tem prioridade.

---

### 3. **frontend-design**
**Localização:** `.claude/skills/frontend-design/`

**Descrição:**
Cria interfaces frontend distintivas e de alta qualidade. Evita estética genérica de IA.

**Quando usar:**
- Construir componentes web
- Criar páginas completas
- Desenvolver aplicações frontend
- Precisa de design polido e profissional

**Características:**
- Production-grade
- Design único (não genérico)
- Alta qualidade visual
- Código limpo e estruturado

**Comando:** `/frontend-design`

---

### 4. **landing-page**
**Localização:** `.claude/skills/landing-page/`

**Descrição:**
Cria landing pages de alta conversão com design excepcional. Combina elementos de conversão com qualidade visual.

**Quando usar:**
- Criar landing pages
- Otimizar páginas de conversão
- Construir páginas de produto
- Precisa de design memorável + conversão

**Framework:**
- 11 elementos essenciais de conversão
- Next.js 14+ e ShadCN UI
- Evita estética genérica de IA
- Foco em design único

**Comando:** `/landing-page`

**Diferença para marketing-skills:**
- Esta é versão v2 (mais avançada)
- Foco em design único (não template)
- Framework de 11 elementos estruturados

---

### 5. **web-asset-generator**
**Localização:** `.claude/skills/web-asset-generator/`

**Descrição:**
Gera assets web como favicons, ícones de app (PWA), e imagens para redes sociais (Open Graph).

**Quando usar:**
- Gerar favicons
- Criar ícones de app/PWA
- Imagens para compartilhamento social
- Meta images (Facebook, Twitter, LinkedIn, WhatsApp)
- Open Graph images

**Funcionalidades:**
- Redimensionamento de imagens
- Text-to-image
- Múltiplos tamanhos automaticamente
- Meta tags HTML prontas

**Comando:** `/web-asset-generator`

**Uso prático:**
```
"Gerar favicon do logo da JLS Tecnologia"
"Criar Open Graph image para SupriFlow"
"Preciso de ícones PWA em todos os tamanhos"
```

---

## 🔄 Skills que Sobrescreveram Existentes

### copywriting (sobrescrita)
- **Antes:** Marketing Skills v2.3.0 (genérica)
- **Agora:** Versão personalizada (mais específica)
- **Localização:** `.claude/skills/copywriting/SKILL.md`

**Por que manter a personalizada:**
A versão personalizada pode ter ajustes específicos para o projeto. Se quiser voltar para a do marketingskills:
```bash
# Restaurar versão original
rm -rf .claude/skills/copywriting
cp -r marketingskills-source/skills/copywriting .claude/skills/
```

---

## 📁 Estrutura Completa de Skills

```
.claude/skills/
├── ab-testing/              [Marketing Skills]
├── ad-creative/             [Marketing Skills]
├── ads/                     [Marketing Skills]
├── ai-seo/                  [Marketing Skills]
├── analytics/               [Marketing Skills]
├── brainstorming/           [✨ NOVA - Personalizada]
├── churn-prevention/        [Marketing Skills]
├── co-marketing/            [Marketing Skills]
├── cold-email/              [Marketing Skills]
├── community-marketing/     [Marketing Skills]
├── competitor-profiling/    [Marketing Skills]
├── competitors/             [Marketing Skills]
├── content-strategy/        [Marketing Skills]
├── copy-editing/            [Marketing Skills]
├── copywriting/             [✨ SOBRESCRITA - Personalizada]
├── cro/                     [Marketing Skills]
├── customer-research/       [Marketing Skills]
├── directory-submissions/   [Marketing Skills]
├── emails/                  [Marketing Skills]
├── free-tools/              [Marketing Skills]
├── frontend-design/         [✨ NOVA - Personalizada]
├── image/                   [Marketing Skills]
├── landing-page/            [✨ NOVA - Personalizada]
├── launch/                  [Marketing Skills]
├── lead-magnets/            [Marketing Skills]
├── marketing-ideas/         [Marketing Skills]
├── marketing-plan/          [Marketing Skills]
├── marketing-psychology/    [Marketing Skills]
├── onboarding/              [Marketing Skills]
├── paywalls/                [Marketing Skills]
├── popups/                  [Marketing Skills]
├── pricing/                 [Marketing Skills]
├── product-marketing/       [Marketing Skills]
├── programmatic-seo/        [Marketing Skills]
├── prospecting/             [Marketing Skills]
├── referrals/               [Marketing Skills]
├── revops/                  [Marketing Skills]
├── sales-enablement/        [Marketing Skills]
├── schema/                  [Marketing Skills]
├── seo-audit/               [Marketing Skills]
├── signup/                  [Marketing Skills]
├── site-architecture/       [Marketing Skills]
├── sms/                     [Marketing Skills]
├── social/                  [Marketing Skills]
├── video/                   [Marketing Skills]
└── web-asset-generator/     [✨ NOVA - Personalizada]

Total: 49 skills (44 Marketing + 5 Personalizadas)
```

---

## 🎯 Como Usar as Novas Skills

### Exemplo 1: Criar Nova Feature
```
Usuário: "Quero adicionar dashboard de analytics"

Claude: [Invoca /brainstorming automaticamente]
         ↓
         1. Explora contexto
         2. Faz perguntas
         3. Propõe abordagens
         4. Apresenta design
         5. Escreve spec
         6. Transição para implementação
```

### Exemplo 2: Melhorar Landing Page
```
Usuário: "Melhorar landing page de trial"

Opção A: /landing-page (design + conversão completos)
Opção B: /copywriting (só melhorar textos)
Opção C: /cro (só otimizar conversão)
Opção D: /frontend-design (só design visual)
```

### Exemplo 3: Gerar Assets
```
Usuário: "Preciso de favicon e Open Graph image"

Claude: /web-asset-generator
         ↓
         Gera:
         - favicon.ico (16x16, 32x32, 48x48)
         - apple-touch-icon.png (180x180)
         - og-image.png (1200x630)
         - Meta tags HTML prontas
```

---

## 🔧 Gerenciamento de Skills

### Ver todas as skills instaladas:
```bash
ls .claude/skills/
```

### Verificar uma skill específica:
```bash
cat .claude/skills/brainstorming/SKILL.md | head -20
```

### Remover uma skill:
```bash
rm -rf .claude/skills/nome-da-skill
```

### Adicionar novas skills:
```bash
# Criar diretório
mkdir -p .claude/skills/nome-da-skill

# Copiar SKILL.md
cp /caminho/SKILL.md .claude/skills/nome-da-skill/
```

---

## 📖 Ordem de Prioridade

Quando há skills duplicadas (como `copywriting`), Claude usa:

1. **Skills locais** (`.claude/skills/`) - PRIORIDADE
2. **Skills globais** (se configurado)
3. **Skills do sistema**

Por isso a versão personalizada de `copywriting` sobrescreve a do marketingskills.

---

## 💡 Dicas de Uso

### 1. Brainstorming é Obrigatório
A skill `brainstorming` deve ser usada ANTES de qualquer implementação criativa. Ela força você a:
- Pensar antes de codificar
- Explorar alternativas
- Documentar decisões
- Evitar retrabalho

### 2. Combine Skills
Você pode usar múltiplas skills em sequência:
```
1. /brainstorming (design da feature)
2. /frontend-design (implementar UI)
3. /copywriting (melhorar textos)
4. /cro (otimizar conversão)
```

### 3. Product Marketing Context
As skills de marketing SEMPRE lêem `.agents/product-marketing.md` primeiro. Mantenha atualizado!

### 4. Use para Inspiração
Mesmo que não invoque a skill explicitamente, pode pedir:
```
"Seguindo princípios da skill frontend-design, 
 crie um componente de card de produto único"
```

---

## 🐛 Troubleshooting

### Skill não está sendo reconhecida
```bash
# Verificar se existe
ls -la .claude/skills/nome-da-skill/SKILL.md

# Verificar conteúdo (deve ter frontmatter)
head -10 .claude/skills/nome-da-skill/SKILL.md
```

### Skill duplicada (conflito)
Se duas skills têm o mesmo `name:` no frontmatter:
1. A local (`.claude/skills/`) tem prioridade
2. Renomeie uma delas se quiser ambas

### Skill não funciona
1. Verificar frontmatter (YAML válido)
2. Verificar se `name:` e `description:` existem
3. Reiniciar Claude Code (se necessário)

---

## 📝 Próximos Passos Sugeridos

### 1. Testar Brainstorming
```
"Quero adicionar sistema de notificações push"
[Deixar brainstorming guiar o processo]
```

### 2. Recriar Landing Page
```
/landing-page

"Recriar landing page do SupriFlow com design único"
[Skill vai criar algo memorável, não template genérico]
```

### 3. Gerar Assets Profissionais
```
/web-asset-generator

"Gerar todos os assets web do SupriFlow:
 - Favicon
 - Apple touch icon
 - Open Graph images
 - Meta tags"
```

### 4. Melhorar Copy Existente
```
/copywriting

"Melhorar copy da seção de benefícios da landing page"
[Skill vai consultar product-marketing.md automaticamente]
```

---

**Instalado em:** 2026-06-29  
**Total de skills:** 5 personalizadas + 44 marketing = 49 skills  
**Status:** ✅ Todas instaladas e funcionais
