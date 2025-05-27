// Lógica Principal do Jogo
class GameLogic {
    constructor() {
        this.gameState = {
            phase: 'waiting', // waiting, placement, battle, finished
            players: [],
            currentTurn: 0,
            boards: {},
            gameId: null,
            moves: [],
            startTime: null,
            endTime: null
        };
        
        this.sounds = {
            hit: null,
            miss: null,
            sunk: null,
            victory: null,
            defeat: null,
            place: null
        };
        
        this.statistics = {
            shotsTotal: 0,
            shotsHit: 0,
            shipsSunk: 0,
            gameTime: 0
        };
    }

    // Inicializar novo jogo
    initGame(gameData) {
        this.gameState.gameId = gameData.gameId;
        this.gameState.players = gameData.players;
        this.gameState.phase = 'placement';
        this.gameState.startTime = Date.now();
        this.gameState.moves = [];
        
        this.resetStatistics();
    }

    // Validar posicionamento de navio
    validateShipPlacement(ships) {
        const errors = [];
        const grid = this.createEmptyGrid();
        
        // Verificar se todos os navios obrigatórios estão presentes
        const requiredShips = this.getRequiredShips();
        const shipCounts = {};
        
        ships.forEach(ship => {
            const shipType = SHIP_TYPES[ship.type];
            if (!shipCounts[ship.size]) {
                shipCounts[ship.size] = 0;
            }
            shipCounts[ship.size]++;
        });
        
        requiredShips.forEach(required => {
            const count = shipCounts[required.size] || 0;
            if (count !== required.count) {
                errors.push(`Esperado ${required.count} navio(s) de tamanho ${required.size}, encontrado ${count}`);
            }
        });
        
        // Verificar posicionamento válido
        ships.forEach((ship, index) => {
            const positions = ship.positions;
            
            // Verificar se todas as posições são válidas
            positions.forEach(pos => {
                if (pos.x < 0 || pos.x >= 10 || pos.y < 0 || pos.y >= 10) {
                    errors.push(`Navio ${index + 1}: posição fora do tabuleiro (${pos.x}, ${pos.y})`);
                    return;
                }
                
                if (grid[pos.y][pos.x]) {
                    errors.push(`Navio ${index + 1}: sobreposição de navios em (${pos.x}, ${pos.y})`);
                    return;
                }
                
                grid[pos.y][pos.x] = true;
            });
            
            // Verificar se o navio está em linha reta
            if (positions.length > 1) {
                const isHorizontal = positions.every(pos => pos.y === positions[0].y);
                const isVertical = positions.every(pos => pos.x === positions[0].x);
                
                if (!isHorizontal && !isVertical) {
                    errors.push(`Navio ${index + 1}: deve estar em linha reta`);
                }
                
                // Verificar continuidade
                if (isHorizontal) {
                    const sortedX = positions.map(p => p.x).sort((a, b) => a - b);
                    for (let i = 1; i < sortedX.length; i++) {
                        if (sortedX[i] !== sortedX[i-1] + 1) {
                            errors.push(`Navio ${index + 1}: deve ser contínuo`);
                            break;
                        }
                    }
                } else if (isVertical) {
                    const sortedY = positions.map(p => p.y).sort((a, b) => a - b);
                    for (let i = 1; i < sortedY.length; i++) {
                        if (sortedY[i] !== sortedY[i-1] + 1) {
                            errors.push(`Navio ${index + 1}: deve ser contínuo`);
                            break;
                        }
                    }
                }
            }
        });
        
        // Verificar adjacências (navios não podem se tocar)
        ships.forEach((ship, index) => {
            ship.positions.forEach(pos => {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const checkX = pos.x + dx;
                        const checkY = pos.y + dy;
                        
                        if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
                            // Verificar se há outro navio adjacente
                            const isOwnPosition = ship.positions.some(p => p.x === checkX && p.y === checkY);
                            if (!isOwnPosition && grid[checkY][checkX]) {
                                errors.push(`Navio ${index + 1}: muito próximo de outro navio`);
                            }
                        }
                    }
                }
            });
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Processar ataque
    processAttack(attackData, targetBoard) {
        const { x, y } = attackData;
        const result = {
            x: x,
            y: y,
            hit: false,
            sunk: false,
            gameOver: false,
            sunkShip: null
        };
        
        // Verificar se há navio na posição
        const hitShip = this.getShipAt(x, y, targetBoard);
        
        if (hitShip) {
            result.hit = true;
            
            // Marcar posição como atingida
            const position = hitShip.positions.find(pos => pos.x === x && pos.y === y);
            if (position) {
                position.hit = true;
            }
            
            // Verificar se o navio foi afundado
            if (hitShip.positions.every(pos => pos.hit)) {
                result.sunk = true;
                result.sunkShip = {
                    id: hitShip.id,
                    name: hitShip.name,
                    positions: hitShip.positions
                };
                
                this.statistics.shipsSunk++;
            }
            
            this.statistics.shotsHit++;
            
            // Verificar vitória
            if (this.allShipsSunk(targetBoard)) {
                result.gameOver = true;
                this.gameState.phase = 'finished';
                this.gameState.endTime = Date.now();
            }
        }
        
        this.statistics.shotsTotal++;
        
        // Registrar movimento
        this.gameState.moves.push({
            player: this.gameState.currentTurn,
            x: x,
            y: y,
            hit: result.hit,
            sunk: result.sunk,
            timestamp: Date.now()
        });
        
        return result;
    }

    // Verificar se todos os navios foram afundados
    allShipsSunk(board) {
        return board.ships.every(ship => 
            ship.positions.every(pos => pos.hit)
        );
    }

    // Obter navio em posição específica
    getShipAt(x, y, board) {
        return board.ships.find(ship => 
            ship.positions.some(pos => pos.x === x && pos.y === y)
        );
    }

    // Criar grid vazio
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < 10; y++) {
            grid[y] = new Array(10).fill(false);
        }
        return grid;
    }

    // Obter navios obrigatórios
    getRequiredShips() {
        return SHIP_TYPES.map(type => ({
            size: type.size,
            count: type.count,
            name: type.name
        }));
    }

    // Calcular precisão do jogador
    getAccuracy() {
        if (this.statistics.shotsTotal === 0) return 0;
        return (this.statistics.shotsHit / this.statistics.shotsTotal * 100).toFixed(1);
    }

    // Calcular tempo de jogo
    getGameTime() {
        if (!this.gameState.startTime) return 0;
        const endTime = this.gameState.endTime || Date.now();
        return Math.floor((endTime - this.gameState.startTime) / 1000);
    }

    // Obter estatísticas do jogo
    getGameStats() {
        return {
            shots: this.statistics.shotsTotal,
            hits: this.statistics.shotsHit,
            accuracy: this.getAccuracy(),
            shipsSunk: this.statistics.shipsSunk,
            gameTime: this.getGameTime(),
            moves: this.gameState.moves.length
        };
    }

    // Resetar estatísticas
    resetStatistics() {
        this.statistics = {
            shotsTotal: 0,
            shotsHit: 0,
            shipsSunk: 0,
            gameTime: 0
        };
    }

    // Gerar posicionamento automático de navios
    generateAutoPlacement() {
        const ships = [];
        const grid = this.createEmptyGrid();
        let shipId = 0;
        
        for (let shipType of SHIP_TYPES) {
            for (let i = 0; i < shipType.count; i++) {
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 1000) {
                    const x = Math.floor(Math.random() * 10);
                    const y = Math.floor(Math.random() * 10);
                    const horizontal = Math.random() < 0.5;
                    
                    const positions = [];
                    let valid = true;
                    
                    // Gerar posições do navio
                    for (let j = 0; j < shipType.size; j++) {
                        const posX = horizontal ? x + j : x;
                        const posY = horizontal ? y : y + j;
                        
                        if (posX >= 10 || posY >= 10) {
                            valid = false;
                            break;
                        }
                        
                        positions.push({ x: posX, y: posY });
                    }
                    
                    if (valid) {
                        // Verificar se as posições estão livres e não adjacentes
                        valid = this.checkValidPlacement(positions, grid);
                    }
                    
                    if (valid) {
                        // Marcar posições no grid
                        positions.forEach(pos => {
                            grid[pos.y][pos.x] = true;
                        });
                        
                        ships.push({
                            id: shipId++,
                            type: SHIP_TYPES.indexOf(shipType),
                            name: shipType.name,
                            size: shipType.size,
                            orientation: horizontal ? 'horizontal' : 'vertical',
                            positions: positions.map(pos => ({ ...pos, hit: false }))
                        });
                        
                        placed = true;
                    }
                    
                    attempts++;
                }
                
                if (!placed) {
                    // Se não conseguiu posicionar, recomeçar
                    return this.generateAutoPlacement();
                }
            }
        }
        
        return ships;
    }

    // Verificar se posicionamento é válido
    checkValidPlacement(positions, grid) {
        for (let pos of positions) {
            // Verificar se posição já ocupada
            if (grid[pos.y][pos.x]) {
                return false;
            }
            
            // Verificar adjacências
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const checkX = pos.x + dx;
                    const checkY = pos.y + dy;
                    
                    if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
                        if (grid[checkY][checkX]) {
                            // Verificar se é parte do mesmo navio
                            const isPartOfShip = positions.some(p => p.x === checkX && p.y === checkY);
                            if (!isPartOfShip) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        return true;
    }

    // Sugerir próximo movimento (IA básica)
    suggestMove(enemyBoard, attackHistory) {
        const suggestions = [];
        
        // Primeiro, procurar navios atingidos mas não afundados
        const hitPositions = attackHistory.filter(attack => attack.hit && !attack.sunk);
        
        if (hitPositions.length > 0) {
            // Atacar adjacente aos acertos
            hitPositions.forEach(hit => {
                const adjacent = [
                    { x: hit.x + 1, y: hit.y },
                    { x: hit.x - 1, y: hit.y },
                    { x: hit.x, y: hit.y + 1 },
                    { x: hit.x, y: hit.y - 1 }
                ];
                
                adjacent.forEach(pos => {
                    if (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
                        const alreadyAttacked = attackHistory.some(attack => 
                            attack.x === pos.x && attack.y === pos.y
                        );
                        
                        if (!alreadyAttacked) {
                            suggestions.push({ ...pos, priority: 10 });
                        }
                    }
                });
            });
        }
        
        // Se não há sugestões prioritárias, usar padrão tabuleiro de xadrez
        if (suggestions.length === 0) {
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    if ((x + y) % 2 === 0) {
                        const alreadyAttacked = attackHistory.some(attack => 
                            attack.x === x && attack.y === y
                        );
                        
                        if (!alreadyAttacked) {
                            suggestions.push({ x, y, priority: 1 });
                        }
                    }
                }
            }
        }
        
        // Ordenar por prioridade e retornar o melhor
        suggestions.sort((a, b) => b.priority - a.priority);
        return suggestions[0] || null;
    }

    // Serializar estado do jogo
    serialize() {
        return JSON.stringify({
            gameState: this.gameState,
            statistics: this.statistics
        });
    }

    // Deserializar estado do jogo
    deserialize(data) {
        const parsed = JSON.parse(data);
        this.gameState = parsed.gameState;
        this.statistics = parsed.statistics;
    }
}

// Utilitários para debug
const GameUtils = {
    // Imprimir tabuleiro no console
    printBoard(board, showShips = false) {
        console.log('   0 1 2 3 4 5 6 7 8 9');
        for (let y = 0; y < 10; y++) {
            let row = `${y}: `;
            for (let x = 0; x < 10; x++) {
                const ship = this.getShipAt(x, y, board);
                const attacked = board.attacks?.some(attack => attack.x === x && attack.y === y);
                
                if (attacked) {
                    row += ship ? 'X ' : 'O ';
                } else if (showShips && ship) {
                    row += '■ ';
                } else {
                    row += '. ';
                }
            }
            console.log(row);
        }
    },
    
    // Calcular probabilidade de acerto
    calculateHitProbability(board, attackHistory) {
        const totalCells = 100;
        const attackedCells = attackHistory.length;
        const hitCells = attackHistory.filter(attack => attack.hit).length;
        
        return {
            totalAttacked: attackedCells,
            totalHits: hitCells,
            accuracy: attackedCells > 0 ? (hitCells / attackedCells * 100).toFixed(1) : 0,
            remainingCells: totalCells - attackedCells
        };
    }
};
