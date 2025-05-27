// Aplicação Principal - Batalha Naval
class BattleshipApp {
    constructor() {
        this.socket = io();
        this.gameState = {
            currentScreen: 'start',
            gameId: null,
            playerId: null,
            playerName: '',
            opponentName: '',
            isMyTurn: false,
            phase: 'start' // start, placement, battle, finished
        };
        
        this.connectionStatus = 'connecting';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketListeners();
        this.showScreen('start');
        this.createConnectionStatusIndicator();
    }

    setupEventListeners() {
        // Botão Pronto
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.handleReadyClick();
        });

        // Cancelar espera
        document.getElementById('cancel-waiting').addEventListener('click', () => {
            this.showScreen('start');
        });

        // Jogar novamente
        document.getElementById('play-again').addEventListener('click', () => {
            this.resetGame();
        });

        // Modal de desconexão
        document.getElementById('disconnect-ok').addEventListener('click', () => {
            this.hideModal('disconnect-modal');
            this.resetGame();
        });

        // Enter no campo de nome
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleReadyClick();
            }
        });

        // Botões da fase de posicionamento
        document.getElementById('rotate-ship').addEventListener('click', () => {
            if (window.shipPlacer) {
                window.shipPlacer.rotateCurrentShip();
            }
        });

        document.getElementById('auto-place').addEventListener('click', () => {
            if (window.shipPlacer) {
                window.shipPlacer.autoPlaceShips();
            }
        });

        document.getElementById('confirm-placement').addEventListener('click', () => {
            this.confirmShipPlacement();
        });
    }

    setupSocketListeners() {
        // Status de conexão
        this.socket.on('connect', () => {
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.updateConnectionStatus();
            console.log('🔌 Conectado ao servidor');
        });

        this.socket.on('disconnect', () => {
            this.connectionStatus = 'disconnected';
            this.updateConnectionStatus();
            console.log('❌ Desconectado do servidor');
            
            if (this.gameState.phase !== 'start') {
                this.showError('Conexão perdida. Tentando reconectar...');
                this.attemptReconnect();
            }
        });

        this.socket.on('connect_error', () => {
            this.connectionStatus = 'disconnected';
            this.updateConnectionStatus();
            this.showError('Erro de conexão com o servidor');
            this.attemptReconnect();
        });

        // Aguardando oponente
        this.socket.on('waiting-for-opponent', () => {
            this.showScreen('waiting');
        });

        // Jogo encontrado
        this.socket.on('game-found', (data) => {
            this.gameState.gameId = data.gameId;
            this.gameState.playerId = data.playerId;
            this.gameState.opponentName = data.opponent;
            this.gameState.phase = 'placement';
            
            this.updatePlayerInfo();
            this.showScreen('game');
            this.startPlacementPhase();
        });

        // Início da fase de batalha
        this.socket.on('battle-phase-start', (data) => {
            this.gameState.phase = 'battle';
            this.gameState.isMyTurn = data.currentPlayer === this.gameState.playerId;
            this.startBattlePhase();
        });

        // Resultado do ataque
        this.socket.on('attack-result', (data) => {
            this.handleAttackResult(data);
        });

        // Fim de jogo
        this.socket.on('game-over', (data) => {
            this.handleGameOver(data);
        });

        // Oponente desconectado
        this.socket.on('opponent-disconnected', () => {
            this.showModal('disconnect-modal');
        });
    }

    createConnectionStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.className = 'connection-status connecting';
        indicator.textContent = 'Conectando...';
        document.body.appendChild(indicator);
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;

        indicator.className = `connection-status ${this.connectionStatus}`;
        
        switch(this.connectionStatus) {
            case 'connected':
                indicator.textContent = '🟢 Online';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 2000);
                break;
            case 'connecting':
                indicator.textContent = '🟡 Conectando...';
                indicator.style.opacity = '1';
                break;
            case 'disconnected':
                indicator.textContent = '🔴 Desconectado';
                indicator.style.opacity = '1';
                break;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showError('Não foi possível reconectar. Recarregue a página.');
            return;
        }

        this.reconnectAttempts++;
        this.connectionStatus = 'connecting';
        this.updateConnectionStatus();

        setTimeout(() => {
            if (this.socket.disconnected) {
                this.socket.connect();
            }
        }, Math.pow(2, this.reconnectAttempts) * 1000); // Backoff exponencial
    }

    handleReadyClick() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value.trim() || `Jogador${Math.floor(Math.random() * 1000)}`;
        
        this.gameState.playerName = playerName;
        this.socket.emit('player-ready', playerName);
    }

    updatePlayerInfo() {
        document.getElementById('player-name-display').textContent = this.gameState.playerName;
        document.getElementById('opponent-name-display').textContent = this.gameState.opponentName;
    }

    startPlacementPhase() {
        document.getElementById('placement-phase').classList.remove('hidden');
        document.getElementById('battle-phase').classList.add('hidden');
        
        // Inicializar posicionamento de navios
        const placementBoard = document.getElementById('placement-board');
        window.shipPlacer = new ShipPlacer(placementBoard, this);
        
        this.updateGameStatus('Posicione seus navios no tabuleiro');
        this.updateTurnIndicator('');
    }

    startBattlePhase() {
        document.getElementById('placement-phase').classList.add('hidden');
        document.getElementById('battle-phase').classList.remove('hidden');
        
        // Inicializar tabuleiros de batalha
        const playerBoard = document.getElementById('player-board');
        const enemyBoard = document.getElementById('enemy-board');
        
        window.playerBattleBoard = new BattleBoard(playerBoard, 'player', this);
        window.enemyBattleBoard = new BattleBoard(enemyBoard, 'enemy', this);
        
        // Copiar navios do posicionamento para o tabuleiro do jogador
        if (window.shipPlacer) {
            window.playerBattleBoard.setShips(window.shipPlacer.getPlacedShips());
        }
        
        this.updateGameStatus('Fase de Batalha - Ataque o tabuleiro inimigo!');
        this.updateTurnDisplay();
    }

    confirmShipPlacement() {
        if (!window.shipPlacer || !window.shipPlacer.allShipsPlaced()) {
            this.showError('Posicione todos os navios antes de continuar');
            return;
        }

        const ships = window.shipPlacer.getPlacedShips();
        this.socket.emit('place-ships', {
            gameId: this.gameState.gameId,
            ships: ships
        });

        this.updateGameStatus('Aguardando oponente posicionar navios...');
        document.getElementById('confirm-placement').disabled = true;
    }

    handleAttackResult(data) {
        // Atualizar tabuleiro inimigo se foi meu ataque
        if (data.attacker === this.gameState.playerId) {
            window.enemyBattleBoard.markAttack(data.x, data.y, data.hit, data.sunk);
        } else {
            // Atualizar meu tabuleiro se foi ataque inimigo
            window.playerBattleBoard.markAttack(data.x, data.y, data.hit, data.sunk);
        }

        // Atualizar turno
        this.gameState.isMyTurn = data.nextPlayer === this.gameState.playerId;
        this.updateTurnDisplay();

        // Feedback sonoro
        this.playSound(data.hit ? 'hit' : 'miss');
    }

    handleGameOver(data) {
        this.gameState.phase = 'finished';
        const isWinner = data.winner === this.gameState.playerId;
        
        setTimeout(() => {
            this.showGameOverScreen(isWinner, data.winnerName);
        }, 1000);
    }

    showGameOverScreen(isWinner, winnerName) {
        const resultIcon = document.getElementById('result-icon');
        const gameResult = document.getElementById('game-result');
        const gameResultText = document.getElementById('game-result-text');
        
        if (isWinner) {
            resultIcon.className = 'result-icon victory';
            gameResult.textContent = 'VITÓRIA!';
            gameResult.className = 'victory';
            gameResultText.textContent = 'Parabéns! Você afundou todos os navios inimigos!';
            this.playSound('victory');
        } else {
            resultIcon.className = 'result-icon defeat';
            gameResult.textContent = 'DERROTA';
            gameResult.className = 'defeat';
            gameResultText.textContent = `${winnerName} venceu a batalha.`;
            this.playSound('defeat');
        }
        
        this.showScreen('game-over');
    }

    updateGameStatus(message) {
        document.getElementById('game-status').textContent = message;
    }

    updateTurnDisplay() {
        const turnIndicator = document.getElementById('turn-indicator');
        
        if (this.gameState.isMyTurn) {
            turnIndicator.textContent = 'SEU TURNO';
            turnIndicator.className = 'turn-indicator your-turn';
        } else {
            turnIndicator.textContent = 'TURNO DO OPONENTE';
            turnIndicator.className = 'turn-indicator opponent-turn';
        }
    }

    updateTurnIndicator(text) {
        document.getElementById('turn-indicator').textContent = text;
        document.getElementById('turn-indicator').className = 'turn-indicator';
    }

    attack(x, y) {
        if (!this.gameState.isMyTurn || this.gameState.phase !== 'battle') {
            return false;
        }

        this.socket.emit('attack', {
            gameId: this.gameState.gameId,
            x: x,
            y: y
        });

        return true;
    }

    showScreen(screenName) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar tela solicitada
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.gameState.currentScreen = screenName;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showError(message) {
        // Criar toast de erro temporário
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    playSound(type) {
        // Implementação básica de sons (pode ser expandida)
        try {
            const audio = new Audio();
            switch(type) {
                case 'hit':
                    // Som de acerto
                    break;
                case 'miss':
                    // Som de erro
                    break;
                case 'victory':
                    // Som de vitória
                    break;
                case 'defeat':
                    // Som de derrota
                    break;
            }
        } catch (e) {
            // Ignorar erros de áudio
        }
    }

    resetGame() {
        this.gameState = {
            currentScreen: 'start',
            gameId: null,
            playerId: null,
            playerName: '',
            opponentName: '',
            isMyTurn: false,
            phase: 'start'
        };
        
        // Limpar campos
        document.getElementById('player-name').value = '';
        document.getElementById('confirm-placement').disabled = false;
        
        // Limpar instâncias de jogo
        window.shipPlacer = null;
        window.playerBattleBoard = null;
        window.enemyBattleBoard = null;
        
        this.showScreen('start');
    }
}

// CSS para animações de toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.battleshipApp = new BattleshipApp();
});
