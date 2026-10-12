# REGRAS MANDATÓRIAS DO PROJETO PLAY CARTAZ IA

## 🛡️ DIRETRIZES DE AMBIENTES E BANCOS DE DADOS (DEV & PROD)

### 1. SEPARAÇÃO TOTAL DE AMBIENTES:
- **DEV (Desenvolvimento / Homologação):**
  - **URL Oficial DEV:** `https://play-cartaz-ia-dev.web.app`
  - **URL Legada DEV:** `https://cartaz-ia-dev-778bc.web.app`
  - **Projeto Firebase:** `cartaz-ia-dev-778bc` (Target Hosting: `dev`, Site: `play-cartaz-ia-dev`)
  - **Branch Git:** `dev`
  - **Comando Deploy DEV:** `npm run build:dev && firebase deploy --only hosting:dev --project cartaz-ia-dev-778bc`
  - **Uso:** Todas as novas funcionalidades, testes de layout, correções e experimentos devem ser feitos **EXCLUSIVAMENTE em DEV**.
  
- **PROD (Produção Oficial do Play Cartaz IA):**
  - **URL:** `https://play-cartaz-ia-prod.web.app`
  - **Projeto Firebase:** `cartaz-ia-playcomunique` (Target Hosting: `prod`, Site: `play-cartaz-ia-prod`)
  - **Branch Git:** `main`
  - **Banco de Dados (Firestore):** Conectado ao Firestore oficial de `cartaz-ia-playcomunique` (clientes reais e campanhas).
  - **Comando Deploy PROD:** `npm run build:prod && firebase deploy --only hosting:prod --project cartaz-ia-playcomunique`
  - **Uso:** Ambiente oficial dos clientes e campanhas reais em operação.

- **PROJETO BASE44 (Mesa de Luz / BannerFlow v10):**
  - **URL:** `https://cartaz-ia-playcomunique.web.app/mesa-de-luz`
  - **Aviso Mandatório:** NÃO SOBRESCREVER. Este site hospeda o sistema isolado Base44.

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
