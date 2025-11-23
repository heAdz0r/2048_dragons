class Dragon2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('dragon2048-best') || 0;
        this.gameOver = false;
        this.won = false;
        
        // Audio elements
        this.backgroundMusic = new Audio('resources/background-music.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
        
        this.moveSound = new Audio('resources/move-sound.mp3');
        this.moveSound.volume = 0.5;
        
        this.mergeSound = new Audio('resources/merge-sound.mp3');
        this.mergeSound.volume = 0.6;
        
        this.victorySound = new Audio('resources/victory-sound.mp3');
        this.victorySound.volume = 0.7;
        
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
        this.createStars();
        this.createDragonPreview();
        this.updateDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.setupEventListeners();
        
        // Start background music
        try {
            this.backgroundMusic.play().catch(e => {
                console.log('Background music autoplay blocked');
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    createBoard() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            grid.appendChild(cell);
        }
        
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
    }

    createStars() {
        const starsContainer = document.getElementById('stars');
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starsContainer.appendChild(star);
        }
    }

    createDragonPreview() {
        const container = document.getElementById('dragon-preview');
        container.innerHTML = '';
        
        Object.entries(this.dragonLevels).forEach(([value, dragon]) => {
            const level = document.createElement('div');
            level.className = 'dragon-level';
            level.id = `dragon-${value}`;
            
            const icon = document.createElement('div');
            icon.className = 'dragon-icon';
            icon.style.backgroundImage = `url('${dragon.image}')`;
            
            const info = document.createElement('span');
            info.textContent = `${value}: ${dragon.name}`;
            
            level.appendChild(icon);
            level.appendChild(info);
            container.appendChild(level);
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
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

        // Touch support for mobile
        let startX, startY;
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 30) {
                    this.move('left');
                } else if (diffX < -30) {
                    this.move('right');
                }
            } else {
                if (diffY > 30) {
                    this.move('up');
                } else if (diffY < -30) {
                    this.move('down');
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
            this.playSound(this.moveSound);
            this.addRandomTile();
            this.render();
            this.updateDisplay();
            
            if (this.checkWin() && !this.won) {
                this.won = true;
                this.playSound(this.victorySound);
                setTimeout(() => {
                    alert('Поздравляем! Вы собрали МЕГАДРАКОНА!');
                }, 300);
            }
            
            if (this.checkGameOver()) {
                this.gameOver = true;
                document.getElementById('game-over').classList.add('show');
            }
        }
    }

    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const originalRow = [...this.board[row]];
            const newRow = this.processRow(originalRow.filter(val => val !== 0));
            
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
            
            const originalColumn = [...column];
            const newColumn = this.processRow(column.filter(val => val !== 0));
            
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
        let merged = false;
        
        while (i < row.length) {
            if (i < row.length - 1 && row[i] === row[i + 1]) {
                const mergedValue = row[i] * 2;
                result.push(mergedValue);
                this.score += mergedValue;
                i += 2;
                merged = true;
                
                // Unlock dragon level
                this.unlockDragonLevel(mergedValue);
            } else {
                result.push(row[i]);
                i++;
            }
        }
        
        if (merged) {
            this.playSound(this.mergeSound);
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
        const grid = document.getElementById('grid');
        const existingTiles = grid.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    tile.textContent = value;
                    
                    // Add dragon image background
                    const dragon = this.dragonLevels[value];
                    if (dragon) {
                        tile.style.backgroundImage = `url('${dragon.image}')`;
                        tile.style.backgroundSize = 'cover';
                        tile.style.backgroundPosition = 'center';
                    }
                    
                    tile.style.left = `${col * 90 + 10}px`;
                    tile.style.top = `${row * 90 + 10}px`;
                    
                    grid.appendChild(tile);
                }
            }
        }
    }

    unlockDragonLevel(value) {
        const dragonLevel = document.getElementById(`dragon-${value}`);
        if (dragonLevel && !dragonLevel.classList.contains('unlocked')) {
            dragonLevel.classList.add('unlocked');
            
            // Add celebration effect
            setTimeout(() => {
                dragonLevel.style.animation = 'tile-merge 0.5s ease-in-out';
                setTimeout(() => {
                    dragonLevel.style.animation = '';
                }, 500);
            }, 100);
        }
    }

    playSound(audio) {
        try {
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('Sound play blocked');
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
        
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

    restart() {
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
 