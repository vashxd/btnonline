const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Armazenar jogadores e jogos ativos
let waitingPlayers = [];
let activeGames = new Map();

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gerenciar conexões Socket.IO
io.on('connection', (socket) => {
    console.log(`✅ Jogador conectado: ${socket.id} (Total: ${io.engine.clientsCount})`);

    // Jogador pronto para jogar
    socket.on('player-ready', (playerName) => {
        const player = {
            id: socket.id,
            name: playerName || `Jogador ${socket.id.substr(0, 6)}`,
            socket: socket
        };

        // Se há jogador esperando, iniciar jogo
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const gameId = `game_${Date.now()}`;
            
            // Criar novo jogo
            const game = {
                id: gameId,
                players: [opponent, player],
                currentTurn: 0,
                phase: 'placement', // placement -> battle -> finished
                boards: {
                    [opponent.id]: { ships: [], shots: [] },
                    [player.id]: { ships: [], shots: [] }
                }
            };

            activeGames.set(gameId, game);

            // Notificar ambos jogadores
            opponent.socket.join(gameId);
            player.socket.join(gameId);

            opponent.socket.emit('game-found', {
                gameId: gameId,
                opponent: player.name,
                playerId: opponent.id,
                isFirstPlayer: true
            });

            player.socket.emit('game-found', {
                gameId: gameId,
                opponent: opponent.name,
                playerId: player.id,
                isFirstPlayer: false
            });

            console.log(`Jogo iniciado: ${gameId} - ${opponent.name} vs ${player.name}`);
        } else {
            // Adicionar à lista de espera
            waitingPlayers.push(player);
            socket.emit('waiting-for-opponent');
            console.log(`${player.name} aguardando oponente...`);
        }
    });

    // Posicionar navios
    socket.on('place-ships', (data) => {
        const game = activeGames.get(data.gameId);
        if (!game) return;

        game.boards[socket.id].ships = data.ships;
        
        // Verificar se ambos jogadores posicionaram os navios
        const bothPlayersReady = game.players.every(player => 
            game.boards[player.id].ships.length > 0
        );

        if (bothPlayersReady) {
            game.phase = 'battle';
            io.to(data.gameId).emit('battle-phase-start', {
                currentPlayer: game.players[game.currentTurn].id
            });
            console.log(`Fase de batalha iniciada no jogo ${data.gameId}`);
        }
    });

    // Atacar posição
    socket.on('attack', (data) => {
        const game = activeGames.get(data.gameId);
        if (!game || game.phase !== 'battle') return;

        const currentPlayer = game.players[game.currentTurn];
        if (currentPlayer.id !== socket.id) return;

        const opponentId = game.players[1 - game.currentTurn].id;
        const opponentShips = game.boards[opponentId].ships;
        
        // Verificar se acertou algum navio
        let hit = false;
        let sunkShip = null;

        for (let ship of opponentShips) {
            for (let i = 0; i < ship.positions.length; i++) {
                const pos = ship.positions[i];
                if (pos.x === data.x && pos.y === data.y && !pos.hit) {
                    pos.hit = true;
                    hit = true;
                    
                    // Verificar se o navio foi afundado
                    if (ship.positions.every(p => p.hit)) {
                        sunkShip = ship;
                    }
                    break;
                }
            }
            if (hit) break;
        }

        // Registrar o tiro
        game.boards[socket.id].shots.push({
            x: data.x,
            y: data.y,
            hit: hit
        });

        // Verificar vitória
        const allShipsSunk = opponentShips.every(ship => 
            ship.positions.every(pos => pos.hit)
        );

        if (allShipsSunk) {
            game.phase = 'finished';
            io.to(data.gameId).emit('game-over', {
                winner: socket.id,
                winnerName: currentPlayer.name
            });
            activeGames.delete(data.gameId);
            console.log(`Jogo ${data.gameId} finalizado. Vencedor: ${currentPlayer.name}`);
        } else {
            // Próximo turno (só muda se errou)
            if (!hit) {
                game.currentTurn = 1 - game.currentTurn;
            }

            io.to(data.gameId).emit('attack-result', {
                x: data.x,
                y: data.y,
                hit: hit,
                sunk: sunkShip,
                nextPlayer: game.players[game.currentTurn].id,
                attacker: socket.id
            });
        }
    });    // Desconexão
    socket.on('disconnect', () => {
        console.log(`❌ Jogador desconectado: ${socket.id} (Total: ${io.engine.clientsCount})`);
        
        // Remover da lista de espera
        waitingPlayers = waitingPlayers.filter(player => player.id !== socket.id);
        
        // Finalizar jogos ativos
        for (let [gameId, game] of activeGames) {
            if (game.players.some(player => player.id === socket.id)) {
                io.to(gameId).emit('opponent-disconnected');
                activeGames.delete(gameId);
                console.log(`🎮 Jogo ${gameId} cancelado por desconexão`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚢 Servidor Batalha Naval rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log(`📱 Para testar multiplayer, abra em duas abas diferentes`);
});
