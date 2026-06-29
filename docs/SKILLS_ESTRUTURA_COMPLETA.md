# Skills - Estrutura Completa

## 📋 Localizações das Skills

As skills personalizadas agora estão em **DUAS** localizações para garantir compatibilidade:

### 1. `.claude/skills/` (Claude Code - Antigo)
```
.claude/skills/
├── brainstorming/
├── copywriting/            [sobrescrita do marketingskills]
├── frontend-design/
├── landing-page/
└── web-asset-generator/
```

### 2. `.agents/skills/` (Novo Padrão)
```
.agents/skills/
├── brainstorming/
├── frontend-design/
├── landing-page/
└── web-asset-generator/
```

**Nota:** `copywriting` NÃO foi copiada para `.agents/` porque já existe no marketingskills.

---

## ✅ Skills Personalizadas Instaladas (4)

### 1. **brainstorming**
```
Localização:
  - .claude/skills/brainstorming/
  - .agents/skills/brainstorming/
  
Nome no sistema: brainstorming

Invocação: /brainstorming
```

**Descrição:** DEVE ser usada antes de qualquer trabalho criativo - criar features, componentes, ou modificar comportamento.

**Quando usar:**
- Antes de criar features
- Antes de adicionar componentes
- Qualquer design ou arquitetura

---

### 2. **frontend-design**
```
Localização:
  - .claude/skills/frontend-design/
  - .agents/skills/frontend-design/
  
Nome no sistema: frontend-design

Invocação: /frontend-design
```

**Descrição:** Cria interfaces frontend distintivas e de alta qualidade. Evita estética genérica de IA.

**Quando usar:**
- "melhorar design da página"
- "criar componente único"
- "interface profissional"
- "evitar template genérico"

---

### 3. **landing-page**
```
Localização:
  - .claude/skills/landing-page/
  - .agents/skills/landing-page/
  
Nome no sistema: landing-page-guide-v2

Invocação: /landing-page
```

**Descrição:** Cria landing pages de alta conversão com design excepcional.

**Quando usar:**
- "criar landing page"
- "otimizar conversão"
- "página de produto"
- "design memorável + conversão"

---

### 4. **web-asset-generator**
```
Localização:
  - .claude/skills/web-asset-generator/
  - .agents/skills/web-asset-generator/
  
Nome no sistema: web-asset-generator

Invocação: /web-asset-generator
```

**Descrição:** Gera assets web: favicons, ícones PWA, Open Graph images.

**Quando usar:**
- "gerar favicon"
- "criar ícones app"
- "Open Graph image"
- "meta images para social"

---

## 🔄 Skills em Ambos Locais

Para máxima compatibilidade, mantemos as skills em ambos os diretórios:

| Skill | .claude/skills/ | .agents/skills/ | Status |
|-------|----------------|-----------------|--------|
| brainstorming | ✅ | ✅ | Duplicada (OK) |
| frontend-design | ✅ | ✅ | Duplicada (OK) |
| landing-page | ✅ | ✅ | Duplicada (OK) |
| web-asset-generator | ✅ | ✅ | Duplicada (OK) |
| copywriting | ✅ | ❌ | Só em .claude/ |

**Por que duplicar?**
- Claude Code pode ler de `.claude/skills/`
- Outros sistemas podem ler de `.agents/skills/`
- Garante que funciona em qualquer cenário

---

## 📊 Total de Skills no Projeto

```
Marketing Skills (instaladas antes):     44
Skills Personalizadas:                   +4
                                        ----
Total:                                   48 skills

Distribuição:
  - .claude/skills/   → 49 skills (44 marketing + 5 personalizadas)
  - .agents/skills/   → 4 skills (personalizadas apenas)
```

---

## 🎯 Como Invocar Skills

### Método 1: Invocação Direta (Preferido)
```
/brainstorming
/frontend-design
/landing-page
/web-asset-generator
```

### Método 2: Pedir Naturalmente
```
"Melhorar design da página" → invoca frontend-design
"Criar landing page única" → invoca landing-page
"Gerar favicon" → invoca web-asset-generator
"Planejar nova feature" → invoca brainstorming
```

---

## 🔍 Verificar se Skill Foi Reconhecida

### Teste Simples:
```
Você: /frontend-design

Se funcionar: Skill reconhecida ✅
Se erro "Unknown skill": Skill não reconhecida ❌
```

### Teste Após Instalação:
```bash
# Listar skills em ambos locais
ls .claude/skills/
ls .agents/skills/

# Verificar conteúdo
cat .agents/skills/frontend-design/SKILL.md | head -5
```

---

## 🐛 Troubleshooting

### Problema 1: Skill não reconhecida após instalar
**Possíveis causas:**
- Sistema não recarregou as skills
- Formato do SKILL.md incorreto
- Nome da skill não bate com invocação

**Solução:**
```bash
# 1. Verificar que existe
ls .agents/skills/frontend-design/SKILL.md

# 2. Verificar nome no frontmatter
head -5 .agents/skills/frontend-design/SKILL.md
# Deve ter: name: frontend-design

# 3. Tentar invocar
/frontend-design
```

### Problema 2: "Unknown skill: frontend-design"
**Solução:**
1. Verificar que copiou para `.agents/skills/` ✅
2. Reiniciar sessão Claude Code (se aplicável)
3. Tentar pedir naturalmente: "melhorar design usando princípios frontend"

### Problema 3: Skill invocada mas não funciona como esperado
**Solução:**
1. Ler o conteúdo: `cat .agents/skills/frontend-design/SKILL.md`
2. Verificar se description está clara
3. Verificar se há dependências (outras skills)

---

## 📝 Manutenção das Skills

### Atualizar uma Skill:
```bash
# 1. Editar arquivo
nano .agents/skills/frontend-design/SKILL.md

# 2. Copiar para .claude também (manter sincronizado)
cp .agents/skills/frontend-design/SKILL.md .claude/skills/frontend-design/
```

### Adicionar Nova Skill:
```bash
# 1. Criar diretório em ambos locais
mkdir -p .agents/skills/nova-skill
mkdir -p .claude/skills/nova-skill

# 2. Criar SKILL.md com frontmatter
cat > .agents/skills/nova-skill/SKILL.md << EOF
---
name: nova-skill
description: Descrição clara da skill
---

# Conteúdo da skill aqui
EOF

# 3. Copiar para .claude
cp .agents/skills/nova-skill/SKILL.md .claude/skills/nova-skill/
```

### Remover Skill:
```bash
# Remover de ambos locais
rm -rf .agents/skills/nome-skill
rm -rf .claude/skills/nome-skill
```

---

## 🔐 Ordem de Prioridade

Se houver skills com mesmo nome em locais diferentes:

```
1. .agents/skills/         (Prioridade ALTA)
2. .claude/skills/         (Prioridade MÉDIA)
3. ~/.claude/skills/       (Prioridade BAIXA - global)
```

**Exemplo:**
Se existir `copywriting` em:
- `.agents/skills/copywriting/` (versão A)
- `.claude/skills/copywriting/` (versão B)

Claude usará a versão A (`.agents/` tem prioridade).

---

## ✅ Checklist de Instalação

Para garantir que skills estão OK:

- [x] Skills copiadas para `.agents/skills/`
- [x] Skills copiadas para `.claude/skills/`
- [x] Cada skill tem `SKILL.md`
- [x] Frontmatter com `name:` e `description:`
- [x] Nome no frontmatter bate com pasta
- [ ] Testar invocação: `/frontend-design`
- [ ] Testar invocação natural: "melhorar design"

---

## 📚 Documentação Relacionada

- `SKILLS_PERSONALIZADAS_INSTALADAS.md` - Lista completa de skills
- `MARKETING_SKILLS_INSTALADAS.md` - Skills de marketing
- `DESIGN_MELHORADO_LANDING.md` - Resultado de usar frontend-design

---

## 🎯 Próximos Passos

### 1. Testar Invocação
```
Você: /frontend-design

Esperado: Skill carrega e pede contexto
```

### 2. Testar em Contexto Real
```
Você: "Criar componente de dashboard único e profissional"

Esperado: frontend-design invocada automaticamente
```

### 3. Verificar Funcionamento
```
Skill deve:
✅ Perguntar sobre contexto
✅ Propor direção estética
✅ Gerar código distintivo
✅ Evitar templates genéricos
```

---

## 📊 Estrutura Final do Projeto

```
appsuprimentos/
├── .agents/
│   ├── skills/                    [NOVO]
│   │   ├── brainstorming/
│   │   ├── frontend-design/
│   │   ├── landing-page/
│   │   └── web-asset-generator/
│   └── product-marketing.md
│
├── .claude/
│   └── skills/
│       ├── [44 marketing skills]
│       ├── brainstorming/         [personalizada]
│       ├── copywriting/           [sobrescrita]
│       ├── frontend-design/       [personalizada]
│       ├── landing-page/          [personalizada]
│       └── web-asset-generator/   [personalizada]
│
├── docs/
│   ├── SKILLS_PERSONALIZADAS_INSTALADAS.md
│   ├── SKILLS_ESTRUTURA_COMPLETA.md [ESTE]
│   └── ...
│
└── [resto do projeto]
```

---

**Atualizado em:** 2026-06-29  
**Status:** ✅ Skills instaladas em ambos locais  
**Próximo passo:** Testar invocação `/frontend-design`  
**Compatibilidade:** Máxima (dual location)
