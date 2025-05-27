// Definições dos navios
const SHIP_TYPES = [
    { name: 'Porta-aviões', size: 5, count: 1, icon: '🚢' },
    { name: 'Encouraçado', size: 4, count: 1, icon: '⛵' },
    { name: 'Cruzador', size: 3, count: 2, icon: '🛥️' },
    { name: 'Destroyer', size: 2, count: 3, icon: '🚤' },
    { name: 'Submarino', size: 1, count: 4, icon: '🔱' }
];

// Gerenciador de Posicionamento de Navios
class ShipPlacer {
    constructor(boardElement, app) {
        this.element = boardElement;
        this.app = app;
        this.grid = this.createGrid();
        this.ships = this.createShipList();
        this.currentShipIndex = 0;
        this.currentOrientation = 'horizontal'; // 'horizontal' ou 'vertical'
        this.placedShips = [];
        this.previewCells = [];
        
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.updateShipsRemaining();
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
                    shipId: null
                };
            }
        }
        return grid;
    }

    createShipList() {
        const ships = [];
        SHIP_TYPES.forEach((type, typeIndex) => {
            for (let i = 0; i < type.count; i++) {
                ships.push({
                    id: ships.length,
                    type: typeIndex,
                    name: type.name,
                    size: type.size,
                    icon: type.icon,
                    placed: false
                });
            }
        });
        return ships;
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
                
                if (cellData.hasShip) {
                    cell.classList.add('ship');
                    const ship = this.placedShips.find(s => s.id === cellData.shipId);
                    if (ship) {
                        cell.classList.add(ship.orientation === 'horizontal' ? 'ship-horizontal' : 'ship-vertical');
                    }
                }
                
                this.element.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        // Clique para posicionar navio
        this.element.addEventListener('click', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) return;
            
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            this.placeCurrentShip(x, y);
        });

        // Hover para preview
        this.element.addEventListener('mousemove', (e) => {
            const cell = e.target.closest('.board-cell');
            if (!cell) {
                this.clearPreview();
                return;
            }
            
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            this.showPreview(x, y);
        });

        this.element.addEventListener('mouseleave', () => {
            this.clearPreview();
        });

        // Touch events para mobile
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (cell && cell.classList.contains('board-cell')) {
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                this.showPreview(x, y);
            }
        });

        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const cell = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (cell && cell.classList.contains('board-cell')) {
                const x = parseInt(cell.dataset.x);
                const y = parseInt(cell.dataset.y);
                this.placeCurrentShip(x, y);
            }
            
            this.clearPreview();
        });
    }

    getCurrentShip() {
        return this.ships.find(ship => !ship.placed);
    }

    placeCurrentShip(x, y) {
        const ship = this.getCurrentShip();
        if (!ship) return;

        if (this.canPlaceShip(x, y, ship.size, this.currentOrientation)) {
            this.placeShip(ship, x, y, this.currentOrientation);
            this.updateShipsRemaining();
            
            if (this.allShipsPlaced()) {
                this.app.updateGameStatus('Todos os navios posicionados! Clique em Confirmar.');
                document.getElementById('confirm-placement').disabled = false;
            } else {
                const nextShip = this.getCurrentShip();
                this.app.updateGameStatus(`Posicione: ${nextShip.name} (${nextShip.size} células)`);
            }
        } else {
            this.app.showError('Não é possível posicionar o navio nesta posição!');
        }
    }

    canPlaceShip(x, y, size, orientation) {
        const positions = this.getShipPositions(x, y, size, orientation);
        
        // Verificar se todas as posições estão dentro do tabuleiro
        for (let pos of positions) {
            if (pos.x < 0 || pos.x >= 10 || pos.y < 0 || pos.y >= 10) {
                return false;
            }
            
            // Verificar se a posição já tem navio
            if (this.grid[pos.y][pos.x].hasShip) {
                return false;
            }
        }
        
        // Verificar adjacências (navios não podem se tocar)
        for (let pos of positions) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = pos.x + dx;
                    const checkY = pos.y + dy;
                    
                    if (checkX >= 0 && checkX < 10 && checkY >= 0 && checkY < 10) {
                        if (this.grid[checkY][checkX].hasShip) {
                            // Permitir adjacência apenas se for parte do mesmo navio sendo posicionado
                            const isPartOfCurrentShip = positions.some(p => p.x === checkX && p.y === checkY);
                            if (!isPartOfCurrentShip) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        return true;
    }

    getShipPositions(x, y, size, orientation) {
        const positions = [];
        
        for (let i = 0; i < size; i++) {
            if (orientation === 'horizontal') {
                positions.push({ x: x + i, y: y });
            } else {
                positions.push({ x: x, y: y + i });
            }
        }
        
        return positions;
    }

    placeShip(ship, x, y, orientation) {
        const positions = this.getShipPositions(x, y, ship.size, orientation);
        
        // Marcar células no grid
        positions.forEach(pos => {
            this.grid[pos.y][pos.x].hasShip = true;
            this.grid[pos.y][pos.x].shipId = ship.id;
        });
        
        // Adicionar à lista de navios posicionados
        ship.placed = true;
        this.placedShips.push({
            id: ship.id,
            type: ship.type,
            name: ship.name,
            size: ship.size,
            orientation: orientation,
            positions: positions.map(pos => ({ ...pos, hit: false }))
        });
        
        this.render();
    }

    showPreview(x, y) {
        this.clearPreview();
        
        const ship = this.getCurrentShip();
        if (!ship) return;
        
        const positions = this.getShipPositions(x, y, ship.size, this.currentOrientation);
        const canPlace = this.canPlaceShip(x, y, ship.size, this.currentOrientation);
        
        positions.forEach(pos => {
            if (pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
                const cell = this.element.querySelector(`[data-x="${pos.x}"][data-y="${pos.y}"]`);
                if (cell) {
                    cell.classList.add('ship-preview');
                    if (!canPlace) {
                        cell.classList.add('invalid');
                    }
                    this.previewCells.push(cell);
                }
            }
        });
    }

    clearPreview() {
        this.previewCells.forEach(cell => {
            cell.classList.remove('ship-preview', 'invalid');
        });
        this.previewCells = [];
    }

    rotateCurrentShip() {
        this.currentOrientation = this.currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        this.clearPreview();
        
        const ship = this.getCurrentShip();
        if (ship) {
            this.app.updateGameStatus(`${ship.name} - Orientação: ${this.currentOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'}`);
        }
    }

    autoPlaceShips() {
        // Limpar navios já posicionados
        this.clearAllShips();
        
        // Posicionar todos os navios automaticamente
        for (let ship of this.ships) {
            if (ship.placed) continue;
            
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                if (this.canPlaceShip(x, y, ship.size, orientation)) {
                    this.placeShip(ship, x, y, orientation);
                    placed = true;
                }
                
                attempts++;
            }
            
            if (!placed) {
                this.app.showError('Erro ao posicionar navios automaticamente. Tente novamente.');
                this.clearAllShips();
                return;
            }
        }
        
        this.updateShipsRemaining();
        this.app.updateGameStatus('Navios posicionados automaticamente! Clique em Confirmar.');
        document.getElementById('confirm-placement').disabled = false;
    }

    clearAllShips() {
        // Limpar grid
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                this.grid[y][x].hasShip = false;
                this.grid[y][x].shipId = null;
            }
        }
        
        // Resetar navios
        this.ships.forEach(ship => {
            ship.placed = false;
        });
        
        this.placedShips = [];
        this.currentShipIndex = 0;
        
        this.render();
        this.updateShipsRemaining();
        document.getElementById('confirm-placement').disabled = true;
    }

    updateShipsRemaining() {
        const container = document.getElementById('ships-remaining');
        container.innerHTML = '';
        
        const remainingShips = this.ships.filter(ship => !ship.placed);
        
        remainingShips.forEach(ship => {
            const shipIcon = document.createElement('div');
            shipIcon.className = 'ship-icon';
            shipIcon.title = `${ship.name} (${ship.size} células)`;
            shipIcon.textContent = ship.icon;
            container.appendChild(shipIcon);
        });
        
        // Atualizar status
        const currentShip = this.getCurrentShip();
        if (currentShip) {
            this.app.updateGameStatus(`Posicione: ${currentShip.name} (${currentShip.size} células) - ${this.currentOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'}`);
        }
    }

    allShipsPlaced() {
        return this.ships.every(ship => ship.placed);
    }

    getPlacedShips() {
        return this.placedShips.map(ship => ({
            id: ship.id,
            type: ship.type,
            name: ship.name,
            size: ship.size,
            orientation: ship.orientation,
            positions: ship.positions.map(pos => ({ ...pos }))
        }));
    }

    removeShip(shipId) {
        const shipIndex = this.placedShips.findIndex(ship => ship.id === shipId);
        if (shipIndex === -1) return;
        
        const ship = this.placedShips[shipIndex];
        
        // Remover do grid
        ship.positions.forEach(pos => {
            this.grid[pos.y][pos.x].hasShip = false;
            this.grid[pos.y][pos.x].shipId = null;
        });
        
        // Remover da lista
        this.placedShips.splice(shipIndex, 1);
        
        // Marcar como não posicionado
        const originalShip = this.ships.find(s => s.id === shipId);
        if (originalShip) {
            originalShip.placed = false;
        }
        
        this.render();
        this.updateShipsRemaining();
        document.getElementById('confirm-placement').disabled = !this.allShipsPlaced();
    }
}
