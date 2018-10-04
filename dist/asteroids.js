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
var ROTATION_SPEED = 0.2;
var ACC_SPEED = 1;
var DECELERATION_SPEED = 0.4;
var KNOCK_BACK = 0.65;
var MAX_SPEED = 8;
var ENEMY_RADIUS = 20;
var DeathCauseEnum;
(function (DeathCauseEnum) {
    DeathCauseEnum[DeathCauseEnum["OUT_OF_BOUNDS"] = 0] = "OUT_OF_BOUNDS";
    DeathCauseEnum[DeathCauseEnum["LIVES"] = 1] = "LIVES";
    DeathCauseEnum[DeathCauseEnum["COLLISION"] = 2] = "COLLISION";
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
    Rectangle.prototype.render = function (context) {
        context.fillStyle = this.color;
        context.fillRect(0, 0, this.width, this.height);
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
    Circle.prototype.render = function (context) {
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
    function Move() {
    }
    Move.prototype.move = function (elapsedTime, rotation, speed, moveVector) {
        if (rotation === void 0) { rotation = 0; }
        if (speed === void 0) { speed = 0; }
        if (moveVector === void 0) { moveVector = null; }
        throw new Error("Not Implemented!");
    };
    return Move;
}());
var ConstantMove = /** @class */ (function (_super) {
    __extends(ConstantMove, _super);
    function ConstantMove(vector) {
        var _this = _super.call(this) || this;
        _this.vector = vector;
        return _this;
    }
    ConstantMove.prototype.move = function (elapsedTime, rotation, speed, moveVector) {
        if (rotation === void 0) { rotation = 0; }
        if (speed === void 0) { speed = 0; }
        if (moveVector === void 0) { moveVector = null; }
        return vector_1.default.from(this.vector.x * elapsedTime, this.vector.y * elapsedTime);
    };
    ConstantMove.prototype.copy = function () {
        return new ConstantMove(vector_1.default.fromOther(this.vector));
    };
    ConstantMove.prototype.setRotation = function (rotation) {
        this.vector.rotate(rotation);
        return this;
    };
    return ConstantMove;
}(Move));
var DynamicMove = /** @class */ (function (_super) {
    __extends(DynamicMove, _super);
    function DynamicMove(decSpeed) {
        var _this = _super.call(this) || this;
        _this.decSpeed = decSpeed;
        return _this;
    }
    DynamicMove.prototype.move = function (elapsedTime, rotation, speed) {
        return null;
    };
    DynamicMove.prototype.copy = function () {
        return new DynamicMove(this.decSpeed);
    };
    DynamicMove.prototype.setRotation = function (rotation) {
    };
    return DynamicMove;
}(Move));
var ShapeEnum = {
    PLAYER: new Rectangle(20, 35, "#6a7fed", 0),
    ASTEROID_S: new Circle(ENEMY_RADIUS, "#ff2766", 0),
    ASTEROID_M: new Circle(2 * ENEMY_RADIUS, "#bb2c5b", 0),
    ASTEROID_L: new Circle(4 * ENEMY_RADIUS, "#a3163e", 0),
    SHOT: new Rectangle(5, 5, "#ffffff", 0),
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
    PLAYER: new DynamicMove(DECELERATION_SPEED),
    ENEMY_SIMPLE: new ConstantMove(vector_1.default.from(0, 0.1)),
    PLAYER_SHOT: new ConstantMove(vector_1.default.from(0, -0.5)),
    ENEMY_SHOT: new ConstantMove(vector_1.default.from(0, 0.4)),
    CLOUD: new ConstantMove(vector_1.default.from(0, 0.05))
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
    function GameObject(id, type, x, y, rot, onDestroyed) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.rot = rot;
        this.onDestroyed = onDestroyed;
        this.rotation = 0;
        this.move = null;
        this.speed = 0;
        this.move = type.move.copy().setRotation(rot);
    }
    GameObject.prototype.update = function (elapsedTime, rotation, movement) {
        if (rotation === void 0) { rotation = 0; }
        if (movement === void 0) { movement = false; }
        var move = this.move.move(elapsedTime);
        if (this.type.boundary.isInBounds(this.x + move.x, this.y + move.y, this.type.shape)) {
            this.x += move.x;
            this.y += move.y;
        }
        else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(DeathCauseEnum.OUT_OF_BOUNDS);
        }
    };
    GameObject.prototype.isCollidingWith = function (other) {
        //TODO
        return false;
    };
    GameObject.prototype.render = function (context) {
        context.save();
        context.translate(this.x + 0.5 * this.getWidth(), this.y + 0.5 * player.getHeight());
        context.rotate(vector_1.rad(this.rotation));
        context.translate(-0.5 * this.getWidth(), -0.5 * this.getHeight());
        this.type.shape.render(context);
        context.restore();
    };
    //region Helper Methods
    GameObject.prototype.getWidth = function () {
        return this.type.shape.getWidth();
    };
    GameObject.prototype.getHeight = function () {
        return this.type.shape.getHeight();
    };
    GameObject.prototype.getColor = function () {
        return this.type.shape.color;
    };
    return GameObject;
}());
var Unit = /** @class */ (function (_super) {
    __extends(Unit, _super);
    function Unit(id, type, x, y, rot, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, rot, onDestroyed) || this;
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
        var shot = new Shot(id, this.type, this.type.shot, this.x + this.getWidth() / 2, this.y + this.getHeight() / 2, this.rotation, function (cause) {
            shots.delete(id);
        });
        this.moveVector.add(vector_1.default.construct(KNOCK_BACK, this.rotation).scale(-1));
        this.speed = Math.min(MAX_SPEED, this.speed + (KNOCK_BACK));
        shots.set(id, shot);
        shotIdCounter++;
        return shot;
    };
    return Unit;
}(GameObject));
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(id, type, x, y, rot, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, rot, onDestroyed) || this;
        _this.type = type;
        return _this;
    }
    Player.prototype.update = function (elapsedTime, rotation, movement) {
        if (rotation === void 0) { rotation = 0; }
        if (movement === void 0) { movement = false; }
        this.rotation = vector_1.mod(this.rotation + rotation * ROTATION_SPEED * elapsedTime, 360);
        var oldSpeed = this.speed;
        this.speed = Math.max(0, this.speed - (DECELERATION_SPEED * elapsedTime / 100));
        this.moveVector.scale(oldSpeed === 0 ? 1 : this.speed / oldSpeed);
        oldSpeed = this.speed;
        if (movement) {
            this.speed = Math.min(MAX_SPEED, this.speed + (ACC_SPEED * elapsedTime / 100));
            this.moveVector.add(vector_1.default.construct(this.speed - oldSpeed, this.rotation));
        }
        else if (this.speed === 0) {
            // this.moveVector = Vector.zero();
        }
        this.x = vector_1.mod(this.x + this.moveVector.x, WIDTH);
        this.y = vector_1.mod(this.y + this.moveVector.y, HEIGHT);
    };
    return Player;
}(Unit));
var Shot = /** @class */ (function (_super) {
    __extends(Shot, _super);
    function Shot(id, initiator, type, x, y, rot, onDestroyed) {
        var _this = _super.call(this, id, type, x, y, rot, onDestroyed) || this;
        _this.initiator = initiator;
        _this.type = type;
        return _this;
    }
    Shot.prototype.isCollidingWith = function (other) {
        return !_super.prototype.isCollidingWith.call(this, other) && this.initiator !== other.type;
    };
    return Shot;
}(GameObject));
var Environment = /** @class */ (function (_super) {
    __extends(Environment, _super);
    function Environment(id, type, x, y, rot, onDestroyed) {
        return _super.call(this, id, type, x, y, rot, onDestroyed) || this;
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
var player = new Player(0, UnitTypeEnum.PLAYER, 0, 0, 0, function () {
    endGame();
});
player.x = WIDTH / 2 - player.getWidth() / 2;
player.y = HEIGHT - player.getHeight();
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
            break;
        case 'ArrowUp':
        case 'w':
            currentInput.up = true;
            break;
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
            break;
        case 'ArrowUp':
        case 'w':
            currentInput.up = false;
            break;
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
            environments.set(id, new Environment(id, EnvironmentTypeEnum.CLOUD, Math.random() * WIDTH, -EnvironmentTypeEnum.CLOUD.shape.getHeight(), 0, function (cause) {
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
                shot.onDestroyed(DeathCauseEnum.COLLISION);
            }
        });
    });
    environments.forEach(function (value) { return value.update(elapsedTime); });
}
function render(elapsedTime) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);
    environments.forEach(function (value) {
        value.render(backContext);
    });
    player.render(backContext);
    enemies.forEach(function (value) {
        value.render(backContext);
    });
    shots.forEach(function (value) {
        value.render(backContext);
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