NetGame = {
    canvas: null,
    context2D: null,
    totalFrames: 0,
    mouseX: 0,
    mouseY: 0,
    MouseEntered: false,
    ErrorConsole: null,
    LoadingHandle: 0,
    SoundResourceManager: null,
    ImageResourceManager: null,
    Map: null,
    buildingMode: false,
    towerPlacementBox: null,
    updateTime: 0,
    lastTime: 0,
    lastUpdateTime: 0,
    totalUpdateTime: 0,
    maxUpdateTime: 30,
    playerMoney: 50,
    playerScore: 0,
    playerLives: 20,
    isGameOver: false,
    BuildTowerButton: null,
    BuildTowerCancel: null,
    SellTowerButton: null,
    UpgradeTowerButton: null,
    
    init: function(){
        NetGame.SoundResourceManager = new ResourceManager(ResourceType.Sound);
        NetGame.ImageResourceManager = new ResourceManager(ResourceType.Image);

        NetGame.canvas = document.getElementById('PTDCanvas');
        NetGame.ErrorConsole = document.getElementById('ErrorConsole');

        if (NetGame.canvas.addEventListener) {
            NetGame.canvas.addEventListener('mousemove', NetGame.handleMouseMove, false);
        } else if (NetGame.canvas.attachEvent) {
            NetGame.canvas.attachEvent('onmousemove', NetGame.handleMouseMove);
        }

        if (document.addEventListener) {
            document.addEventListener('keypress', NetGame.handleKeyPress, false);
        } else if (document.attachEvent) {
            document.attachEvent('onkeypress', NetGame.handleKeyPress);
        }

        if (NetGame.canvas.addEventListener) {
            NetGame.canvas.addEventListener('click', NetGame.handleMouseClick, false);
        } else if (NetGame.canvas.attachEvent) {
            NetGame.canvas.attachEvent('onclick', NetGame.handleMouseClick);
        }

        NetGame.context2D = NetGame.canvas.getContext('2d');

        // Initialize Tower Placement Box
        NetGame.towerPlacementBox = new TowerPlacementBox();
        NetGame.towerPlacementBox.init();

        // Initialize Menu
        Menu.init((NetGame.canvas.width - 192), 0, 192, NetGame.canvas.height)
        var lbl = new Label(); 
        lbl.init(Menu, 'lblFPS', 'FPS:', 10, 20);
        Menu.addControl(lbl);
        lbl = new Label(); 
        lbl.init(Menu, 'lblWave', 'Wave:', 10, 40);
        Menu.addControl(lbl);
        lbl = new Label(); 
        lbl.init(Menu, 'lblTime', 'Next Wave In:', 10, 60);
        Menu.addControl(lbl);
        lbl = new Label(); 
        lbl.init(Menu, 'lblScore', 'Score:', 10, 80);
        Menu.addControl(lbl);
        lbl = new Label(); 
        lbl.init(Menu, 'lblMoney', 'Money:', 10, 100);
        Menu.addControl(lbl);
        lbl = new Label();
        lbl.init(Menu, 'lblLives', 'Lives:', 10, 120);
        Menu.addControl(lbl);

        NetGame.BuildTowerButton = new Button();
        NetGame.BuildTowerButton.init(Menu, 'btnBuild', 10, 140, 32, 32);
        NetGame.BuildTowerButton.unselectedImage = NetGame.ImageResourceManager.createResource("BuildTowerUnselected", "./Images/BuildTowerUnselected.png");
        NetGame.BuildTowerButton.selectedImage = NetGame.ImageResourceManager.createResource("BuildTowerSelected", "./Images/BuildTowerSelected.png");
        NetGame.BuildTowerButton.onClick = function () {NetGame.buildTowerMode(true);}
        Menu.addControl(NetGame.BuildTowerButton);

        NetGame.BuildTowerCancel = new Button();
        NetGame.BuildTowerCancel.init(Menu, 'btnCancel', 10, 140 + 40, 16, 16);
        NetGame.BuildTowerCancel.unselectedImage = NetGame.ImageResourceManager.createResource("Cancel", "./Images/Cancel.png");
        NetGame.BuildTowerCancel.selectedImage = NetGame.ImageResourceManager.createResource("Cancel", "./Images/Cancel.png");
        NetGame.BuildTowerCancel.visible = false;
        NetGame.BuildTowerCancel.onClick = function () {NetGame.buildTowerMode(false);}
        Menu.addControl(NetGame.BuildTowerCancel);

        NetGame.SellTowerButton = new Button();
        NetGame.SellTowerButton.init(Menu, 'btnSellTower', 10, 444, 97, 36);
        NetGame.SellTowerButton.text = 'Sell';
        NetGame.SellTowerButton.font = '16px Arial';
        NetGame.SellTowerButton.unselectedImage = NetGame.ImageResourceManager.createResource("ButtonBG", "./Images/ButtonBG.png");
        NetGame.SellTowerButton.selectedImage = NetGame.ImageResourceManager.createResource("ButtonBG", "./Images/ButtonBG.png");
        NetGame.SellTowerButton.visible = false;
        NetGame.SellTowerButton.onClick = function () {NetGame.Map.removeSelectedTower(true);}
        Menu.addControl(NetGame.SellTowerButton);

        NetGame.UpgradeTowerButton = new Button();
        NetGame.UpgradeTowerButton.init(Menu, 'btnUpgradeTower', 10, 400, 97, 36);
        NetGame.UpgradeTowerButton.text = 'Upgrade';
        NetGame.UpgradeTowerButton.font = '16px Arial';
        NetGame.UpgradeTowerButton.unselectedImage = NetGame.ImageResourceManager.createResource("ButtonBG", "./Images/ButtonBG.png");
        NetGame.UpgradeTowerButton.selectedImage = NetGame.ImageResourceManager.createResource("ButtonBG", "./Images/ButtonBG.png");
        NetGame.UpgradeTowerButton.visible = false;
        NetGame.UpgradeTowerButton.onClick = function () {NetGame.Map.upgradeSelectedTowerLevel();}
        Menu.addControl(NetGame.UpgradeTowerButton);

        // Initialize Map
        NetGame.Map = new GameMap((NetGame.canvas.width - 192) / 16 , NetGame.canvas.height / 16);
        NetGame.Map.init();

        NetGame.LoadingHandle = setInterval('NetGame.loading();', 100);
    },

    incGameTime: function() {
        NetGame.totalFrames += 1;
    },

    handleKeyPress: function(e) {
        var KeyID = (window.event) ?  e.keyCode : e.which;

        if (KeyID == 113) {
            NetGame.buildTowerMode(false);
        } else if (KeyID == 100) {
            NetGame.Map.removeSelectedTower(true)
        }
    },

    handleMouseMove: function(e) {
        NetGame.MouseEntered = true;
        NetGame.mouseX = e.pageX - NetGame.canvas.offsetLeft;
        NetGame.mouseY = e.pageY - NetGame.canvas.offsetTop;

        Menu.mouseMove(NetGame.mouseX, NetGame.mouseY);
    },

    handleMouseClick: function() {
        // Check menu clicks first, if the event is handled exit.
        if (Menu.click(NetGame.mouseX, NetGame.mouseY))
            return;

        if (NetGame.buildingMode) {
            NetGame.towerPlacementBox.addTower(NetGame.Map);
        } else {
            NetGame.Map.selectTower(NetGame.mouseX, NetGame.mouseY);
        }
    },

    degreesToRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },

    gameOver: function() {
        if (NetGame.isGameOver == false) {
            NetGame.buildTowerMode(false);
            NetGame.Map.clear();
            Menu.disabled = true;
            NetGame.isGameOver = true;
            NetGame.writeLog('Game Over!');
        }
    },

    gameLogic: function() {
        var now = (new Date()).getTime();
        var delta = now - NetGame.lastTime;
        NetGame.lastUpdateTime += delta;
        NetGame.totalUpdateTime += delta;
        
        while (NetGame.lastUpdateTime > 0) {
            if (NetGame.lastUpdateTime <= NetGame.maxUpdateTime) {
                NetGame.Map.update(NetGame.lastUpdateTime);
                NetGame.lastUpdateTime = 0;
            }
            else {
                NetGame.Map.update(NetGame.maxUpdateTime);
                NetGame.lastUpdateTime -= NetGame.maxUpdateTime;
            }
        }

        if (!NetGame.isGameOver) {
            if (NetGame.buildingMode) {
                NetGame.towerPlacementBox.update(NetGame.mouseX, NetGame.mouseY, NetGame.Map);
            }

            if (NetGame.playerMoney < 5) {
                NetGame.BuildTowerButton.disabled = true;
            } else {
                NetGame.BuildTowerButton.disabled = false;
            }
        }

        if (NetGame.Map.selectedTower != null && NetGame.playerMoney < ((NetGame.Map.selectedTower.level + 1) * NetGame.Map.selectedTower.upgradeCost)) {
            NetGame.UpgradeTowerButton.visible = false;
        } else if (NetGame.Map.selectedTower != null) {
            NetGame.UpgradeTowerButton.visible = true;
        }
        
        NetGame.lastTime = now;
    },

    gameRender: function() {
        // Inc Total Frames
        NetGame.incGameTime();

        // Clear Context
        NetGame.context2D.clearRect(0, 0, NetGame.canvas.width, NetGame.canvas.height);

        // Draw Map and Entities
        NetGame.Map.draw(NetGame.context2D);

        if (NetGame.buildingMode) {
                NetGame.towerPlacementBox.draw(NetGame.context2D);
        }

        // Draw Menu!
        NetGame.context2D.lineWidth = 1;
        NetGame.context2D.font = '10px arial';
        var min = Math.floor(NetGame.Map.nextWaveTime / 60000);
        var sec = (Math.floor(NetGame.Map.nextWaveTime / 1000) - (min * 60));

        sec = (sec < 10) ? '0' + sec : sec;

        Menu.controls[0].text = 'FPS: ' + Math.round(NetGame.totalFrames / NetGame.totalUpdateTime * 1000);
        Menu.controls[1].text = 'Wave: ' + this.Map.wave;
        Menu.controls[2].text = 'Next Wave In: ' + min + ':' + sec;
        Menu.controls[3].text = 'Score: ' + this.playerScore;
        Menu.controls[4].text = 'Money: $' + this.playerMoney;
        Menu.controls[5].text = 'Lives: ' + this.playerLives;
        Menu.draw(NetGame.context2D);
    },

    loading: function() {
        NetGame.clearLog();
        NetGame.writeLog('Image Loading: ' + NetGame.ImageResourceManager.loadingProgress() + '%');
        NetGame.writeLog('Sound Loading: ' + NetGame.SoundResourceManager.loadingProgress() + '%');

        if (NetGame.ImageResourceManager.isFinishedLoading() && NetGame.SoundResourceManager.isFinishedLoading())
        {
            NetGame.writeLog('Loading Complete!');
            clearInterval(NetGame.LoadingHandle);
            NetGame.lastTime = (new Date()).getTime();
            setInterval('NetGame.gameLogic();', 10);
            setInterval('NetGame.gameRender();', 10);
        }
    },

    writeLog: function(message) {
        NetGame.ErrorConsole.innerHTML += message + '<br />';
    },

    clearLog: function() {
        NetGame.ErrorConsole.innerHTML = '';
    },

    buildTowerMode: function(on) {
        if (on) {
            if (NetGame.playerMoney < 5) {
                NetGame.writeLog('Not enough money to build this tower.');
                return;
            }

            //NetGame.canvas.style.cursor = 'none';
            NetGame.writeLog('Tower Building Mode On!');
            NetGame.writeLog('Press the q key to exit tower building mode or d to delete a selected tower.');
            NetGame.BuildTowerButton.selected = true;
            NetGame.BuildTowerCancel.visible = true;
            NetGame.buildingMode = true;
        } else {
            //NetGame.canvas.style.cursor = 'default';
            NetGame.writeLog('Tower Building Mode Off!');
            NetGame.BuildTowerButton.selected = false;
            NetGame.BuildTowerCancel.visible = false;
            NetGame.buildingMode = false;
        }
    }
}

function TowerPlacementBox() {
    this.x = 0;
    this.y = 0;
    this.placementBadImg = null;
    this.placementGoodImg = null;
    this.radiusImage = null;
    this.canPlace = false;
    this.centerX = 0;
    this.centerY = 0;

    this.init = function() {
        // Initialize Tower Placement Images
        this.placementGoodImg = NetGame.ImageResourceManager.createResource('GoodTP', './Images/GoodTP.png');
        this.placementBadImg = NetGame.ImageResourceManager.createResource('BadTP', './Images/BadTP.png');
        this.radiusImage = NetGame.ImageResourceManager.createResource("Radius", "./Images/TowerRadius.png");
    }

    this.update = function(mouseX, mouseY, Map) {
        this.canPlace = true;

        // Make sure we are at the center of the mouse!
        this.x = (mouseX - Map.cellSize); 
        this.y = (mouseY - Map.cellSize); 

        // Snap to Grid!
        this.x = Math.round(this.x / Map.cellSize) * 16;
        this.y = Math.round(this.y / Map.cellSize) * 16;

        // Snap to right side of map!
        if (this.x < 0) {
            this.x = 0;
        }

        // Snap to top side of map!
        if (this.y < 0) {
            this.y = 0;
        }

        // Snap to left side of map!
        if (this.x > (Map.width * Map.cellSize) - (Map.cellSize * 2)) {
            this.x = (Map.width * Map.cellSize) - (Map.cellSize * 2);
        }

        // Snap to bottom side of map!
        if (this.y > (Map.height * Map.cellSize) - (Map.cellSize * 2)) {
            this.y = (Map.height * Map.cellSize) - (Map.cellSize * 2);
        }

        this.centerX = this.x + Map.cellSize;
        this.centerY = this.y + Map.cellSize;

        // Check Tower Collisions
        for (var i = 0; i < Map.towers.length; i++) {
            if (Map.towers[i].containsRegion(this.x, this.y, 32, 32)) {
                this.canPlace = false;
                return;
            }
        }

        // Check player money
        if (NetGame.playerMoney - 5 < 0) {
            this.canPlace = false;
            return;
        }
    }

    this.addTower = function(Map) {
        if (this.canPlace) {
            var addedTower = Map.addTower(this.x, this.y)

            if (addedTower == null) {
                NetGame.writeLog('Can\'t place tower here!');
            } else {
                NetGame.playerMoney -= addedTower.cost;
            }
        } else {
            // Check player money
            if (NetGame.playerMoney - 5 < 0) {
                NetGame.buildTowerMode(false);
                return;
            } else {
                NetGame.writeLog('Can\'t place tower here!');
            }
        }
    }

    this.draw = function(context2D) {
        context2D.drawImage(this.radiusImage, this.centerX - 75, this.centerY - 75);

        if (this.canPlace) {          
            context2D.drawImage(this.placementGoodImg, this.x, this.y);
        } else {
            context2D.drawImage(this.placementBadImg, this.x, this.y);
        }
    }
}

