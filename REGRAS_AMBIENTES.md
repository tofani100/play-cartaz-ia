# REGRAS MANDATÓRIAS DO PROJETO PLAY CARTAZ IA

## 🛡️ DIRETRIZES DE AMBIENTES E BANCOS DE DADOS (DEV & PROD)

### 1. SEPARAÇÃO TOTAL DE AMBIENTES:
- **DEV (Desenvolvimento / Homologação):**
  - **URL:** `https://cartaz-ia-dev-778bc.web.app` (e testes locais em `localhost`).
  - **Projeto Firebase:** `cartaz-ia-dev-778bc`
  - **Branch Git:** `dev`
  - **Uso:** Todas as novas funcionalidades, testes de layout, correções e experimentos devem ser feitos **EXCLUSIVAMENTE em DEV**.
  
- **PROD (Produção Oficial):**
  - **URL:** `https://cartaz-ia-playcomunique.web.app`
  - **Projeto Firebase:** `cartaz-ia-playcomunique`
  - **Branch Git:** `main`
  - **Uso:** Ambiente oficial dos clientes e campanhas reais em operação.

---

### 2. REGRA DE OURO DE DEPLOY (PRODUÇÃO BLOQUEADA):
- **PRODUÇÃO NUNCA DEVE RECEBER DEPLOY OU MERGE AUTÔNOMO.**
- Qualquer alteração passa primeiro pela validação e aprovação explícita do usuário no ambiente DEV.
- O deploy para PRODUÇÃO só é executado quando o usuário der a ordem direta: *"suba para produção"*.

---

### 3. ISOLAMENTO ABSOLUTO DE DADOS:
- Os bancos de dados (Firestore) de DEV e PROD são **100% independentes**.
- Criações de teste, exclusões ou edições feitas em DEV **não afetam** e **não poluem** os dados reais de PROD.
- Backups de segurança de PROD são mantidos na pasta `data/backups/`.
