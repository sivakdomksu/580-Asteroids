"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vector_1 = require("./vector");
const WIDTH = 1200;
const HEIGHT = 650;
const ROTATION_SPEED = 0.2;
const ACC_SPEED = 1;
const DECELERATION_SPEED = 0.4;
const KNOCK_BACK = 0.65;
const MAX_SPEED = 8;
const ENEMY_RADIUS = 20;
const ENEMY_SPAWN_RATE = 1000;
const ENEMY_SPAWN_PROBABILITY = 3;
const ENEMY_SCALING = 2;
const LVL_COOLDOWN = 3000;
let score = 0;
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
var Role;
(function (Role) {
    Role[Role["PLAYER"] = 0] = "PLAYER";
    Role[Role["ENEMY"] = 1] = "ENEMY";
})(Role || (Role = {}));
class Boundary {
    constructor(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    isInBounds(x, y, shape) {
        return x >= this.minX && y >= this.minY && (x + shape.getWidth()) <= this.maxX && (y + shape.getHeight()) <= this.maxY;
    }
}
class NoBoundary extends Boundary {
    constructor() {
        super(0, 0, 0, 0);
    }
    isInBounds(x, y, shape) {
        return true;
    }
}
class Shape {
    constructor(color, mass) {
        this.color = color;
        this.mass = mass;
    }
    isCollidingWith(pos, other, otherPos) {
        if (other instanceof Rectangle) {
            return this.isCollidingWithRectangle(pos, other, otherPos);
        }
        else if (other instanceof Circle) {
            return this.isCollidingWithCircle(pos, other, otherPos);
        }
        else {
            throw new Error("Unknown shape type: " + other);
        }
    }
}
class Rectangle extends Shape {
    constructor(width, height, color, mass) {
        super(color, mass);
        this.width = width;
        this.height = height;
    }
    getHeight() {
        return this.height;
    }
    getWidth() {
        return this.width;
    }
    render(context) {
        context.fillStyle = this.color;
        context.fillRect(0, 0, this.width, this.height);
    }
    isCollidingWithCircle(pos, other, otherPos) {
        return other.isCollidingWithRectangle(otherPos, this, pos);
    }
    isCollidingWithRectangle(pos, other, otherPos) {
        return pos.x < otherPos.x + other.getWidth() &&
            pos.x + this.getWidth() > otherPos.x &&
            pos.y < otherPos.y + other.getHeight() &&
            pos.y + this.getHeight() > otherPos.y;
    }
}
class CharRectangle extends Rectangle {
    constructor(width, height, color, mass, char) {
        super(width, height, color, mass);
        this.char = char;
        this.char = this.char.charAt(0);
    }
    render(context) {
        super.render(context);
        context.font = "20px Arial";
        context.fillStyle = "#ffffff";
        let txtWidth = context.measureText(this.char).width;
        context.fillText(this.char, 0.5 * this.width - 0.5 * txtWidth, 0.5 * this.height + 0.5 * 20);
    }
}
class Circle extends Shape {
    constructor(radius, color, mass) {
        super(color, mass);
        this.radius = radius;
    }
    getHeight() {
        return 2 * this.radius;
    }
    getWidth() {
        return 2 * this.radius;
    }
    render(context) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI);
        context.fill();
    }
    isCollidingWithRectangle(pos, other, otherPos) {
        let closestX = vector_1.clamp(this.center(pos.x), otherPos.x, otherPos.x + other.getWidth());
        let closestY = vector_1.clamp(this.center(pos.y), otherPos.y, otherPos.y + other.getHeight());
        let distanceX = this.center(pos.x) - closestX;
        let distanceY = this.center(pos.y) - closestY;
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (this.radius * this.radius);
    }
    isCollidingWithCircle(pos, other, otherPos) {
        return Math.pow(this.center(otherPos.x) - this.center(pos.x), 2)
            + Math.pow(this.center(pos.y) - this.center(otherPos.y), 2)
            < Math.pow(this.radius + other.radius, 2);
    }
    center(n) {
        return n + this.radius;
    }
}
class GameObjectType {
    constructor(shape, boundary, move) {
        this.shape = shape;
        this.boundary = boundary;
        this.move = move;
    }
}
class UnitType extends GameObjectType {
    constructor(role, lives, shotFreq, shape, boundary, move, shot, bounties) {
        super(shape, boundary, move);
        this.role = role;
        this.lives = lives;
        this.shotFreq = shotFreq;
        this.shot = shot;
        this.bounties = bounties;
    }
}
class ShotType extends GameObjectType {
    constructor(dmg, shape, boundary, move) {
        super(shape, boundary, move);
        this.dmg = dmg;
    }
}
class EnvironmentType extends GameObjectType {
    constructor(shape, boundary, move) {
        super(shape, boundary, move);
    }
}
class Move {
    constructor() {
    }
    move(elapsedTime, rotation = 0, speed = null, moveVector = null) {
        throw new Error("Not Implemented!");
    }
}
class ConstantMove extends Move {
    constructor(vector) {
        super();
        this.vector = vector;
    }
    move(elapsedTime, rotation = 0, speed = null, moveVector = null) {
        return vector_1.default.from(this.vector.x * elapsedTime, this.vector.y * elapsedTime);
    }
    copy() {
        return new ConstantMove(vector_1.default.fromOther(this.vector));
    }
    setRotation(rotation) {
        this.vector.rotate(rotation);
        return this;
    }
    getVector() {
        return this.vector;
    }
}
class DynamicMove extends Move {
    constructor(decSpeed) {
        super();
        this.decSpeed = decSpeed;
        this.lastVector = vector_1.default.zero();
    }
    move(elapsedTime, rotation, speed, moveVector) {
        let vector = vector_1.default.fromOther(moveVector);
        vector.scale(speed.dec === 0 ? 1 : speed.curr / (speed.curr + speed.dec));
        if (speed.acc > 0) {
            vector.add(vector_1.default.construct(speed.acc, rotation));
        }
        this.lastVector = vector_1.default.fromOther(vector).scale(1 / elapsedTime);
        return vector;
    }
    copy() {
        return new DynamicMove(this.decSpeed);
    }
    setRotation(rotation) {
        return this;
    }
    getVector() {
        return this.lastVector;
    }
}
class AudioPool {
    constructor(url, count) {
        this.url = url;
        this.q = [];
        for (let i = 0; i < count; i++) {
            this.q.push(new Audio(url));
        }
    }
    play() {
        let audio = this.q.pop();
        if (!audio) {
            console.error("Audio Pool is not big enough!", this.url);
            return;
        }
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise !== undefined) {
            promise.then(value => {
                this.q.push(audio);
            });
        }
    }
}
const ShapeEnum = {
    PLAYER: new CharRectangle(20, 35, "#6a7fed", 10, "A"),
    ASTEROID_S: new Circle(ENEMY_RADIUS, "#ff2766", 10),
    ASTEROID_M: new Circle(2 * ENEMY_RADIUS, "#bb2c5b", 20),
    ASTEROID_L: new Circle(4 * ENEMY_RADIUS, "#a3163e", 30),
    SHOT: new Rectangle(5, 5, "#ffffff", 0),
    CLOUD: new Rectangle(150, 150, "#0a1e3a", 0)
};
const BoundaryEnum = {
    NONE: new NoBoundary(),
    SHOT: new Boundary(-ShapeEnum.ASTEROID_L.getWidth(), -ShapeEnum.ASTEROID_L.getHeight(), WIDTH + ShapeEnum.ASTEROID_L.getWidth(), HEIGHT + ShapeEnum.ASTEROID_L.getWidth()),
    CLOUD: new Boundary(-ShapeEnum.CLOUD.width, -ShapeEnum.CLOUD.height, WIDTH + ShapeEnum.CLOUD.width, HEIGHT + ShapeEnum.CLOUD.height)
};
const BountyEnum = {
    BOUNTY_S: (enemy, shot, type) => {
        if (type == HitTypeEnum.DESTROYED)
            score += 50;
    },
    BOUNTY_M: (enemy, shot, type) => {
        if (type == HitTypeEnum.HIT)
            score += 30;
    },
    BOUNTY_L: (enemy, shot, type) => {
        if (type == HitTypeEnum.HIT)
            score += 10;
    }
};
const MoveTypeEnum = {
    PLAYER: new DynamicMove(DECELERATION_SPEED),
    ENEMY_SIMPLE: new ConstantMove(vector_1.default.from(0, 0.1)),
    PLAYER_SHOT: new ConstantMove(vector_1.default.from(0, -0.5)),
    ENEMY_SHOT: new ConstantMove(vector_1.default.from(0, 0.4)),
    CLOUD: new ConstantMove(vector_1.default.from(0, 0.05))
};
const ShotTypeEnum = {
    PLAYER: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.PLAYER_SHOT),
    ENEMY: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.ENEMY_SHOT)
};
const UnitTypeEnum = {
    PLAYER: new UnitType(Role.PLAYER, 1, 0, ShapeEnum.PLAYER, BoundaryEnum.NONE, MoveTypeEnum.PLAYER, ShotTypeEnum.PLAYER, []),
    ASTEROID_S: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_S, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.PLAYER, [BountyEnum.BOUNTY_S]),
    ASTEROID_M: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_M, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, [BountyEnum.BOUNTY_M]),
    ASTEROID_L: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_L, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, [BountyEnum.BOUNTY_L]),
};
const EnvironmentTypeEnum = {
    CLOUD: new EnvironmentType(ShapeEnum.CLOUD, BoundaryEnum.CLOUD, MoveTypeEnum.CLOUD)
};
const AudioPoolEnum = {
    PLAYER_SHOT: new AudioPool("audio/Shot.wav", 5),
    COLLISION: new AudioPool("audio/Collision.wav", 10)
};
class GameObject {
    constructor(id, type, x, y, rot, onDestroyed) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.rot = rot;
        this.onDestroyed = onDestroyed;
        this.rotation = 0;
        this.move = null;
        this.moveVector = vector_1.default.zero();
        this.speed = 0;
        this.move = type.move.copy().setRotation(rot);
    }
    update(elapsedTime, rotation = 0, movement = false) {
        this.moveVector = this.move.move(elapsedTime);
        let old = vector_1.default.from(this.x, this.y);
        if (this.type.boundary.isInBounds(this.x + this.moveVector.x, this.y + this.moveVector.y, this.type.shape)) {
            this.x += this.moveVector.x;
            this.y += this.moveVector.y;
            if (this.type.boundary instanceof NoBoundary) {
                this.warpToOtherSide(old);
            }
        }
        else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(this, DeathCauseEnum.OUT_OF_BOUNDS);
        }
    }
    warpToOtherSide(old) {
        if (this.x > WIDTH && !(old.x > WIDTH))
            this.x = -this.getWidth();
        else if (this.x + this.getWidth() < 0 && !(old.x + this.getWidth() < 0))
            this.x = WIDTH;
        if (this.y > HEIGHT && !(old.y > HEIGHT))
            this.y = -this.getHeight();
        else if (this.y + this.getHeight() < 0 && !(old.y + this.getHeight() < 0))
            this.y = HEIGHT;
    }
    isCollidingWith(other) {
        return this.type.shape.isCollidingWith(vector_1.default.from(this.x, this.y), other.type.shape, vector_1.default.from(other.x, other.y));
    }
    render(context) {
        context.save();
        context.translate(this.x + 0.5 * this.getWidth(), this.y + 0.5 * this.getHeight());
        context.rotate(vector_1.rad(this.rotation));
        context.translate(-0.5 * this.getWidth(), -0.5 * this.getHeight());
        this.type.shape.render(context);
        context.restore();
    }
    //region Helper Methods
    getWidth() {
        return this.type.shape.getWidth();
    }
    getHeight() {
        return this.type.shape.getHeight();
    }
    getColor() {
        return this.type.shape.color;
    }
    getMass() {
        return this.type.shape.mass;
    }
}
class Unit extends GameObject {
    constructor(id, type, x, y, rot, onDestroyed) {
        super(id, type, x, y, rot, onDestroyed);
        this.type = type;
        this.lives = type.lives;
    }
    onHit(other) {
        if ( /*this.type.role == Role.ENEMY && other instanceof Unit && other.type.role == Role.ENEMY*/true) {
            let collision = collide(this, other);
            this.moveVector = collision.a;
            other.moveVector = collision.b;
            this.move = new ConstantMove(collision.a);
            other.move = new ConstantMove(collision.b);
            this.speed = MAX_SPEED;
        }
        if (this.lives < 1) {
            if (this.type.morph) {
                morph(this);
            }
            else {
                this.onDestroyed(this, DeathCauseEnum.LIVES);
            }
        }
    }
    ;
    isAlive() {
        return this.lives > 0;
    }
    isInBounds() {
        return this.type.boundary.isInBounds(this.x, this.y, this.type.shape);
    }
    update(elapsedTime, rotation = 0, movement = false) {
        super.update(elapsedTime, rotation, movement);
        if (this.type === UnitTypeEnum.PLAYER) {
            return;
        }
        switch (Math.floor(Math.random() * this.type.shotFreq)) {
            case 1:
                this.shoot();
        }
    }
    shoot() {
        let id = shotIdCounter;
        let shot = new Shot(id, this.type, this.type.shot, this.x + this.getWidth() / 2, this.y + this.getHeight() / 2, this.rotation, (object, cause) => {
            shots.delete(object.id);
        });
        this.moveVector.add(vector_1.default.construct(KNOCK_BACK, this.rotation).scale(-1));
        this.speed = Math.min(MAX_SPEED, this.speed + (KNOCK_BACK));
        shots.set(id, shot);
        shotIdCounter++;
        AudioPoolEnum.PLAYER_SHOT.play();
        return shot;
    }
}
class Player extends Unit {
    constructor(id, type, x, y, rot, onDestroyed) {
        super(id, type, x, y, rot, onDestroyed);
        this.type = type;
    }
    onHit(other) {
        if (other instanceof Unit && other.type.role == Role.ENEMY)
            this.lives--;
        if (this.lives < 1) {
            this.onDestroyed(this, DeathCauseEnum.LIVES);
        }
    }
    update(elapsedTime, rotation = 0, movement = false) {
        this.rotation = vector_1.mod(this.rotation + rotation * ROTATION_SPEED * elapsedTime, 360);
        let oldSpeed = this.speed;
        this.speed = Math.max(0, this.speed - (DECELERATION_SPEED * elapsedTime / 100));
        let decSpeed = oldSpeed - this.speed;
        let accSpeed = 0;
        oldSpeed = this.speed;
        if (movement) {
            this.speed = Math.min(MAX_SPEED, this.speed + (ACC_SPEED * elapsedTime / 100));
            accSpeed = this.speed - oldSpeed;
        }
        this.moveVector = this.move.move(elapsedTime, this.rotation, {
            curr: oldSpeed,
            dec: decSpeed,
            acc: accSpeed
        }, this.moveVector);
        let old = vector_1.default.from(this.x, this.y);
        this.x += this.moveVector.x;
        this.y += this.moveVector.y;
        this.warpToOtherSide(old);
    }
}
class Shot extends GameObject {
    constructor(id, initiator, type, x, y, rot, onDestroyed) {
        super(id, type, x, y, rot, onDestroyed);
        this.initiator = initiator;
        this.type = type;
    }
    isCollidingWith(other) {
        return super.isCollidingWith(other) && this.initiator !== other.type;
    }
    onHit(other) {
        let o = other;
        if (this.initiator == o.type)
            return;
        o.type.bounties.forEach(bounty => {
            bounty(o, this, HitTypeEnum.HIT);
        });
        o.lives -= this.type.dmg;
        o.onHit(this);
        this.onDestroyed(this, DeathCauseEnum.COLLISION);
    }
}
class Environment extends GameObject {
    constructor(id, type, x, y, rot, onDestroyed) {
        super(id, type, x, y, rot, onDestroyed);
    }
    onHit(other) {
    }
}
class Level {
    constructor(levelScale, enemyCounter, cooldown) {
        this.levelScale = levelScale;
        this.enemyCounter = enemyCounter;
        this.cooldown = cooldown;
        this.level = 0;
        this.levelSpawns = 1;
        this.passedSpawns = false;
        this.currCooldown = 0;
        this.state = 0;
        this.reset();
    }
    /**
     * return true if enemies can be spawned, false otherwise.
     */
    updateLevel(elapsedTime) {
        switch (this.state) {
            case 0:
                this.checkAllSpawned();
                break;
            case 1:
                this.checkAllDestroyed();
                break;
            case 2:
                this.checkCooldown(elapsedTime);
                break;
        }
        return this.state == 0;
    }
    reset() {
        this.level++;
        this.levelSpawns = this.levelScale(this.level);
        this.passedSpawns = false;
        this.currCooldown = 0;
        this.state = 0;
    }
    getLimit() {
        return this.levelSpawns;
    }
    getLevel() {
        return this.level;
    }
    checkAllSpawned() {
        if (this.enemyCounter() >= this.levelSpawns)
            this.state = 1;
    }
    checkAllDestroyed() {
        if (this.enemyCounter() == 0)
            this.state = 2;
    }
    checkCooldown(elapsedTime) {
        if (this.currCooldown > this.cooldown) {
            this.raiseLevel();
        }
        else {
            this.currCooldown += elapsedTime;
        }
    }
    raiseLevel() {
        this.reset();
    }
}
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
var player = new Player(0, UnitTypeEnum.PLAYER, 0, 0, 0, () => {
    updateStatus();
    endGame();
});
player.x = WIDTH / 2 - player.getWidth() / 2;
player.y = HEIGHT - player.getHeight();
var scoreElement = document.getElementById("score_text");
var livesElement = document.getElementById("lives_text");
var levelElement = document.getElementById("level_text");
var enemyTimeToSpawn = 0;
var enemyIdCounter = 0;
var shotIdCounter = 0;
var environmentIdCounter = 0;
var enemies = new Map();
var shots = new Map();
var environments = new Map();
var running = true;
let spawnCooldown = true;
let level = new Level(lvl => ENEMY_SCALING * lvl, () => enemies.size, LVL_COOLDOWN);
UnitTypeEnum.ASTEROID_M.morph = UnitTypeEnum.ASTEROID_S;
UnitTypeEnum.ASTEROID_L.morph = UnitTypeEnum.ASTEROID_M;
function loop(timestamp) {
    if (!running)
        return;
    updateStatus(level.getLevel());
    if (!start)
        start = timestamp;
    let elapsedTime = timestamp - start;
    start = timestamp;
    if (level.updateLevel(elapsedTime))
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
            event.preventDefault();
            currentInput.space = true;
            break;
        case 'ArrowUp':
        case 'w':
            event.preventDefault();
            currentInput.up = true;
            break;
        case 'ArrowLeft':
        case 'a':
            event.preventDefault();
            currentInput.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            event.preventDefault();
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
    enemyTimeToSpawn += elapsedTime;
    if (enemyTimeToSpawn > ENEMY_SPAWN_RATE) {
        enemyTimeToSpawn = 0;
        if (Math.random() * ENEMY_SPAWN_PROBABILITY < 1) {
            let id = enemyIdCounter;
            let type = UnitTypeEnum.ASTEROID_M;
            switch (Math.floor(Math.random() * 10)) {
                case 0:
                    type = UnitTypeEnum.ASTEROID_L;
                    break;
                case 1:
                    type = UnitTypeEnum.ASTEROID_S;
                    break;
            }
            enemies.set(id, new Unit(id, type, Math.random() * (WIDTH - type.shape.getWidth()), -type.shape.getHeight(), Math.random() * 360, (object, cause) => {
                if (cause == DeathCauseEnum.LIVES) {
                    object.type.bounties.forEach(bounty => bounty(object, null, HitTypeEnum.DESTROYED));
                }
                enemies.delete(id);
            }));
            enemyIdCounter++;
        }
    }
}
function createEnvironment() {
    switch (Math.floor(Math.random() * 100)) {
        case 1:
            let id = environmentIdCounter;
            environments.set(id, new Environment(id, EnvironmentTypeEnum.CLOUD, Math.random() * WIDTH, -EnvironmentTypeEnum.CLOUD.shape.getHeight(), 0, (object, cause) => {
                environments.delete(object.id);
            }));
            environmentIdCounter++;
    }
}
function collide(a, b) {
    //http://www.vobarian.com/collisions/2dcollisions2.pdf
    let un = vector_1.default.from((b.x + 0.5 * b.getWidth()) - (a.x + 0.5 * a.getWidth()), (b.y + 0.5 * b.getHeight()) - (a.y + 0.5 * a.getHeight())).normalize();
    let ut = vector_1.default.perpendicular(un);
    let v1n = vector_1.default.dotProduct(un, a.move.getVector());
    let v1t = vector_1.default.dotProduct(ut, a.move.getVector());
    let v2n = vector_1.default.dotProduct(un, b.move.getVector());
    let v2t = vector_1.default.dotProduct(ut, b.move.getVector());
    let v_1t = v1t;
    let v_2t = v2t;
    let v_1n = (v1n * (a.getMass() - b.getMass()) + 2 * b.getMass() * v2n) / (a.getMass() + b.getMass());
    let v_2n = (v2n * (b.getMass() - a.getMass()) + 2 * a.getMass() * v1n) / (a.getMass() + b.getMass());
    AudioPoolEnum.COLLISION.play();
    while (a.isCollidingWith(b)) {
        a.update(-10);
        b.update(-10);
    }
    return {
        a: vector_1.default.fromOther(un).scale(v_1n).add(vector_1.default.fromOther(ut).scale(v_1t)),
        b: vector_1.default.fromOther(un).scale(v_2n).add(vector_1.default.fromOther(ut).scale(v_2t))
    };
}
function morph(unit) {
    let id = enemyIdCounter++;
    let copy = new Unit(id, unit.type.morph, unit.x, unit.y, 0, (object, cause) => {
        if (cause == DeathCauseEnum.LIVES) {
            object.type.bounties.forEach(bounty => bounty(object, null, HitTypeEnum.DESTROYED));
        }
        enemies.delete(id);
    });
    unit.type = unit.type.morph;
    enemies.set(id, copy);
    copy.move = unit.move.copy();
    copy.move.setRotation(-120);
    unit.move.setRotation(120);
    while (unit.isCollidingWith(copy)) {
        unit.update(10);
        copy.update(10);
    }
}
function update(elapsedTime) {
    if (currentInput.space && !priorInput.space) {
        player.shoot();
    }
    player.update(elapsedTime, currentInput.left ? -1 : (currentInput.right ? 1 : 0), currentInput.up);
    enemies.forEach(value => value.update(elapsedTime));
    shots.forEach(value => value.update(elapsedTime));
    let collisionPairs = [];
    shots.forEach(shot => {
        collisionPairs.push({ a: shot, b: player });
        enemies.forEach(enemy => {
            collisionPairs.push({ a: shot, b: enemy });
        });
    });
    let enemyList = [];
    enemies.forEach((value) => enemyList.push(value));
    for (let i = 0; i < enemyList.length; i++) {
        collisionPairs.push({ a: player, b: enemyList[i] });
        for (let j = i + 1; j < enemyList.length; j++) {
            collisionPairs.push({ a: enemyList[i], b: enemyList[j] });
        }
    }
    environments.forEach(value => value.update(elapsedTime));
    checkCollisions(collisionPairs);
}
function checkCollisions(pairs) {
    pairs.forEach(value => {
        if (value.a.isCollidingWith(value.b)) {
            value.a.onHit(value.b);
        }
    });
}
function render(elapsedTime) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);
    environments.forEach(value => value.render(backContext));
    player.render(backContext);
    enemies.forEach(value => value.render(backContext));
    shots.forEach(value => value.render(backContext));
}
function updateStatus(level = null) {
    scoreElement.innerText = "" + score;
    livesElement.innerText = "" + player.lives;
    if (level !== null) {
        levelElement.innerText = "" + level;
    }
}
function endGame() {
    running = false;
    if (confirm("Game over!"))
        location.reload();
}
window.requestAnimationFrame(loop);
//# sourceMappingURL=asteroids.js.map