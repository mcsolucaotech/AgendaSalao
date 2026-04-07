# Aula: deploy no GitHub Pages com GitHub Actions

Este texto explica **por que** existe o arquivo `.github/workflows/gh-pages.yml`, **o que** cada parte faz e **como** repetir o processo em outro projeto.

---

## 1. Conceitos rápidos (o quadro geral)

### O que é GitHub Pages?

É um serviço gratuito do GitHub que **hospeda um site estático** (HTML, CSS, JS, imagens) a partir de um repositório. A URL costuma ser:

`https://SEU_USUARIO.github.io/NOME_DO_REPO/`

Para apps feitos com **Vite, Create React App, Vue CLI**, etc., você não envia o código-fonte direto: primeiro roda **`npm run build`**, que gera uma pasta (aqui, **`dist`**) com os arquivos prontos para o navegador. O GitHub Pages precisa receber **essa pasta compilada**, não a pasta `src`.

### O que é GitHub Actions?

É a ferramenta de **automação** do GitHub: você descreve um **workflow** (arquivo YAML) dizendo *quando* rodar e *o que* executar (comandos, uso de ações prontas). Cada execução roda em uma máquina virtual temporária (por exemplo, Ubuntu).

### Por que precisa deste arquivo?

Sem automação, você teria que, a cada alteração:

1. Rodar o build na sua máquina  
2. Copiar manualmente o `dist` para algum lugar que o Pages entenda  
3. Ou usar outra ferramenta à parte  

Com o workflow, **cada push na branch `main`** dispara: instalar dependências → build → publicar no Pages. Um único arquivo no repositório documenta e executa isso.

---

## 2. O arquivo do projeto (visão geral)

Caminho: `.github/workflows/gh-pages.yml`

- **`.github/workflows/`** — pasta padrão onde o GitHub procura workflows.  
- **`gh-pages.yml`** — nome do arquivo (pode ser outro, desde que termine em `.yml` ou `.yaml`).

Abaixo, o conteúdo é explicado **bloco a bloco**, como em uma aula linha a linha.

---

## 3. Explicação linha a linha (e bloco a bloco)

### Linha 1 — `name: Deploy to GitHub Pages`

```yaml
name: Deploy to GitHub Pages
```

- **O que é:** título amigável do workflow.  
- **Onde aparece:** na aba **Actions** do GitHub, na lista de execuções.  
- **Por quê:** só organização; não muda o comportamento técnico.

---

### Linhas 3–6 — `on:` (gatilho)

```yaml
on:
  push:
    branches:
      - main
```

- **`on:`** — define **quando** o workflow roda (eventos).  
- **`push:`** — alguém fez `git push`.  
- **`branches: - main`** — só se o push foi **na branch `main`**.  
- **Por quê:** evita deploy a cada push em branches de experimento (`feature/xyz`). Você pode trocar para `master` ou adicionar várias branches.

**Exemplo para outro app:** usar `pull_request` em vez de `push` para pré-visualização (exige workflow diferente; é um passo à frente).

---

### Linhas 8–11 — `permissions:`

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

O `GITHUB_TOKEN` que o GitHub gera em cada execução tem, por padrão, permissões **limitadas**. Para o fluxo oficial “**GitHub Actions → Pages**”, a documentação pede explicitamente:

| Permissão        | Significado |
|------------------|-------------|
| `contents: read` | O job pode **ler** o código do repositório (checkout). |
| `pages: write`   | Pode **publicar** no serviço GitHub Pages daquele repo. |
| `id-token: write`| Permite trocar um token de identidade (OIDC) usado na publicação de forma segura. |

- **Por quê:** sem isso, o job de deploy pode falhar com erro de permissão, mesmo com o build correto.

---

### Linhas 13–15 — `concurrency:`

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

- **`group: pages`** — execuções deste workflow entram no mesmo “grupo” lógico chamado `pages`.  
- **`cancel-in-progress: false`** — se você der dois pushes seguidos, **não cancela** o deploy anterior no meio; espera terminar (útil para não deixar o site em estado inconsistente).

Se fosse `true`, um push novo poderia **cancelar** o job antigo ainda rodando.

---

### Linhas 17–39 — Job `build:`

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
```

- **`jobs:`** — lista de **trabalhos** (podem rodar em paralelo ou em sequência). Aqui há dois: `build` e `deploy`.  
- **`build:`** — nome deste job (você escolhe).  
- **`runs-on: ubuntu-latest`** — máquina virtual **Ubuntu** atualizada, onde os comandos rodam.

#### Step: Checkout

```yaml
      - name: Checkout repository
        uses: actions/checkout@v4
```

- **`uses:`** — reutiliza uma **action** pronta (pacote mantido no GitHub).  
- **`actions/checkout@v4`** — copia o código do repositório para a máquina do workflow.  
- **`@v4`** — versão da action (bom fixar versão para builds reproduzíveis).

Sem esse passo, não haveria `package.json` nem `src` na VM.

#### Step: Node.js

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
```

- Instala **Node.js 20** (compatível com este projeto).  
- **`cache: 'npm'`** — guarda cache de `node_modules` entre execuções para acelerar `npm ci`.

Em outro app, alinhe a versão ao que você usa localmente (18, 22, etc.).

#### Step: Dependências

```yaml
      - name: Install dependencies
        run: npm ci
```

- **`run:`** — executa um **comando shell** na VM.  
- **`npm ci`** — instala exatamente o que está no **`package-lock.json`** (ideal para CI; mais previsível que `npm install`).

#### Step: Build

```yaml
      - name: Build project
        run: npm run build
```

- Chama o script **`build`** do `package.json` (neste projeto: Vite → gera **`dist/`**).

#### Step: Upload do artefato para o Pages

```yaml
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

- **`upload-pages-artifact`** — empacota a pasta indicada no formato que o GitHub Pages espera no próximo job.  
- **`path: dist`** — pasta de saída do Vite **neste** repo.

**Em outro app:** se o build gerar `build` (CRA antigo) ou `out` (Next export estático), troque para esse caminho.

---

### Linhas 41–50 — Job `deploy:`

```yaml
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- **`needs: build`** — o deploy **só começa depois** que o job `build` termina com sucesso.  
- **`environment: name: github-pages`** — associa o job ao **ambiente** `github-pages` do repositório (o GitHub usa isso para Pages via Actions; pode pedir aprovação se você configurar “protection rules”).  
- **`url: ${{ steps.deployment.outputs.page_url }}`** — após o deploy, a URL publicada aparece na interface do Actions (expressão que lê a saída do step `deployment`).  
- **`id: deployment`** — nomeia o step para poder referenciar `steps.deployment.outputs...`.  
- **`actions/deploy-pages@v4`** — publica o artefato enviado pelo `upload-pages-artifact`; é a action **oficial** do GitHub para esse fluxo.

Não há `run:` aqui porque toda a lógica está encapsulada na action.

---

## 4. Configuração obrigatória no GitHub (uma vez por repositório)

1. Abra o repositório no GitHub.  
2. **Settings** → **Pages**.  
3. Em **Build and deployment** → **Source**, escolha **GitHub Actions** (não “Deploy from a branch” com `main` ou `gh-pages`, a menos que você use outro método).  
4. Salve se necessário.  

Na primeira vez, após um workflow bem-sucedido, o site passa a ficar disponível na URL do Pages do projeto.

---

## 5. Adaptar este workflow para “qualquer outro app”

Checklist prático:

1. **É site estático após o build?**  
   GitHub Pages não roda servidor Node na hospedagem; só arquivos estáticos. SPAs (React/Vite/Vue) em geral funcionam; APIs backend precisam estar em outro lugar.

2. **Qual pasta o build gera?**  
   Ajuste `path:` no `upload-pages-artifact` (`dist`, `build`, `out`, etc.).

3. **Comando de build**  
   Se não for `npm run build`, troque o step (ex.: `pnpm build`, `yarn build`).

4. **Gerenciador de pacotes**  
   - Com **pnpm**: use `actions/setup-node` com `cache: 'pnpm'` e `run: pnpm install --frozen-lockfile`.  
   - Com **yarn**: `cache: 'yarn'` e `yarn install --frozen-lockfile`.

5. **Projeto em subpasta**  
   Se o app não está na raiz do repo, adicione `working-directory:` nos steps ou um `cd pasta && npm ci`.

6. **URL com subcaminho (`/NomeDoRepo/`)**  
   Em Vite/Webpack, configure **`base`** (ou `homepage` no CRA) para o caminho correto; senão os assets quebram no Pages.

7. **Branch de deploy**  
   Troque `main` em `on.push.branches` se seu fluxo usar outra branch padrão.

---

## 6. Resumo em uma frase

**O workflow diz:** “Quando alguém der push na `main`, use Ubuntu, instale dependências com npm, gere a pasta `dist`, envie como artefato oficial do Pages e publique com a action de deploy” — com permissões e ordem de jobs definidas para o GitHub aceitar a publicação.

---

## 7. Onde aprender mais (oficial)

- [GitHub Pages: configurar origem com Actions](https://docs.github.com/pt/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)  
- [Workflow syntax for GitHub Actions](https://docs.github.com/pt/actions/using-workflows/workflow-syntax-for-github-actions)  
- [actions/deploy-pages](https://github.com/actions/deploy-pages)  
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact)

Se quiser, no próximo passo você pode copiar este workflow para outro repositório e ajustar só `path`, `node-version` e `branches` — costuma ser suficiente para projetos semelhantes.
