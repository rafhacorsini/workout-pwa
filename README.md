# Workout PWA 🏋️‍♂️

Um aplicativo de treino progressivo com design premium estilo Apple e inteligência artificial.

## ✨ Funcionalidades

### 🎨 Design Premium
- Glassmorphism, animações fluidas e tipografia refinada (estilo Apple)
- Interface responsiva e otimizada para mobile

### 🤖 Coach IA
- Sugestões de carga e análise de treino com OpenAI (GPT-4o)
- Análise de foto do shape (% gordura, pontos fortes/fracos)
- Parser inteligente de refeições por texto

### 🍎 Nutrição Completa
- Contador de calorias e macros (Proteína, Carbs, Gordura)
- Rastreador de água 💧
- IA que converte texto em macros ("comi 2 ovos" → 12g proteína)

### 📈 Evolução & Progresso
- Gráfico de peso corporal (SVG)
- Galeria de fotos do shape com análise IA
- Histórico de treinos e pesos

### 🎮 Gamificação
- Metas semanais (4 treinos/semana)
- Streak (dias consecutivos treinando)
- XP e níveis

### 📱 PWA (Progressive Web App)
- Funciona 100% offline
- Instala como app nativo no celular
- Dados salvos localmente (IndexedDB)

## 🚀 Como Usar

1. Acesse: [seu-app.vercel.app](https://seu-app.vercel.app)
2. Adicione à tela de início do seu iPhone/Android
3. Configure seu perfil (peso, altura, objetivo)
4. Comece a treinar! 💪

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: IndexedDB
- **AI**: OpenAI API (GPT-4o-mini)
- **Deploy**: Vercel (Serverless Functions)

## 📦 Deploy

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/workout-pwa.git

# Configure a variável de ambiente na Vercel
OPENAI_API_KEY=sua_chave_aqui

# Deploy automático via Git Push
git push
```

## 📄 Licença

MIT
