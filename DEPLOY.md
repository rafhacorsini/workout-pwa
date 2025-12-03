# Guia de Deploy e Uso (Workout PWA) 🚀

## 1. Como Colocar no Ar (Vercel)

Você pode subir esse projeto gratuitamente na Vercel.

### Opção A: Via GitHub (Recomendado)
1.  Crie um repositório no GitHub e suba este código.
2.  Acesse [vercel.com](https://vercel.com) e faça login.
3.  Clique em **"Add New..."** -> **"Project"**.
4.  Importe o repositório do GitHub.
5.  A Vercel vai detectar tudo automaticamente. Clique em **Deploy**.
6.  Pronto! Você terá um link (ex: `workout-app.vercel.app`).

### Opção B: Via Vercel CLI
Se tiver o Vercel CLI instalado:
1.  Abra o terminal na pasta do projeto.
2.  Rode `vercel`.
3.  Siga os passos (Yes, Yes, Yes...).

---

## 2. Seu Amigo Pode Usar? 🤝

**SIM!** Mas tem um detalhe importante:

*   **O Banco de Dados é LOCAL (IndexedDB)**:
    *   Isso significa que os dados ficam salvos **no navegador do celular** de cada pessoa.
    *   Quando seu amigo abrir o link, ele verá o app "zerado", pronto para o uso **dele**.
    *   O que você treina fica no **seu** celular. O que ele treina fica no **dele**.
    *   Ninguém vê o treino de ninguém (privacidade total).

> **Atenção**: Se apagar os dados de navegação do celular, os treinos somem. Para uso sério a longo prazo, evite limpar o cache do site.

---

## 3. Como Instalar no iPhone (App) 📱

Para ficar com cara de aplicativo nativo (sem barra de navegador):

1.  Abra o link no **Safari**.
2.  Toque no botão **Compartilhar** (quadrado com seta).
3.  Escolha **"Adicionar à Tela de Início"**.
4.  O ícone vai aparecer junto com seus outros apps.

---

## 4. Configuração da IA (OpenAI) 🤖

Para a IA funcionar no site online:
1.  No painel da Vercel, vá em **Settings** -> **Environment Variables**.
2.  Adicione a chave da API (se não tiver hardcoded no código):
    *   Key: `OPENAI_API_KEY` (se estiver usando env vars)
    *   *Nota: Se você colocou a chave direto no arquivo `config.js` ou `ai.js`, ela vai funcionar, mas cuidado para não vazar se o repositório for público.*
