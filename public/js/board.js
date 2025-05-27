// Gerenciador de Tabuleiro
class BattleBoard {
    constructor(boardElement, type, app) {
        this.element = boardElement;
        this.type = type; // 'player' ou 'enemy'
        this.app = app;
        this.grid = this.createGrid();
        this.ships = [];
        this.attacks = [];
        
        this.init();
    }

    init() {
        this.render();
        if (this.type === 'enemy') {
            this.setupAttackListeners();
        }
    }

    createGrid() {
        const grid = [];
        for (let y = 0; y < 10; y++) {
            grid[y] = [];
            for (let x = 0; x < 10; x++) {
                grid[y][x] = {
                    x: x,
                    y: y,
                    hasShip: false,
                    isHit: false,
                    isAttacked: false,
                    shipId: null
                };
            }
        }
        return grid;
    }

    render() {
        this.element.innerHTML = '';
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const cellData = this.grid[y][x];
                
                // Aplicar classes baseadas no estado
                if (cellData.hasShip && this.type === 'player') {
                    cell.classList.add('ship');
                }
                
                if (cellData.isAttacked) {
                    if (cellData.isHit) {
                        cell.classList.add('hit');
                        if (this.isShipSunk(cellData.shipId)) {
                            cell.classList.add('sunk');
                        }
                    } else {
                        cell.classList.add('miss');
                    }
                }
                
                this.element.appendChild(cell);
            }
        }
    }

    setupAttackListeners() {
        this.element.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            this.handleAttackClick(x, y);
        });
    }

    handleAttackClick(x, y) {
        const cellData = this.grid[y][x];
        
        // Verificar se já foi atacada
        if (cellData.isAttacked) {
            this.app.showError('Esta posição já foi atacada!');
            return;
        }
        
        // Verificar se é turno do jogador
        if (!this.app.gameState.isMyTurn) {
            this.app.showError('Não é seu turno!');
            return;
        }
        
        // Realizar ataque
        const success = this.app.attack(x, y);
        if (success) {
            // Marcar temporariamente para evitar cliques múltiplos
            cellData.isAttacked = true;
            this.render();
        }
    }

    markAttack(x, y, hit, sunkShipData) {
        const cellData = this.grid[y][x];
        cellData.isAttacked = true;
        cellData.isHit = hit;
        
        if (hit && sunkShipData) {
            // Marcar todas as células do navio afundado
            sunkShipData.positions.forEach(pos => {
                const sunkCell = this.grid[pos.y][pos.x];
                sunkCell.shipId = sunkShipData.id;
            });
        }
        
        this.render();
        
        // Animação de feedback
        this.animateAttack(x, y, hit);
    }

    animateAttack(x, y, hit) {
        const cell = this.element.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        
        cell.style.transform = 'scale(1.2)';
        cell.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            cell.style.transform = 'scale(1)';
        }, 200);
        
        // Efeito de ripple
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${hit ? '#ef4444' : '#6b7280'};
            opacity: 0.6;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        cell.style.position = 'relative';
        cell.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    setShips(ships) {
        this.ships = ships;
        
        // Marcar células com navios
        ships.forEach((ship, shipIndex) => {
            ship.positions.forEach(pos => {
                const cellData = this.grid[pos.y][pos.x];
                cellData.hasShip = true;
                cellData.shipId = shipIndex;
            });
        });
        
        this.render();
    }

    isShipSunk(shipId) {
        if (shipId === null) return false;
        
        const ship = this.ships[shipId];
        if (!ship) return false;
        
        return ship.positions.every(pos => 
            this.grid[pos.y][pos.x].isAttacked && this.grid[pos.y][pos.x].isHit
        );
    }

    getShipAt(x, y) {
        const cellData = this.grid[y][x];
        if (cellData.shipId !== null) {
            return this.ships[cellData.shipId];
        }
        return null;
    }

    // Método para destacar células durante hover (usado no tabuleiro inimigo)
    highlightCell(x, y, highlight = true) {
        const cell = this.element.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        
        if (highlight) {
            if (!this.grid[y][x].isAttacked) {
                cell.style.background = 'rgba(59, 130, 246, 0.3)';
                cell.style.transform = 'scale(1.05)';
            }
        } else {
            cell.style.background = '';
            cell.style.transform = '';
        }
    }

    // Método para obter estatísticas do tabuleiro
    getStats() {
        let totalCells = 100;
        let shipCells = 0;
        let hitCells = 0;
        let missCells = 0;
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = this.grid[y][x];
                if (cell.hasShip) shipCells++;
                if (cell.isAttacked) {
                    if (cell.isHit) hitCells++;
                    else missCells++;
                }
            }
        }
        
        return {
            totalCells,
            shipCells,
            hitCells,
            missCells,
            accuracy: missCells + hitCells > 0 ? (hitCells / (hitCells + missCells) * 100).toFixed(1) : 0
        };
    }
}

// Adicionar CSS para animação de ripple
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 0.6;
        }
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);
