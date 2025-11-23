const GRID_SIZE = 4;
const CELL_SIZE = 80;
const GAP = 12;

let tiles = [];
let score = 0;
let isMoving = false;
let tileIdCounter = 0;

const moveSound = document.getElementById('move-sound');
const mergeSound = document.getElementById('merge-sound');
const container = document.getElementById('tile-container');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const gameOverEl = document.getElementById('game-over');

let bestScore = localStorage.getItem('catDragonBest') || 0;
bestEl.innerText = bestScore;

function restartGame() {
    container.innerHTML = '';
    tiles = [];
    score = 0;
    scoreEl.innerText = '0';
    gameOverEl.classList.remove('active');
    isMoving = false;
    spawnTile();
    spawnTile();
}

function createTileElement(x, y, value) {
    const el = document.createElement('div');
    el.classList.add('tile', `val-${value}`);
    setTilePosition(el, x, y);
    return el;
}

function setTilePosition(el, x, y) {
    const xPos = x * (CELL_SIZE + GAP);
    const yPos = y * (CELL_SIZE + GAP);
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

function spawnTile() {
    const emptyCells = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (!tiles.find(t => t.x === x && t.y === y)) {
                emptyCells.push({x, y});
            }
        }
    }

    if (emptyCells.length > 0) {
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() > 0.9 ? 4 : 2;

        const el = createTileElement(cell.x, cell.y, value);
        el.classList.add('tile-new');
        container.appendChild(el);

        tiles.push({
            id: tileIdCounter++,
            x: cell.x,
            y: cell.y,
            value: value,
            element: el,
            isMerged: false
        });
    }
}

async function move(direction) {
    if (isMoving) return;

    const vectors = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }
    };
    const vector = vectors[direction];
    if (!vector) return;

    isMoving = true;
    let hasMoved = false;

    tiles.sort((a, b) => {
        if (vector.x === 1) return b.x - a.x;
        if (vector.x === -1) return a.x - b.x;
        if (vector.y === 1) return b.y - a.y;
        if (vector.y === -1) return a.y - b.y;
        return 0;
    });

    const tilesToRemove = [];
    tiles.forEach(t => t.isMerged = false);
    const newTiles = [];

    for (const tile of tiles) {
        let oldX = tile.x;
        let oldY = tile.y;

        let cell = { x: tile.x, y: tile.y };
        let next = { x: cell.x + vector.x, y: cell.y + vector.y };

        while (
            next.x >= 0 && next.x < GRID_SIZE &&
            next.y >= 0 && next.y < GRID_SIZE
        ) {
            const other = tiles.find(t => t.x === next.x && t.y === next.y && !tilesToRemove.includes(t));

            if (!other) {
                cell = next;
                next = { x: cell.x + vector.x, y: cell.y + vector.y };
            } else if (other.value === tile.value && !other.isMerged && !tile.isMerged) {

                setTilePosition(tile.element, next.x, next.y);

                tilesToRemove.push(tile);
                tilesToRemove.push(other);

                playSound(mergeSound);

                const newValue = tile.value * 2;
                score += newValue;
                scoreEl.innerText = score;

                const newEl = createTileElement(next.x, next.y, newValue);
                newEl.classList.add('tile-merged');

                const newTile = {
                    id: tileIdCounter++,
                    x: next.x,
                    y: next.y,
                    value: newValue,
                    element: newEl,
                    isMerged: true
                };

                newTiles.push(newTile);
                container.appendChild(newEl);

                hasMoved = true;
                break;
            } else {
                break;
            }
        }

        if (!tilesToRemove.includes(tile)) {
            if (cell.x !== oldX || cell.y !== oldY) {
                tile.x = cell.x;
                tile.y = cell.y;
                setTilePosition(tile.element, tile.x, tile.y);
                hasMoved = true;
            }
        }
    }

    if (hasMoved) {
        playSound(moveSound);
        await new Promise(r => setTimeout(r, 150));

        tilesToRemove.forEach(t => {
            t.element.remove();
        });

        tiles = tiles.filter(t => !tilesToRemove.includes(t));
        tiles.push(...newTiles);

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('catDragonBest', bestScore);
            bestEl.innerText = bestScore;
        }

        spawnTile();

        if (isGameOver()) {
            setTimeout(() => gameOverEl.classList.add('active'), 300);
        }
    }

    isMoving = false;
}

function isGameOver() {
    if (tiles.length < GRID_SIZE * GRID_SIZE) return false;

    for (let t of tiles) {
        const neighbors = [
            {x: t.x+1, y: t.y}, {x: t.x-1, y: t.y},
            {x: t.x, y: t.y+1}, {x: t.x, y: t.y-1}
        ];
        for (let n of neighbors) {
            const neighbor = tiles.find(o => o.x === n.x && o.y === n.y);
            if (neighbor && neighbor.value === t.value) return false;
        }
    }
    return true;
}

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

document.addEventListener('keydown', e => {
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        move(e.key);
    }
});

let startX, startY;
document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, {passive: false});

document.addEventListener('touchend', e => {
    if(!startX || !startY) return;
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;

    let dx = endX - startX;
    let dy = endY - startY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        move(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else if (Math.abs(dy) > 30) {
        move(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    startX = null; startY = null;
    e.preventDefault();
}, {passive: false});

restartGame();
