# Como Subir para o GitHub 🐙

Eu já preparei os arquivos locais para você. Agora só falta conectar com o GitHub.

## Passo 1: Criar o Repositório no GitHub
1.  Acesse [github.com/new](https://github.com/new) (faça login se precisar).
2.  **Repository name**: Digite `workout-pwa` (ou o nome que preferir).
3.  **Public/Private**: Escolha se quer público ou privado.
4.  **NÃO MARQUE** as opções "Add a README file", ".gitignore" ou "license" (já temos isso aqui).
5.  Clique em **Create repository**.

## Passo 2: Conectar e Enviar
Na próxima tela do GitHub, copie os comandos da seção **"…or push an existing repository from the command line"**.

Devem ser parecidos com isso (copie e cole no seu terminal, um por um):

```bash
git remote add origin https://github.com/SEU_USUARIO/workout-pwa.git
git branch -M main
git push -u origin main
```

*(Substitua `SEU_USUARIO` pelo seu user real, ou apenas copie direto do site)*

## Passo 3: Pronto!
Recarregue a página do GitHub e seu código estará lá.

---

### Comandos Úteis para o Futuro

Sempre que fizer alterações e quiser salvar no GitHub:

1.  `git add .` (Prepara os arquivos)
2.  `git commit -m "Descreva o que mudou"` (Salva localmente)
3.  `git push` (Envia para o GitHub)
