# 🚢 Batalha Naval Online

Uma aplicação web de Batalha Naval multiplayer em tempo real, otimizada para dispositivos móveis.

## 🎮 Características

- **Multiplayer em tempo real** usando Socket.IO
- **Design responsivo** otimizado para mobile
- **Sistema simples de matchmaking** - clique em "Pronto" e aguarde um oponente
- **Interface intuitiva** com drag-and-drop para posicionamento de navios
- **Feedback visual** com animações e efeitos sonoros
- **Sem necessidade de login** - entre e jogue instantaneamente

## 🚀 Como Jogar

1. **Acesse a aplicação** no seu navegador
2. **Digite seu nome** (opcional)
3. **Clique em "Pronto para Jogar"** e aguarde um oponente
4. **Posicione seus navios** no tabuleiro
   - Clique para posicionar
   - Use o botão "Girar" para mudar orientação
   - Use "Auto" para posicionamento automático
5. **Confirme o posicionamento** quando todos os navios estiverem no lugar
6. **Ataque o tabuleiro inimigo** durante sua vez
7. **Afunde todos os navios** para vencer!

## 📱 Compatibilidade Mobile

- **Touch-friendly** - interface otimizada para toque
- **Responsive design** - adapta-se a qualquer tamanho de tela
- **Gestos intuitivos** - toque para posicionar e atacar
- **Layout mobile-first** - projetado primeiramente para dispositivos móveis

## 🛠 Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Real-time**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Design**: CSS Grid, Flexbox, Media Queries

## 🏃‍♂️ Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm

### Instalação
1. Clone ou baixe o projeto
2. Instale as dependências:
   ```bash
   npm install
   ```

### Executar
```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`

## 🎯 Regras do Jogo

### Navios Disponíveis
- **1x Porta-aviões** (5 células) 🚢
- **1x Encouraçado** (4 células) ⛵
- **2x Cruzador** (3 células) 🛥️
- **3x Destroyer** (2 células) 🚤
- **4x Submarino** (1 célula) 🔱

### Regras de Posicionamento
- Navios devem ser posicionados em linha reta (horizontal ou vertical)
- Navios não podem se tocar (nem nas diagonais)
- Todos os navios devem estar dentro do tabuleiro 10x10

### Regras de Batalha
- Jogadores alternam turnos
- Se acertar um navio, ganha outro turno
- Primeiro a afundar todos os navios inimigos vence
- Células atacadas são marcadas como acerto (💥) ou erro (💧)

## 🚢 Estrutura do Projeto

```
batalha-naval-online/
├── server.js              # Servidor principal
├── package.json           # Dependências e scripts
├── public/                # Arquivos públicos
│   ├── index.html         # Página principal
│   ├── css/
│   │   └── styles.css     # Estilos responsivos
│   ├── js/
│   │   ├── app.js         # Aplicação principal
│   │   ├── board.js       # Gerenciamento de tabuleiros
│   │   ├── game.js        # Lógica do jogo
│   │   └── ships.js       # Posicionamento de navios
│   └── assets/            # Recursos (imagens, sons)
└── .github/
    └── copilot-instructions.md
```

## 🎨 Características do Design

- **Tema naval** com cores azuis e elementos marítimos
- **Animações suaves** para feedback visual
- **Typography moderna** com fontes Orbitron e Rajdhani
- **Gradientes e sombras** para profundidade visual
- **Estados visuais claros** para todas as interações

## 🔧 Funcionalidades Técnicas

- **Validação de posicionamento** de navios
- **Detecção de vitória** automática
- **Reconexão automática** em caso de desconexão
- **Feedback de erro** para ações inválidas
- **Sistema de turnos** robusto
- **Prevenção de trapaças** básica

## 📈 Melhorias Futuras

- [ ] Sistema de ranking
- [ ] Salas privadas
- [ ] Chat durante o jogo
- [ ] Efeitos sonoros
- [ ] Modo contra IA
- [ ] Histórico de partidas
- [ ] Customização de temas

## 🐛 Problemas Conhecidos

- A aplicação requer JavaScript habilitado
- Funciona melhor em navegadores modernos
- Conexão de internet estável necessária

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Enviar pull requests

## 👨‍💻 Desenvolvimento

Para desenvolvimento local:
1. Instale as dependências: `npm install`
2. Execute em modo de desenvolvimento: `npm run dev`
3. Acesse `http://localhost:3000`

---

🎮 **Divirta-se jogando Batalha Naval!** ⚓
