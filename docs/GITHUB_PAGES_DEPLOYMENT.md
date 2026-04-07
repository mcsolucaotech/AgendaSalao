# Deploy no GitHub Pages - AgendaSalao

Este documento descreve todas as configurações necessárias para publicar o projeto `AgendaSalao` como site estático no GitHub Pages.

## 1. Visão geral do projeto

- Framework: Vite + React
- Build output: `dist/`
- Deploy alvo: `https://kairosdedeus.github.io/AgendaSalao`

## 2. Configurações necessárias

### 2.1. `package.json`

O arquivo `package.json` deve incluir o campo `homepage` apontando para a URL do GitHub Pages.

Exemplo:

```json
{
  "homepage": "https://kairosdedeus.github.io/AgendaSalao",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build"
  }
}
```

> Observação: o projeto já possui o campo `homepage` configurado corretamente.

### 2.2. `vite.config.js`

O Vite precisa usar a base correta para recursos estáticos quando o app é servido em um subdiretório GitHub Pages.

Exemplo de configuração:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AgendaSalao/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
}))
```

> Observação: o arquivo `vite.config.js` já está configurado com `base: '/AgendaSalao/'` para o build.

## 3. Build do projeto

Execute o comando:

```bash
npm run build
```

Isso vai gerar a pasta `dist/` com os arquivos estáticos finais.

## 4. Opções de deploy para GitHub Pages

### 4.1. Deploy manual usando branch `gh-pages`

1. Instale o pacote de deploy:

```bash
npm install --save-dev gh-pages
```

2. Adicione os scripts no `package.json`:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Execute:

```bash
npm run deploy
```

Isso criará ou atualizará a branch `gh-pages` e publicará o conteúdo.

### 4.2. Deploy automático com GitHub Actions

A opção recomendada é usar GitHub Actions para construir e publicar automaticamente sempre que você fizer push para `main`.

Crie o arquivo `.github/workflows/gh-pages.yml` com o conteúdo abaixo:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v6
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
          user_name: 'github-actions[bot]'
          user_email: 'github-actions[bot]@users.noreply.github.com'
```

### 4.3. Configuração do GitHub Pages na interface

No repositório do GitHub, acesse:

`Settings > Pages`

Escolha uma das opções:

- Fonte: branch `gh-pages` / pasta `/` (caso use `gh-pages` branch)
- Ou branch `main` / pasta `/docs` se você preferir gerar para `docs/`

Para o fluxo sugerido neste documento, use `gh-pages`.

## 5. Ajustes finais

- Confirme que o `dist/` não está versionado no Git. Ele deve ser gerado no pipeline ou localmente antes do deploy.
- Verifique se o conteúdo do app está acessível em `https://kairosdedeus.github.io/AgendaSalao` após o deploy.
- Se o repositório for privado, GitHub Pages só funciona em repositórios públicos ou com plano que permita Pages privativas.

## 6. Resumo das etapas

1. Garantir `homepage` no `package.json`.
2. Garantir `base: '/AgendaSalao/'` no `vite.config.js`.
3. Executar `npm run build`.
4. Fazer deploy manual com `gh-pages` ou automatizar com GitHub Actions.
5. Configurar GitHub Pages em `Settings > Pages`.

## 7. Observações específicas do projeto

- O app já está preparado para funcionar em GitHub Pages com as configurações atuais.
- Se quiser, posso também criar o arquivo de workflow `.github/workflows/gh-pages.yml` e o script `gh-pages` no `package.json`.
