class DragonQuest2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('dragon2048-best') || 0;
        this.gameOver = false;
        this.won = false;
        this.dragonsFound = new Set();
        this.currentMenu = 'main-menu';
        
        // Dragon evolution mapping
        this.dragonLevels = {
            2: { name: 'Яйцо', image: 'resources/dragon-egg.png' },
            4: { name: 'Дракончик', image: 'resources/baby-dragon.png' },
            8: { name: 'Юный дракон', image: 'resources/young-dragon.png' },
            16: { name: 'Дракон', image: 'resources/dragon.png' },
            32: { name: 'Огненный дракон', image: 'resources/fire-dragon.png' },
            64: { name: 'Ледяной дракон', image: 'resources/ice-dragon.png' },
            128: { name: 'Электрический дракон', image: 'resources/lightning-dragon.png' },
            256: { name: 'Теневой дракон', image: 'resources/shadow-dragon.png' },
            512: { name: 'Золотой дракон', image: 'resources/golden-dragon.png' },
            1024: { name: 'Древний дракон', image: 'resources/ancient-dragon.png' },
            2048: { name: 'МЕГАДРАКОН', image: 'resources/mega-dragon.png' }
        };
        
        this.init();
    }

    init() {
        this.createBoard();
        this.setupEventListeners();
        this.showMainMenu();
        this.updateDisplay();
    }

    createBoard() {
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';
        
        // Create grid cells
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            grid.appendChild(cell);
        }
        
        // Initialize board array
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.currentMenu !== null || this.gameOver) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });

        // Touch controls for mobile
        let startX, startY;
        document.addEventListener('touchstart', (e) => {
            if (this.currentMenu !== null || this.gameOver) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (this.currentMenu !== null || this.gameOver || !startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 30) {
                    if (diffX > 0) {
                        this.move('left');
                    } else {
                        this.move('right');
                    }
                }
            } else {
                if (Math.abs(diffY) > 30) {
                    if (diffY > 0) {
                        this.move('up');
                    } else {
                        this.move('down');
                    }
                }
            }
            
            startX = null;
            startY = null;
        });
    }

    move(direction) {
        const previousBoard = this.board.map(row => [...row]);
        let moved = false;
        
        switch(direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            this.addRandomTile();
            this.render();
            this.updateDisplay();
            
            if (this.checkWin() && !this.won) {
                this.won = true;
                setTimeout(() => {
                    this.showVictory();
                }, 500);
            }
            
            if (this.checkGameOver()) {
                setTimeout(() => {
                    this.showGameOver();
                }, 500);
            }
        }
    }

    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const originalRow = [...this.board[row]];
            const filteredRow = originalRow.filter(val => val !== 0);
            const newRow = this.processRow(filteredRow);
            
            while (newRow.length < this.size) {
                newRow.push(0);
            }
            
            if (!this.arraysEqual(this.board[row], newRow)) {
                moved = true;
            }
            
            this.board[row] = newRow;
        }
        
        return moved;
    }

    moveRight() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const originalRow = [...this.board[row]];
            const filteredRow = originalRow.filter(val => val !== 0);
            const newRow = this.processRow(filteredRow.reverse()).reverse();
            
            while (newRow.length < this.size) {
                newRow.unshift(0);
            }
            
            if (!this.arraysEqual(this.board[row], newRow)) {
                moved = true;
            }
            
            this.board[row] = newRow;
        }
        
        return moved;
    }

    moveUp() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [];
            for (let row = 0; row < this.size; row++) {
                column.push(this.board[row][col]);
            }
            
            const filteredColumn = column.filter(val => val !== 0);
            const newColumn = this.processRow(filteredColumn);
            
            while (newColumn.length < this.size) {
                newColumn.push(0);
            }
            
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== newColumn[row]) {
                    moved = true;
                }
                this.board[row][col] = newColumn[row];
            }
        }
        
        return moved;
    }

    moveDown() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [];
            for (let row = 0; row < this.size; row++) {
                column.push(this.board[row][col]);
            }
            
            const filteredColumn = column.filter(val => val !== 0);
            const newColumn = this.processRow(filteredColumn.reverse()).reverse();
            
            while (newColumn.length < this.size) {
                newColumn.unshift(0);
            }
            
            for (let row = 0; row < this.size; row++) {
                if (this.board[row][col] !== newColumn[row]) {
                    moved = true;
                }
                this.board[row][col] = newColumn[row];
            }
        }
        
        return moved;
    }

    processRow(row) {
        const result = [];
        let i = 0;
        
        while (i < row.length) {
            if (i < row.length - 1 && row[i] === row[i + 1]) {
                const mergedValue = row[i] * 2;
                result.push(mergedValue);
                this.score += mergedValue;
                this.dragonsFound.add(mergedValue);
                i += 2;
            } else {
                result.push(row[i]);
                i++;
            }
        }
        
        return result;
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }

    addRandomTile() {
        const emptyCells = [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render() {
        const grid = document.getElementById('game-grid');
        
        // Remove existing tiles
        const existingTiles = grid.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        // Render current board
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    
                    const dragon = this.dragonLevels[value];
                    
                    // Create tile content
                    const valueDiv = document.createElement('div');
                    valueDiv.className = 'tile-value';
                    valueDiv.textContent = value;
                    
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'tile-name';
                    nameDiv.textContent = dragon.name;
                    
                    tile.appendChild(valueDiv);
                    tile.appendChild(nameDiv);
                    
                    // Position tile
                    tile.style.left = `${col * 92 + 10}px`;
                    tile.style.top = `${row * 92 + 10}px`;
                    
                    // Add dragon image if available
                    if (dragon.image) {
                        tile.style.backgroundImage = `url('${dragon.image}')`;
                        tile.style.backgroundSize = 'cover';
                        tile.style.backgroundPosition = 'center';
                    }
                    
                    grid.appendChild(tile);
                }
            }
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        document.getElementById('dragons-found').textContent = `${this.dragonsFound.size}/11`;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('dragon2048-best', this.bestScore);
        }
    }

    checkWin() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGameOver() {
        // Check for empty cells
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Check for possible merges
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const current = this.board[row][col];
                
                // Check right
                if (col < this.size - 1 && this.board[row][col + 1] === current) {
                    return false;
                }
                
                // Check down
                if (row < this.size - 1 && this.board[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Menu functions
    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('main-menu').classList.remove('hidden');
        this.currentMenu = 'main-menu';
    }

    showInstructions() {
        this.hideAllMenus();
        document.getElementById('instructions-menu').classList.remove('hidden');
        this.currentMenu = 'instructions-menu';
    }

    showAbout() {
        this.hideAllMenus();
        document.getElementById('about-menu').classList.remove('hidden');
        this.currentMenu = 'about-menu';
    }

    showVictory() {
        this.hideAllMenus();
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-dragons').textContent = `${this.dragonsFound.size}/11`;
        document.getElementById('victory-menu').classList.remove('hidden');
        this.currentMenu = 'victory-menu';
    }

    showGameOver() {
        this.hideAllMenus();
        document.getElementById('final-score-over').textContent = this.score;
        document.getElementById('final-dragons-over').textContent = `${this.dragonsFound.size}/11`;
        document.getElementById('game-over-menu').classList.remove('hidden');
        this.currentMenu = 'game-over-menu';
    }

    hideAllMenus() {
        const menus = ['main-menu', 'instructions-menu', 'about-menu', 'victory-menu', 'game-over-menu'];
        menus.forEach(menuId => {
            document.getElementById(menuId).classList.add('hidden');
        });
        this.currentMenu = null;
    }

    showMenu() {
        this.showMainMenu();
    }

    startNewGame() {
        this.hideAllMenus();
        this.restart();
    }

    restart() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.dragonsFound.clear();
        
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.updateDisplay();
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new DragonQuest2048();
});