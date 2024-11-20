document.addEventListener("DOMContentLoaded", () => {
    const mazeContainer = document.getElementById("maze-container");
    const statusElement = document.getElementById("status");
    const timerElement = document.getElementById("timer");
    const startButton = document.getElementById("start-game");
    const mazeSizeSelector = document.getElementById("maze-size");

    let maze = [];
    let playerPosition = { row: 0, col: 0 };
    let enemyPosition = { row: 0, col: 0 };
    let exitPosition = { row: 0, col: 0 };
    let timer;
    let timeElapsed = 0;
    let enemyTimer;
    let gameOver = false; // Added gameOver flag

    startButton.addEventListener("click", () => {
        const size = parseInt(mazeSizeSelector.value);
        startGame(size);
    });

    function startGame(size) {
        resetGame();
        gameOver = false; // Game is active
        generateMaze(size);
        placeExit(size);
        ensureExitAccessible(size);
        placeEnemy();
        renderMaze();
        startTimer();
        moveEnemy();
        statusElement.textContent = "Navigate the maze and avoid the enemy!";
    }

    // Generate maze using Recursive Backtracker
    function generateMaze(size) {
        maze = Array.from({ length: size }, () => Array(size).fill('wall'));

        const stack = [];
        let currentCell = { row: 0, col: 0 };
        maze[currentCell.row][currentCell.col] = 'path';
        stack.push(currentCell);

        while (stack.length > 0) {
            const neighbors = getUnvisitedNeighbors(currentCell, size);
            if (neighbors.length > 0) {
                const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWall(currentCell, nextCell);
                maze[nextCell.row][nextCell.col] = 'path';
                stack.push(currentCell);
                currentCell = nextCell;
            } else {
                currentCell = stack.pop();
            }
        }

        playerPosition = { row: 0, col: 0 };
    }

    function getUnvisitedNeighbors(cell, size) {
        const neighbors = [];
        const directions = [
            { row: -2, col: 0 }, // Up
            { row: 2, col: 0 },  // Down
            { row: 0, col: -2 }, // Left
            { row: 0, col: 2 },  // Right
        ];

        directions.forEach(dir => {
            const newRow = cell.row + dir.row;
            const newCol = cell.col + dir.col;
            if (
                newRow >= 0 &&
                newRow < size &&
                newCol >= 0 &&
                newCol < size &&
                maze[newRow][newCol] === 'wall'
            ) {
                neighbors.push({ row: newRow, col: newCol });
            }
        });

        return neighbors;
    }

    function removeWall(current, next) {
        const wallRow = current.row + (next.row - current.row) / 2;
        const wallCol = current.col + (next.col - current.col) / 2;
        maze[wallRow][wallCol] = 'path';
    }

    function placeExit(size) {
        exitPosition = { row: size - 1, col: size - 1 };
        maze[exitPosition.row][exitPosition.col] = 'path';
    }

    // Ensure the exit is accessible
    function ensureExitAccessible(size) {
        const row = exitPosition.row;
        const col = exitPosition.col;

        // Check if the exit is connected to the maze
        const directions = [
            { row: -1, col: 0 }, // Up
            { row: 0, col: -1 }, // Left
        ];

        let connected = false;

        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (newRow >= 0 && newCol >= 0 && maze[newRow][newCol] === 'path') {
                connected = true;
                break;
            }
        }

        if (!connected) {
            // Carve a path to one of the adjacent cells
            if (row > 0 && maze[row - 1][col] === 'wall') {
                maze[row - 1][col] = 'path';
                removeWall({ row: row - 1, col }, { row, col });
            } else if (col > 0 && maze[row][col - 1] === 'wall') {
                maze[row][col - 1] = 'path';
                removeWall({ row, col: col - 1 }, { row, col });
            }
        }

        // Mark the exit cell
        maze[row][col] = 'exit';
    }

    function placeEnemy() {
        const pathCells = [];
        const minDistance = Math.floor(maze.length / 2); // Minimum distance from player and exit

        maze.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                if (
                    tile === 'path' &&
                    !(rowIndex === playerPosition.row && colIndex === playerPosition.col) &&
                    !(rowIndex === exitPosition.row && colIndex === exitPosition.col)
                ) {
                    const distanceToPlayer = Math.abs(rowIndex - playerPosition.row) + Math.abs(colIndex - playerPosition.col);
                    const distanceToExit = Math.abs(rowIndex - exitPosition.row) + Math.abs(colIndex - exitPosition.col);
                    if (distanceToPlayer >= minDistance && distanceToExit >= minDistance) {
                        pathCells.push({ row: rowIndex, col: colIndex });
                    }
                }
            });
        });

        if (pathCells.length > 0) {
            enemyPosition = pathCells[Math.floor(Math.random() * pathCells.length)];
        } else {
            // Fallback if no suitable position is found
            enemyPosition = { row: Math.floor(maze.length / 2), col: Math.floor(maze.length / 2) };
        }
    }

    function renderMaze() {
        mazeContainer.innerHTML = "";
        mazeContainer.style.gridTemplateColumns = `repeat(${maze.length}, 30px)`;

        maze.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileElement = document.createElement("div");
                tileElement.classList.add("tile", tile);

                if (rowIndex === playerPosition.row && colIndex === playerPosition.col) {
                    tileElement.classList.add("player");
                } else if (rowIndex === enemyPosition.row && colIndex === enemyPosition.col) {
                    tileElement.classList.add("enemy");
                } else if (rowIndex === exitPosition.row && colIndex === exitPosition.col) {
                    tileElement.classList.add("exit");
                }

                mazeContainer.appendChild(tileElement);
            });
        });
    }

    document.addEventListener("keydown", (e) => {
        if (gameOver) return; // Prevent movement if game is over

        const direction = {
            ArrowUp: { row: -1, col: 0 },
            ArrowDown: { row: 1, col: 0 },
            ArrowLeft: { row: 0, col: -1 },
            ArrowRight: { row: 0, col: 1 },
        }[e.key];
        if (direction) {
            const newRow = playerPosition.row + direction.row;
            const newCol = playerPosition.col + direction.col;
            if (isValidMove(newRow, newCol)) {
                playerPosition = { row: newRow, col: newCol };
                checkGameState();
                renderMaze();
            }
        }
    });

    function moveEnemy() {
        let previousEnemyPosition = { ...enemyPosition };
        enemyTimer = setInterval(() => {
            if (gameOver) return; // Stop enemy movement if game is over

            const directions = shuffleArray([
                { row: -1, col: 0 },
                { row: 1, col: 0 },
                { row: 0, col: -1 },
                { row: 0, col: 1 },
            ]);

            for (const dir of directions) {
                const newRow = enemyPosition.row + dir.row;
                const newCol = enemyPosition.col + dir.col;
                if (
                    isValidMove(newRow, newCol) &&
                    !(newRow === previousEnemyPosition.row && newCol === previousEnemyPosition.col)
                ) {
                    previousEnemyPosition = { ...enemyPosition };
                    enemyPosition = { row: newRow, col: newCol };
                    break;
                }
            }

            checkGameState();
            renderMaze();
        }, 800);
    }

    function isValidMove(row, col) {
        return (
            row >= 0 &&
            col >= 0 &&
            row < maze.length &&
            col < maze[0].length &&
            maze[row][col] !== 'wall'
        );
    }

    function checkGameState() {
        if (playerPosition.row === exitPosition.row && playerPosition.col === exitPosition.col) {
            statusElement.textContent = "You escaped the maze!";
            clearInterval(timer);
            clearInterval(enemyTimer);
            gameOver = true; // Game is over
        } else if (
            playerPosition.row === enemyPosition.row &&
            playerPosition.col === enemyPosition.col
        ) {
            statusElement.textContent = "The enemy caught you! Game over.";
            clearInterval(timer);
            clearInterval(enemyTimer);
            gameOver = true; // Game is over
        }
    }

    function startTimer() {
        timerElement.textContent = `Time: 0s`;
        timeElapsed = 0;
        timer = setInterval(() => {
            if (gameOver) return; // Stop timer if game is over
            timeElapsed++;
            timerElement.textContent = `Time: ${timeElapsed}s`;
        }, 1000);
    }

    function resetGame() {
        clearInterval(timer);
        clearInterval(enemyTimer);
        timeElapsed = 0;
        timerElement.textContent = "Time: 0s";
        statusElement.textContent = "";
        playerPosition = { row: 0, col: 0 };
        enemyPosition = { row: 0, col: 0 };
        mazeContainer.innerHTML = "";
        gameOver = false; // Reset game over flag
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
