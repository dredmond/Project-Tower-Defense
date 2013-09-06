/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

CellType = {Wall: 0, Tower: 1, Nothing: 2, Goal: 3}

function Cell(size, x, y) {
    this.cellType = CellType.Nothing;
    this.cellSize = size;

    this.x = x;
    this.y = y;

    // Used for pathfinding
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.visited = false;
    this.parent = null;

    this.pointInCell = function(x, y) {
        var cellScreenX = this.x * this.cellSize;
        var cellScreenY = this.y * this.cellSize;

        if (x >= cellScreenX &&
            x <= cellScreenX + this.cellSize &&
            y >= cellScreenY &&
            y <= cellScreenY + this.cellSize) {
            return true;
        }

        return false;
    }

    this.screenX = function() {
        return this.x * this.cellSize;
    }

    this.screenY = function() {
        return this.y * this.cellSize;
    }

    this.isWalkable = function() {
        return (this.cellType == CellType.Nothing || this.cellType == CellType.Goal) ? true : false;
    }

    this.draw = function(context2D) {

        // This will only be used to draw walls and maybe other terrain types in the future.
        switch (this.cellType) {
            case CellType.Wall:
                break;
        }
    }
}

function GameMap(width, height) {
    this.width = width;          // Width of the map in cells
    this.height = height;        // Height of the map in cells
    this.map = new Array(width); // map[x][y] = Cell
    this.cellSize = 16;          // Size of a Cell in pixels
    this.towers = new Array();   // List of Towers on the map
    this.bullets = new Array();  // List of Bullets that have been shot from towers
    this.enemys = new Array();
    this.selectedTower = null;   // The tower a user has selected.
    this.currentTowerID = 0;     // Used to tell what the next towerID will be so we don't reuse it.
    this.endCell = null;
    this.lastEnemySpawn = 0;
    this.fastPath = null;
    this.wave = 0;                // Wave Counter
    this.waveTime = 15000;        // Next Wave Time Setting
    this.nextWaveTime = 15000;    // Time Til Next Wave In Milliseconds
    this.waveSpawnTime = 750;     // Enemy Spawn Time In Milliseconds.
    this.enemiesSpawned = 0;
    this.timeTaken = 0;

    this.init = function() {

        // Load Resources
        NetGame.ImageResourceManager.createResource('Enemy', './Images/Enemy.png');

        // Initialize Map!
        for (var i = 0; i < this.width; i++) {
            this.map[i] = new Array(this.height);

            // Create cells for each floor tile.
            for (var j = 0; j < this.height; j++) {
                this.map[i][j] = new Cell(this.cellSize, i, j);
            }
        }

        this.endCell = this.map[this.width - 1][this.height - 1];
        this.endCell.cellType = CellType.Goal;

        // Calculate current fast path.
        this.resetEnemyPaths();
    }

    this.draw = function(context2D) {

        // Draw Towers
        for (var i = 0; i < this.towers.length; i++) {
            this.towers[i].draw(context2D, false);
        }

        if (this.selectedTower) {
            // Draw the selected tower!
            this.selectedTower.draw(context2D, true);
        }

        // Draw Enemies
        for (i = 0; i < this.enemys.length; i++) {
            this.enemys[i].draw(context2D);
        }

        // Draw Bullets
        for (i = 0; i < this.bullets.length; i++) {
            this.bullets[i].draw(context2D);
        }
    }

    this.spawn = function(lastFrameTime) {
        if (NetGame.isGameOver == false) {
            this.nextWaveTime -= lastFrameTime;

            if (this.nextWaveTime < 0) {
                this.nextWaveTime = 0;
            }

            if (this.enemiesSpawned < 20 && this.nextWaveTime == 0) {
                this.lastEnemySpawn += lastFrameTime;
                if (this.lastEnemySpawn >= this.waveSpawnTime) {
                    if (this.enemiesSpawned == 0) {
                        this.wave++;
                    }

                    this.enemiesSpawned++;
                    this.enemys.push(new Enemy(this.wave, 0, -50, this.map[0][0], this.endCell, this.fastPath));
                    this.lastEnemySpawn = 0;
                }
            }

            // Reset Timers
            if (this.enemiesSpawned == 20) {
                this.nextWaveTime = this.waveTime;
                this.enemiesSpawned = 0;
            }
        }
    }

    this.update = function(lastFrameTime) {
        var startTime = new Date();

        // Do Wave Spawn!
        this.spawn(lastFrameTime);

        // Do bullet calculations.
        for (j = this.bullets.length - 1; j >= 0; j--) {
            this.bullets[j].update(lastFrameTime);

            if (this.bullets[j].hasCollision()) {
                this.bullets.splice(j, 1);
            } else if (this.bullets[j].isOutsideMap(this.width * this.cellSize, this.height * this.cellSize)) {
                this.bullets.splice(j, 1);
            }
        }

        // Remove Dead enemies and update current ones.
        for (var i = this.enemys.length - 1; i >= 0; i--) {
            if (!this.enemys[i].isDead()) {
                // Update Towers
                this.enemys[i].update(lastFrameTime, this.map);
            } else {
                this.removeEnemy(this.enemys[i]);
            }
        }

        // Rotate, Fire Towers
        for (i = 0; i < this.towers.length; i++) {
            for (var j = 0; j < this.enemys.length; j++) {

                // Skip enemies that are soon to be dead.
                if (this.enemys[j].deadSoon)
                    continue;

                // If enemy within range...
                if (this.towers[i].enemyInRange(this.enemys[j])) {
                    // Rotate cannon to enemy location
                    this.towers[i].rotateCannon(this.enemys[j]);

                    // Fire Cannon!
                    this.towers[i].fireCannon(lastFrameTime, this.enemys[j]);
                    break;
                }
            }
        }

        this.timeTaken = (new Date()).getTime() - startTime.getTime();
    }

    this.updateTowerCells = function(cellType, x, y) {
        // Convert x and y into map cell positions so the pathfinding will know when a tower is
        // sitting on a cell.
        // ex: map[x][y], map[x + 1][y], map[x][y + 1], map[x + 1][y + 1]
        var screenCoords = {x: x, y: y};

        screenCoords = this.convertToMapCoords(screenCoords);

        var mapX = screenCoords.x;
        var mapY = screenCoords.y;

        // Make sure we are still within the map boundry
        if ((mapX + 1) < this.width && (mapY + 1) < this.height) {
            this.map[mapX][mapY].cellType = cellType;
            this.map[mapX + 1][mapY].cellType = cellType;
            this.map[mapX][mapY + 1].cellType = cellType;
            this.map[mapX + 1][mapY + 1].cellType = cellType;
        }
    }

    this.addTower = function(x, y) {
        var newTower = new Tower(this.currentTowerID);

        this.resetTowerSelection();

        this.selectedTower = newTower;
        this.selectedTower.selected  = true;

        newTower.init();
        newTower.setPos(x, y);

        // Add tower to list
        this.towers[this.towers.length] = newTower;
        this.currentTowerID += 1;

        // Update cells!
        this.updateTowerCells(CellType.Tower, x, y);
        
        if (!this.resetEnemyPaths()) {
            this.removeSelectedTower(false);
            return null;
        }

        if (this.selectedTower) {
            this.selectedTower.selected = false;
            this.selectedTower = null;
        }

        return newTower;
    }

    this.selectTower = function(x, y) {
        this.selectedTower = null;
        NetGame.SellTowerButton.visible = false;
        NetGame.UpgradeTowerButton.visible = false;

        for (var i = 0; i < this.towers.length; i++) {
            if (this.towers[i].containsPoint(x, y)) {
                this.towers[i].selected = true;
                this.selectedTower = this.towers[i];
                NetGame.SellTowerButton.visible = true;
                NetGame.UpgradeTowerButton.visible = true;
            } else {
                this.towers[i].selected = false;
            }
        }
    }

    this.resetTowerSelection = function() {
        NetGame.SellTowerButton.visible = false;
        NetGame.UpgradeTowerButton.visible = false;

        for (var i = 0; i < this.towers.length; i++) {
            this.towers[i].selected = false;
            this.selectedTower = null;
        }
    }

    this.removeSelectedTower = function(sold) {
        var x = 0, y = 0, towerfound = false;

        if (NetGame.isGameOver)
            return;

        for (var i = 0; i < this.towers.length; i++) {
            if (this.selectedTower.towerID == this.towers[i].towerID) {
                x = this.towers[i].x;
                y = this.towers[i].y;

                if (sold) {
                    NetGame.UpgradeTowerButton.visible = false;
                    NetGame.SellTowerButton.visible = false;
                    NetGame.playerMoney += Math.floor(this.towers[i].cost / 2);
                }
                
                this.towers.splice(i, 1);
                towerfound = true;
                break;
            }
        }

        // Update cells!
        if (towerfound) {
            this.updateTowerCells(CellType.Nothing, x, y);
            this.resetEnemyPaths();
        }
        
        this.selectedTower = null;
    }

    this.removeEnemy = function(e) {
        for (var i = 0; i < this.enemys.length; i++) {
            if (this.enemys[i] === e) {
                this.enemys.splice(i, 1);
            }
        }
    }

    this.resetEnemyPaths = function() {
        this.fastPath = astar.search(this.map, this.map[0][0], this.endCell);
        for (var i = 0; i < this.enemys.length; i++) {
            this.enemys[i].rebuildPath();
        }

        return (this.fastPath.length > 0) ? true : false;
    }

    this.upgradeSelectedTowerLevel = function() {
        if (this.selectedTower != null && this.selectedTower.level < 3) {
            this.selectedTower.level += 1;
            this.selectedTower.damage = this.selectedTower.level * 5;
            NetGame.playerMoney -= this.selectedTower.upgradeCost * this.selectedTower.level;
            this.selectedTower.cost += this.selectedTower.upgradeCost * this.selectedTower.level;
            NetGame.writeLog('Tower level has been upgraded to: ' + this.selectedTower.level);
        } else {
            NetGame.writeLog('Tower level is maxed out.');
        }
    }

    this.convertToMapCoords = function(screenCoords) {
        if (screenCoords.x != null && screenCoords.y != null) {
            screenCoords.x = Math.round(screenCoords.x / this.cellSize);
            screenCoords.y = Math.round(screenCoords.y / this.cellSize);
            return screenCoords;
        } else {
            return {x: 0, y: 0}
        }
    }

    this.clear = function() {
        this.enemys = new Array();
        this.bullets = new Array();
    }
}