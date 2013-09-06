function Enemy(wave, startX, startY, startCell, endCell, fastPath) {
    this.x = startX;
    this.y = startY;
    this.currentCell = startCell;
    this.endCell = endCell;
    this.path = fastPath;
    this.pathIndex = 0;
    this.image = NetGame.ImageResourceManager.getResourceByName('Enemy');
    this.speed = 50;
    this.dead = false;
    this.avgFrameTime = [];
    this.avgFrameTimeIndex = 0;
    this.currentHealth = 10 * wave;
    this.maxHealth = 10 * wave;
    this.points = 10 * wave;
    this.money = ((wave % 20) == 0) ? (wave / 20) + 1 : (Math.floor(wave / 20) < 1) ? 1 : Math.floor(wave / 20) + 1;
    this.deadSoon = false;

    this.removeHealth = function(amount) {
        this.currentHealth -= amount;

        if (this.currentHealth <= 0) {
            if (!this.dead) {
                NetGame.playerScore += this.points;
                NetGame.playerMoney += this.money;
                this.dead = true;
            }
        }
    }

    this.rebuildPath = function () {
        this.path = null;
    }

    this.isDead = function() {
        return this.dead;
    }

    this.centerX = function() {
        return this.x + (this.image.width / 2);
    }

    this.centerY = function() {
        return this.y + (this.image.height / 2);
    }

    this.containsPoint = function(x, y) {
        if (x >= this.x &&
            y >= this.y &&
            y <= this.y + this.image.height &&
            x <= this.x + this.image.width) {
            return true;
        }

        return false;
    }

    this.predictPosition = function(time) {
        var predictedPos = {x: this.centerX(), y: this.centerY()};

        //this.currentCell

        return predictedPos;
    }

    this.update = function(lastFrameTime, Map) {
        var avgTime = 0;

        this.avgFrameTime[this.avgFrameTimeIndex] = lastFrameTime;
        this.avgFrameTimeIndex = (++this.avgFrameTimeIndex > 5) ? 0 : this.avgFrameTimeIndex;

        for (var i = 0; i < this.avgFrameTime.length; i++) {
            avgTime += this.avgFrameTime[i];
        }

        avgTime /= this.avgFrameTime.length;
        avgTime /= 1000;

        if (!this.path) {
            this.path = astar.search(Map, this.currentCell, this.endCell);
            this.pathIndex = 0;

            if (this.pathIndex < this.path.length)
            {
                this.currentCell = this.path[0];
            }
        }

        var angle = Math.atan((this.currentCell.screenY() - this.y) / (this.currentCell.screenX() - this.x));

        if (this.currentCell.screenX() < this.x) {
            angle += NetGame.degreesToRadians(180);
        }

        this.x += Math.cos(angle) * this.speed * avgTime;
        this.y += Math.sin(angle) * this.speed * avgTime;

        var mapCoords = {x: this.x, y: this.y};
        mapCoords = NetGame.Map.convertToMapCoords(mapCoords);

        if (mapCoords.x == this.currentCell.x  && mapCoords.y == this.currentCell.y) {
            // Select next cell or stay at the current cell if there aren't any left.
            this.pathIndex++;
            if (this.pathIndex < this.path.length) {
                this.currentCell = this.path[this.pathIndex];
            } else {
                NetGame.playerLives -= 1;
                this.dead = true;

                if (NetGame.playerLives <= 0) {
                    NetGame.playerLives = 0;
                    NetGame.gameOver();
                }
            }
        }
    }

    this.draw = function(context2D) {
        // Draw health bar
        context2D.fillStyle = "black";
        context2D.fillRect(this.x, (this.y - 10), this.image.width, 4);

        context2D.fillStyle = "#ffccff";
        context2D.fillRect(this.x + 1, (this.y - 9), (this.currentHealth / this.maxHealth) * (this.image.width - 2), 2);

        context2D.drawImage(this.image, this.x, this.y);
    }
}

function Tower(ID) {
    this.towerID = ID;
    this.baseImage = null;
    this.topImage = null;
    this.radiusImage = null;
    this.upgradeImage = null;
    this.unupgradedImage = null;
    this.topRot = 0;
    this.x = 0;
    this.y = 0;
    this.fireCoolDownTime = 500;
    this.lastFireTime = 0;
    this.level = 0;
    this.range = 75;
    this.selected = false;
    this.cost = 5;
    this.damage = 1;
    this.upgradeCost = 10;
    this.bulletSpeed = 320;

    this.init = function() {
        this.baseImage = NetGame.ImageResourceManager.createResource("Tower1", "./Images/Tower1.png");
        this.topImage = NetGame.ImageResourceManager.createResource("Tower1Top", "./Images/Tower1Top2.png");
        this.radiusImage = NetGame.ImageResourceManager.createResource("Radius", "./Images/TowerRadius.png");
        this.upgradeImage = NetGame.ImageResourceManager.createResource("Upgrade", "./Images/UpgradeDot.png");
        this.unupgradedImage = NetGame.ImageResourceManager.createResource("Unupgraded", "./Images/UnupgradedDot.png")

        this.topRot = NetGame.degreesToRadians(Math.random() * 360);
    }

    this.rotateCannon = function(enemy) {
        // Get Image offset for doing rotations
        var xOffset = this.topImage.width / 2;
        var yOffset = this.topImage.height / 2;

        var a = enemy.centerX() - (this.x + xOffset);
        var b = enemy.centerY() - (this.y + yOffset);

        if (a == 0)
            return;

        var feta = Math.atan(b / a);

        if (enemy.centerX() < this.x + xOffset) {
            feta += NetGame.degreesToRadians(180);
        }

        this.topRot = feta;
    }

    this.setPos = function(xPos, yPos) {
        this.x = xPos;
        this.y = yPos;
    }

    this.fireCannon = function(currentGameTimeElapsed, enemy) {

        this.lastFireTime += currentGameTimeElapsed;
        if (this.lastFireTime >= this.fireCoolDownTime) {
           this.lastFireTime -= this.fireCoolDownTime;

           var xOffset = this.topImage.width / 2;
           var yOffset = this.topImage.height / 2;

           var b = new Bullet(this.bulletSpeed, this.damage, enemy);
           b.init(this.x + xOffset, this.y + yOffset, xOffset, 0, this.topRot);
           NetGame.Map.bullets.push(b);

           // Mark enemies that are about to die as almost
           // dead so no other towers shoot at them!
           if (enemy.currentHealth <= this.damage) {
               enemy.deadSoon = true;
           }
        }
    }

    this.draw = function(context2D, selected) {
        try {

            // Get Image offset for doing rotations
            var xOffset = this.topImage.width / 2;
            var yOffset = this.topImage.height / 2;

            if (this.selected && selected) {
                // Draw radius
                context2D.drawImage(this.radiusImage, this.x + xOffset - this.range, this.y + yOffset - this.range);
            }
            // Draw base of the tower
            context2D.drawImage(this.baseImage, this.x, this.y);

            if (this.level >= 1) {
                context2D.drawImage(this.upgradeImage, this.x + this.baseImage.width - 24, this.y + this.baseImage.height - 8);
            } else {
                context2D.drawImage(this.unupgradedImage, this.x + this.baseImage.width - 24, this.y + this.baseImage.height - 8);
            }

            if (this.level >= 2) {
                context2D.drawImage(this.upgradeImage, this.x + this.baseImage.width - 16, this.y + this.baseImage.height - 8);
            } else {
                context2D.drawImage(this.unupgradedImage, this.x + this.baseImage.width - 16, this.y + this.baseImage.height - 8);
            }

            if (this.level >= 3) {
                context2D.drawImage(this.upgradeImage, this.x + this.baseImage.width - 8, this.y + this.baseImage.height - 8);
            } else {
                context2D.drawImage(this.unupgradedImage, this.x + this.baseImage.width - 8, this.y + this.baseImage.height - 8);
            }

            // Draw top of the tower
            context2D.save();
            context2D.translate(this.x + xOffset, this.y + yOffset);
            context2D.rotate(this.topRot);
            context2D.drawImage(this.topImage, -xOffset, -yOffset);
            context2D.restore();
        }
        catch (ex) {
            NetGame.writeLog('Error:' + ex);
        }
    }

    this.enemyInRange = function(enemy) {
        // Get Image offset for doing rotations
        var xOffset = this.topImage.width / 2;
        var yOffset = this.topImage.height / 2;
        var lenX = this.x + xOffset - enemy.centerX();
        var lenY = this.y + yOffset - enemy.centerY();

        // Distance formula for radius collisions
        var distance = Math.sqrt(lenX * lenX + lenY * lenY);

        if (distance <= this.range)
            return true;

        return false;
    }

    this.containsPoint = function(x, y) {
        if (x >= this.x &&
            y >= this.y &&
            y <= this.y + this.baseImage.height &&
            x <= this.x + this.baseImage.width) {
            return true;
        }

        return false;
    }

    this.containsRegion = function(x, y, w, h) {
        // Get Image offset for doing rotations
        var regionWidth = this.topImage.width;
        var regionHeight = this.topImage.height;

        // Check Top Left
        // Check Bottom Right
        // Check Top Right
        // Check Bottom Left

        if (this.x <= x && this.x + regionWidth > x &&
            this.y <= y && this.y + regionHeight > y) {
            return true;
        } else if (this.x > x && this.x < x + w &&
            this.y > y && this.y < y + h) {
            return true;
        } else if (x + w > this.x && x + w < this.x + regionWidth &&
            y >= this.y && y < this.y + regionHeight) {
            return true;
        } else if (x >= this.x && x < this.x + regionWidth &&
            y + h > this.y && y + h < this.y + regionHeight) {
            return true;
        }

        return false;
    }

    this.drawDebug = function(context2D) {
        // Draw top of the tower
        // Get Image offset for doing rotations
        var xOffset = this.topImage.width / 2;
        var yOffset = this.topImage.height / 2;

        // Draw debug line...
        context2D.strokeStyle = '#00ff00';
        context2D.beginPath();
        context2D.moveTo(this.x + xOffset, this.y + yOffset);
        context2D.lineTo(NetGame.mouseX, NetGame.mouseY);
        context2D.closePath();
        context2D.stroke();
    }
}

function Tower1(){}
Tower1.prototype = new Tower;
Tower1.prototype.constructor = Tower1;

Tower1.prototype.test = function() {
    NetGame.writeLog("This is a test.");
}

function Bullet(bulletSpeed, towerDamage, target) {
    this.x = 0;
    this.y = 0;
    this.damage = towerDamage;
    this.angle = 0;
    this.speed = bulletSpeed;
    this.enemy = target;

    this.init = function(startX, startY, offsetX, offsetY, rot) {
        // Rotate bullet around turret center to get correct starting location.
        this.x = offsetX * Math.cos(rot) + offsetY * Math.sin(rot);
        this.y = offsetX * Math.sin(rot) - offsetY * Math.cos(rot);

        // Add new rotation x and y offset to starting location offset.
        this.x += startX;
        this.y += startY;

        // Recalculate Fireing Angle to account for bullet position movement
        this.angle = Math.atan((this.enemy.centerY() - this.y) / (this.enemy.centerX() - this.x));

        if (this.enemy.centerX() < this.x) {
            this.angle += NetGame.degreesToRadians(180);
        }
    }

    this.update = function(lastFrameTime) {
        // Recalulate angle of bullet so it always goes towards the enemy.
        this.angle = Math.atan((this.enemy.centerY() - this.y) / (this.enemy.centerX() - this.x));

        if (this.enemy.centerX() < this.x) {
            this.angle += NetGame.degreesToRadians(180);
        }

        this.x += Math.cos(this.angle) * this.speed * (lastFrameTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (lastFrameTime / 1000);
    }

    this.hasCollision = function() {
        // Negate Health
        if (this.enemy.containsPoint(this.x, this.y)) {
            this.enemy.removeHealth(this.damage);
            return true;
        }

        return false;
    }

    this.isOutsideMap = function(mapWidth, mapHeight) {
        if (this.x < 0) {
            return true;
        } else if (this.y < 0) {
            return true;
        } else if (this.x > mapWidth) {
            return true;
        } else if (this.y > mapHeight) {
            return true;
        }

        return false;
    }

    this.draw = function(context2D) {
        context2D.fillStyle = '#FF0000';
        context2D.beginPath();
        context2D.arc(this.x, this.y, 3, 0, Math.PI*2, true);
        context2D.closePath();
        context2D.fill();
    }
}