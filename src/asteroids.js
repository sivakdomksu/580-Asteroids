"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vector_1 = require("./vector");
var WIDTH = 800;
var HEIGHT = 600;
var PLAYER_HEIGHT = 50;
var ENEMY_SPAWN_RATE = 500;
var ENEMY_SPAWN_PROBABILITY = 3;
var ROTATION_SPEED = 3;
var ACC_SPEED = 0.5;
var ACC_VECTOR = vector_1.default.from(0, ACC_SPEED);
var DECELERATION_SPEED = 0.05;
var MAX_SPEED = 10;
var DeathCauseEnum;
(function (DeathCauseEnum) {
    DeathCauseEnum[DeathCauseEnum["OUT_OF_BOUNDS"] = 0] = "OUT_OF_BOUNDS";
    DeathCauseEnum[DeathCauseEnum["LIVES"] = 1] = "LIVES";
})(DeathCauseEnum || (DeathCauseEnum = {}));
var HitTypeEnum;
(function (HitTypeEnum) {
    HitTypeEnum[HitTypeEnum["HIT"] = 0] = "HIT";
    HitTypeEnum[HitTypeEnum["DESTROYED"] = 1] = "DESTROYED";
})(HitTypeEnum || (HitTypeEnum = {}));
var Boundary = /** @class */ (function () {
    function Boundary(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    Boundary.prototype.isInBounds = function (x, y, shape) {
        return x >= this.minX && y >= this.minY && (x + shape.getWidth()) <= this.maxX && (y + shape.getHeight()) <= this.maxY;
    };
    return Boundary;
}());
var Shape = /** @class */ (function () {
    function Shape(color, mass) {
        this.color = color;
        this.mass = mass;
    }
    return Shape;
}());
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle(width, height, color, mass) {
        var _this = _super.call(this, color, mass) || this;
        _this.width = width;
        _this.height = height;
        return _this;
    }
    Rectangle.prototype.isInBounds = function (x, y, boundary) {
        //TODO
    };
    Rectangle.prototype.getHeight = function () {
        return this.height;
    };
    Rectangle.prototype.getWidth = function () {
        return this.width;
    };
    return Rectangle;
}(Shape));
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    function Circle(radius, color, mass) {
        var _this = _super.call(this, color, mass) || this;
        _this.radius = radius;
        return _this;
    }
    Circle.prototype.isInBounds = function (x, y, boundary) {
    };
    Circle.prototype.getHeight = function () {
        return 2 * this.radius;
    };
    Circle.prototype.getWidth = function () {
        return 2 * this.radius;
    };
    return Circle;
}(Shape));
var GameObjectType = /** @class */ (function () {
    function GameObjectType(shape, boundary, move) {
        this.shape = shape;
        this.boundary = boundary;
        this.move = move;
    }
    return GameObjectType;
}());
var UnitType = /** @class */ (function (_super) {
    __extends(UnitType, _super);
    function UnitType(lives, shotFreq, shape, boundary, move, shot, bounties) {
        var _this = _super.call(this, shape, boundary, move) || this;
        _this.lives = lives;
        _this.shotFreq = shotFreq;
        _this.shot = shot;
        _this.bounties = bounties;
        return _this;
    }
    return UnitType;
}(GameObjectType));
var ShotType = /** @class */ (function (_super) {
    __extends(ShotType, _super);
    function ShotType(dmg, shape, boundary, move) {
        var _this = _super.call(this, shape, boundary, move) || this;
        _this.dmg = dmg;
        return _this;
    }
    return ShotType;
}(GameObjectType));
var EnvironmentType = /** @class */ (function (_super) {
    __extends(EnvironmentType, _super);
    function EnvironmentType(shape, boundary, move) {
        return _super.call(this, shape, boundary, move) || this;
    }
    return EnvironmentType;
}(GameObjectType));
var Move = /** @class */ (function () {
    function Move(speedX, speedY) {
        this.speedX = speedX;
        this.speedY = speedY;
    }
    Move.prototype.move = function (elapsedTime, x, y, object) {
        return {
            x: x + elapsedTime * this.speedX,
            y: y + elapsedTime * this.speedY
        };
    };
    return Move;
}());
var ShapeEnum = {
    PLAYER: new Rectangle(PLAYER_HEIGHT, 75, "#6a7fed", 0),
    ENEMY: new Rectangle(45, 50, "#ff0000", 0),
    SHOT: new Rectangle(5, 5, "#ffffff", 0),
    HEALTH_ENEMY: new Rectangle(45, 50, "#91ff6f", 0),
    BIG_ONE: new Rectangle(60, 60, "#ffbb00", 0),
    FAST_ONE: new Rectangle(40, 40, "#f5a3ff", 0),
    CLOUD: new Rectangle(150, 150, "#0a1e3a", 0)
};
var BoundaryEnum = {
    NONE: new Boundary(Number.MIN_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
    SHOT: new Boundary(0, 0, WIDTH, HEIGHT),
    CLOUD: new Boundary(-ShapeEnum.CLOUD.width, -ShapeEnum.CLOUD.height, WIDTH + ShapeEnum.CLOUD.width, HEIGHT + ShapeEnum.CLOUD.height)
};
var BountyEnum = {
    SCORE_ST: function (enemy, shot, type) {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(10);
    },
    HEALTH_ST: function (enemy, shot, type) {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(0, 1);
    },
    SCORE_FAST: function (enemy, shot, type) {
        if (type == HitTypeEnum.HIT)
            updateStatus(20);
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(50);
    },
    SCORE_30: function (enemy, shot, type) {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(30);
    }
};
var MoveTypeEnum = {
    PLAYER: new Move(0.5, 0),
    ENEMY_SIMPLE: new Move(0, 0.1),
    PLAYER_SHOT: new Move(0, -0.5),
    ENEMY_SHOT: new Move(0, 0.4),
    CLOUD: new Move(0, 0.05)
};
var ShotTypeEnum = {
    PLAYER: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.PLAYER_SHOT),
    ENEMY: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.ENEMY_SHOT)
};
var UnitTypeEnum = {
    PLAYER: new UnitType(3, 0, ShapeEnum.PLAYER, BoundaryEnum.NONE, MoveTypeEnum.PLAYER, ShotTypeEnum.PLAYER, []),
};
var EnvironmentTypeEnum = {
    CLOUD: new EnvironmentType(ShapeEnum.CLOUD, BoundaryEnum.CLOUD, MoveTypeEnum.CLOUD)
};
var GameObject = /** @class */ (function () {
    function GameObject(id, type, x, y, onDestroyed) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.onDestroyed = onDestroyed;
        this.rotation = 0;
    }
    GameObject.prototype.update = function (elapsedTime, rotation, movement) {
        if (rotation === void 0) { rotation = 0; }
        if (movement === void 0) { movement = false; }
        var move = this.type.move.move(elapsedTime, this.x, this.y, this);
        if (this.type.boundary.isInBounds(move.x, move.y, this.type.shape)) {
            this.x = move.x;
            this.y = move.y;
        }
        else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(DeathCauseEnum.OUT_OF_BOUNDS);
        }
    };
    GameObject.prototype.isCollidingWith = function (other) {
        //TODO
        return false;
    };
    return GameObject;
}());
var Unit = /** @class */ (function (_super) {
    __extends(Unit, _super);
    function Unit(id, type, x, y, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, onDestroyed) || this;
        _this.type = type;
        _this.moveVector = vector_1.default.zero();
        _this.onHit = function (other) {
            if (other instanceof Shot) {
                if (other.initiator == _this.type)
                    return;
                _this.type.bounties.forEach(function (bounty) {
                    bounty(_this, other, HitTypeEnum.HIT);
                });
                _this.lives -= other.type.dmg;
                updateStatus(0);
            }
            else {
                _this.lives--;
                updateStatus(0);
            }
            if (_this.lives < 1)
                _this.onDestroyed(DeathCauseEnum.LIVES);
        };
        _this.lives = type.lives;
        return _this;
    }
    Unit.prototype.isAlive = function () {
        return this.lives > 0;
    };
    Unit.prototype.isInBounds = function () {
        return this.type.boundary.isInBounds(this.x, this.y, this.type.shape);
    };
    Unit.prototype.update = function (elapsedTime, rotation, movement) {
        if (rotation === void 0) { rotation = 0; }
        if (movement === void 0) { movement = false; }
        _super.prototype.update.call(this, elapsedTime, rotation, movement);
        if (this.type === UnitTypeEnum.PLAYER) {
            return;
        }
        switch (Math.floor(Math.random() * this.type.shotFreq)) {
            case 1:
                this.shoot();
        }
    };
    Unit.prototype.shoot = function () {
        var id = shotIdCounter;
        var shot = new Shot(id, this.type, this.type.shot, this.x + this.type.shape.getWidth() / 2, this.y, function (cause) {
            shots.delete(id);
        });
        shots.set(id, shot);
        shotIdCounter++;
        return shot;
    };
    return Unit;
}(GameObject));
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(id, type, x, y, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, onDestroyed) || this;
        _this.type = type;
        _this.speed = 0;
        return _this;
    }
    Player.prototype.update = function (elapsedTime, rotation, movement) {
        if (rotation === void 0) { rotation = 0; }
        if (movement === void 0) { movement = false; }
        this.rotation += (rotation * ROTATION_SPEED * elapsedTime) % 360;
        this.speed = Math.max(0, this.speed - DECELERATION_SPEED);
        if (movement && this.speed + ACC_SPEED > MAX_SPEED) {
            this.moveVector.add(vector_1.default.rotate(ACC_VECTOR, this.rotation));
        }
        else {
            this.speed = Math.min(MAX_SPEED, movement ? this.speed + ACC_SPEED : Number.MAX_VALUE);
        }
        this.moveVector.add(vector_1.default.fromOther(this.moveVector).normalize().scale(-DECELERATION_SPEED));
        this.x = (this.x + this.moveVector.x) % WIDTH;
        this.y = (this.y + this.moveVector.y) % HEIGHT;
    };
    return Player;
}(Unit));
var Shot = /** @class */ (function (_super) {
    __extends(Shot, _super);
    function Shot(id, initiator, type, x, y, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, onDestroyed) || this;
        _this.initiator = initiator;
        _this.type = type;
        return _this;
    }
    Shot.prototype.isCollidingWith = function (other) {
        return _super.prototype.isCollidingWith.call(this, other) && this.initiator !== other.type;
    };
    return Shot;
}(GameObject));
var Environment = /** @class */ (function (_super) {
    __extends(Environment, _super);
    function Environment(id, type, x, y, onDestroyed) {
        return _super.call(this, id, type, x, y, onDestroyed) || this;
    }
    return Environment;
}(GameObject));
//endregion
var frontCanvas = document.getElementById("canvas");
var frontContext = frontCanvas.getContext("2d");
var backCanvas = document.createElement("canvas");
backCanvas.width = WIDTH;
backCanvas.height = HEIGHT;
var backContext = backCanvas.getContext("2d");
var start = null;
var currentInput = {
    space: false,
    left: false,
    right: false,
    up: false,
    down: false
};
var priorInput = {
    space: false,
    left: false,
    right: false,
    up: false,
    down: false
};
var player = new Unit(0, UnitTypeEnum.PLAYER, 0, 0, function () {
    endGame();
});
player.x = WIDTH / 2 - player.type.shape.getWidth() / 2;
player.y = HEIGHT - player.type.shape.getHeight();
var score = 0;
var scoreElement = document.getElementById("score_text");
var livesElement = document.getElementById("lives_text");
var enemyTimeToSpawn = 0;
var enemyIdCounter = 0;
var shotIdCounter = 0;
var environmentIdCounter = 0;
// @ts-ignore
var enemies = new Map();
// @ts-ignore
var shots = new Map();
// @ts-ignore
var environments = new Map();
var running = true;
function loop(timestamp) {
    if (!running)
        return;
    if (!start)
        start = timestamp;
    var elapsedTime = timestamp - start;
    start = timestamp;
    createEnemy(elapsedTime);
    createEnvironment();
    update(elapsedTime);
    render(elapsedTime);
    pollInput();
    frontContext.clearRect(0, 0, WIDTH, HEIGHT);
    frontContext.drawImage(backCanvas, 0, 0);
    window.requestAnimationFrame(loop);
}
function pollInput() {
    priorInput = JSON.parse(JSON.stringify(currentInput));
}
function handleKeydown(event) {
    switch (event.key) {
        case ' ':
            currentInput.space = true;
        case 'ArrowUp':
        case 'w':
            currentInput.up = true;
        case 'ArrowLeft':
        case 'a':
            currentInput.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            currentInput.right = true;
            break;
    }
}
window.addEventListener('keydown', handleKeydown);
function handleKeyup(event) {
    switch (event.key) {
        case ' ':
            currentInput.space = false;
        case 'ArrowUp':
        case 'w':
            currentInput.up = false;
        case 'ArrowLeft':
        case 'a':
            currentInput.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            currentInput.right = false;
            break;
    }
}
window.addEventListener('keyup', handleKeyup);
function createEnemy(elapsedTime) {
    // enemyTimeToSpawn += elapsedTime;
    // if (enemyTimeToSpawn > ENEMY_SPAWN_RATE) {
    //     enemyTimeToSpawn = 0;
    //     if (Math.random() * ENEMY_SPAWN_PROBABILITY < 1) {
    //         let id = enemyIdCounter;
    //         let type = UnitTypeEnum.ENEMY;
    //         switch (Math.floor(Math.random() * 20)) {
    //             case 0:
    //             case 2:
    //                 type = UnitTypeEnum.HEALTH_ENEMY;
    //                 break;
    //             case 1:
    //                 type = UnitTypeEnum.BIG_ONE;
    //                 break;
    //             case 3:
    //                 type = UnitTypeEnum.FAST_ONE;
    //                 break;
    //         }
    //         enemies.set(id, new Unit(id, type, Math.random() * (WIDTH - ShapeEnum.ENEMY.width), -ShapeEnum.ENEMY.height, function (cause: DeathCauseEnum) {
    //             if (cause == DeathCauseEnum.OUT_OF_BOUNDS) {
    //                 player.onHit(this);
    //             } else if (cause == DeathCauseEnum.LIVES) {
    //                 this.type.bounties.forEach(bounty => bounty(this, null, HitTypeEnum.DESTROYED));
    //             }
    //             enemies.delete(id);
    //         }));
    //         enemyIdCounter++;
    //     }
    // }
}
function createEnvironment() {
    switch (Math.floor(Math.random() * 100)) {
        case 1:
            var id = environmentIdCounter;
            environments.set(id, new Environment(id, EnvironmentTypeEnum.CLOUD, Math.random() * WIDTH, -EnvironmentTypeEnum.CLOUD.shape.getHeight(), function (cause) {
                environments.delete(this.id);
            }));
            environmentIdCounter++;
    }
}
function update(elapsedTime) {
    if (currentInput.space && !priorInput.space) {
        player.shoot();
    }
    player.update(elapsedTime, currentInput.left ? -1 : (currentInput.right ? 1 : 0), currentInput.up);
    enemies.forEach(function (value) { return value.update(elapsedTime); });
    shots.forEach(function (value) { return value.update(elapsedTime); });
    shots.forEach(function (shot) {
        if (shot.isCollidingWith(player)) {
            player.onHit(shot);
            shot.onDestroyed();
        }
        enemies.forEach(function (enemy) {
            if (shot.isCollidingWith(enemy)) {
                enemy.onHit(shot);
                shot.onDestroyed();
            }
        });
    });
    environments.forEach(function (value) { return value.update(elapsedTime); });
}
function render(elapsedTime) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);
    environments.forEach(function (value) {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });
    backContext.fillStyle = player.type.shape.color;
    backContext.fillRect(player.x, player.y, player.type.shape.getWidth(), player.type.shape.getHeight());
    enemies.forEach(function (value) {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });
    shots.forEach(function (value) {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });
}
function updateStatus(scoreDelta, healthDelta) {
    if (healthDelta === void 0) { healthDelta = 0; }
    score += scoreDelta;
    player.lives += healthDelta;
    scoreElement.innerText = "" + score;
    livesElement.innerText = "" + player.lives;
}
function endGame() {
    running = false;
    alert("Game over!");
}
window.requestAnimationFrame(loop);
//# sourceMappingURL=asteroids.js.map