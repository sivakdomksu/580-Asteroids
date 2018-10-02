import Vector from "./vector";

const WIDTH = 800;
const HEIGHT = 600;
const PLAYER_HEIGHT = 50;
const ENEMY_SPAWN_RATE = 500;
const ENEMY_SPAWN_PROBABILITY = 3;
const ROTATION_SPEED = 3;
const ACC_SPEED = 0.5;
const ACC_VECTOR = Vector.from(0, ACC_SPEED);
const DECELERATION_SPEED = 0.05;
const MAX_SPEED = 10;

//region GameObject parts
type BountyCallback = (enemy: Unit, shot: Shot, type: HitTypeEnum) => any;

enum DeathCauseEnum {
    OUT_OF_BOUNDS,
    LIVES
}

enum HitTypeEnum {
    HIT,
    DESTROYED
}

class Boundary {
    constructor(public minX: number, public minY: number, public maxX: number, public maxY: number) {
    }

    isInBounds(x: number, y: number, shape: Shape) {
        return x >= this.minX && y >= this.minY && (x + shape.getWidth()) <= this.maxX && (y + shape.getHeight()) <= this.maxY;
    }
}

abstract class Shape {
    protected constructor(public color: string, public mass: number) {
    }

    public abstract getWidth(): number;

    public abstract getHeight(): number;
}

class Rectangle extends Shape {
    constructor(public width: number, public height: number, color: string, mass: number) {
        super(color, mass);
    }

    isInBounds(x: number, y: number, boundary: Boundary) {
        //TODO
    }

    getHeight(): number {
        return this.height
    }

    getWidth(): number {
        return this.width
    }
}

class Circle extends Shape {
    constructor(public radius: number, color: string, mass: number) {
        super(color, mass);
    }

    isInBounds(x: number, y: number, boundary: Boundary) {

    }

    getHeight(): number {
        return 2 * this.radius;
    }

    getWidth(): number {
        return 2 * this.radius;
    }
}

abstract class GameObjectType {
    protected constructor(public shape: Shape, public boundary: Boundary, public move: Move) {

    }
}

class UnitType extends GameObjectType {
    constructor(public lives: number, public shotFreq: number, shape: Shape, boundary: Boundary, move: Move, public shot: ShotType, public bounties: BountyCallback[]) {
        super(shape, boundary, move)
    }
}


class ShotType extends GameObjectType {
    constructor(public dmg: number, shape: Shape, boundary: Boundary, move: Move) {
        super(shape, boundary, move)
    }
}

class EnvironmentType extends GameObjectType {
    constructor(shape: Shape, boundary: Boundary, move: Move) {
        super(shape, boundary, move)
    }
}

class Move {
    constructor(public speedX: number, public speedY: number) {

    }

    move(elapsedTime: number, x: number, y: number, object: GameObject) {
        return {
            x: x + elapsedTime * this.speedX,
            y: y + elapsedTime * this.speedY
        }
    }
}

const ShapeEnum = {
    PLAYER: new Rectangle(PLAYER_HEIGHT, 75, "#6a7fed", 0),
    ENEMY: new Rectangle(45, 50, "#ff0000", 0),
    SHOT: new Rectangle(5, 5, "#ffffff", 0),
    HEALTH_ENEMY: new Rectangle(45, 50, "#91ff6f", 0),
    BIG_ONE: new Rectangle(60, 60, "#ffbb00", 0),
    FAST_ONE: new Rectangle(40, 40, "#f5a3ff", 0),
    CLOUD: new Rectangle(150, 150, "#0a1e3a", 0)
};

const BoundaryEnum = {
    NONE: new Boundary(Number.MIN_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
    SHOT: new Boundary(0, 0, WIDTH, HEIGHT),
    CLOUD: new Boundary(-ShapeEnum.CLOUD.width, -ShapeEnum.CLOUD.height, WIDTH + ShapeEnum.CLOUD.width, HEIGHT + ShapeEnum.CLOUD.height)
};

const BountyEnum = {
    SCORE_ST: (enemy: Unit, shot: GameObject, type: HitTypeEnum) => {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(10);
    },
    HEALTH_ST: (enemy: Unit, shot: GameObject, type: HitTypeEnum) => {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(0, 1);
    },
    SCORE_FAST: (enemy: Unit, shot: GameObject, type: HitTypeEnum) => {
        if (type == HitTypeEnum.HIT)
            updateStatus(20);
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(50);
    },
    SCORE_30: (enemy: Unit, shot: GameObject, type: HitTypeEnum) => {
        if (type == HitTypeEnum.DESTROYED)
            updateStatus(30);
    }
};

const MoveTypeEnum = {
    PLAYER: new Move(0.5, 0),
    ENEMY_SIMPLE: new Move(0, 0.1),
    PLAYER_SHOT: new Move(0, -0.5),
    ENEMY_SHOT: new Move(0, 0.4),
    CLOUD: new Move(0, 0.05)
};

const ShotTypeEnum = {
    PLAYER: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.PLAYER_SHOT),
    ENEMY: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.ENEMY_SHOT)
};

const UnitTypeEnum = {
    PLAYER: new UnitType(3, 0, ShapeEnum.PLAYER, BoundaryEnum.NONE, MoveTypeEnum.PLAYER, ShotTypeEnum.PLAYER, []),
};

const EnvironmentTypeEnum = {
    CLOUD: new EnvironmentType(ShapeEnum.CLOUD, BoundaryEnum.CLOUD, MoveTypeEnum.CLOUD)
};

//endregion

//region GameObjects
type HitCallback = (other: GameObject) => any;
type DestroyedCallback = (cause: DeathCauseEnum) => any;

abstract class GameObject {
    public rotation: number = 0;

    protected constructor(public id: number, public type: GameObjectType, public x: number, public y: number, public onDestroyed: DestroyedCallback) {
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false) {
        let move = this.type.move.move(elapsedTime, this.x, this.y, this);
        if (this.type.boundary.isInBounds(move.x, move.y, this.type.shape)) {
            this.x = move.x;
            this.y = move.y;
        } else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(DeathCauseEnum.OUT_OF_BOUNDS);
        }
    }

    isCollidingWith(other: GameObject): boolean {
        //TODO
        return false;
    }
}

class Unit extends GameObject {
    public moveVector: Vector = Vector.zero();

    public onHit: HitCallback = other => {
        if (other instanceof Shot) {
            if (other.initiator == this.type)
                return;
            this.type.bounties.forEach(bounty => {
                bounty(this, other, HitTypeEnum.HIT)
            });
            this.lives -= other.type.dmg;
            updateStatus(0);
        } else {
            this.lives--;
            updateStatus(0);
        }
        if (this.lives < 1)
            this.onDestroyed(DeathCauseEnum.LIVES);
    };
    public lives: number;

    constructor(id: number, public type: UnitType, x: number, y: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, onDestroyed);
        this.lives = type.lives;
    }

    isAlive(): boolean {
        return this.lives > 0;
    }

    isInBounds(): boolean {
        return this.type.boundary.isInBounds(this.x, this.y, this.type.shape);
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false): void {
        super.update(elapsedTime, rotation, movement);
        if (this.type === UnitTypeEnum.PLAYER) {
            return;
        }
        switch (Math.floor(Math.random() * this.type.shotFreq)) {
            case 1:
                this.shoot()
        }
    }

    shoot(): Shot {
        let id = shotIdCounter;
        let shot = new Shot(id, this.type, this.type.shot, this.x + this.type.shape.getWidth() / 2, this.y, (cause: DeathCauseEnum) => {
            shots.delete(id);
        });
        shots.set(id, shot);
        shotIdCounter++;
        return shot;
    }
}

class Player extends Unit {
    private speed: number = 0;

    constructor(id: number, public type: UnitType, x: number, y: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, onDestroyed);
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false): void {
        this.rotation += (rotation * ROTATION_SPEED * elapsedTime) % 360;
        this.speed = Math.max(0, this.speed - DECELERATION_SPEED);
        if (movement && this.speed + ACC_SPEED > MAX_SPEED) {
            this.moveVector.add(Vector.rotate(ACC_VECTOR, this.rotation));
        } else {
            this.speed = Math.min(MAX_SPEED, movement ? this.speed + ACC_SPEED : Number.MAX_VALUE);
        }
        this.moveVector.add(Vector.fromOther(this.moveVector).normalize().scale(-DECELERATION_SPEED));

        this.x = (this.x + this.moveVector.x) % WIDTH;
        this.y = (this.y + this.moveVector.y) % HEIGHT;
    }
}

class Shot extends GameObject {
    constructor(id: number, public initiator: UnitType, public type: ShotType, x: number, y: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, onDestroyed);
    }

    isCollidingWith(other: GameObject): boolean {
        return super.isCollidingWith(other) && this.initiator !== other.type;
    }
}

class Environment extends GameObject {
    constructor(id: number, type: EnvironmentType, x: number, y: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, onDestroyed);
    }
}

//endregion

var frontCanvas = <HTMLCanvasElement> document.getElementById("canvas");
var frontContext = frontCanvas.getContext("2d");

var backCanvas = <HTMLCanvasElement> document.createElement("canvas");
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

var player = new Player(0, UnitTypeEnum.PLAYER, 0, 0, () => {
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
var enemies = new Map<number, Unit>();
// @ts-ignore
var shots = new Map<number, Shot>();
// @ts-ignore
var environments = new Map<number, Environment>();
var running: boolean = true;

function loop(timestamp) {
    if (!running)
        return;
    if (!start) start = timestamp;
    let elapsedTime = timestamp - start;
    start = timestamp;

    createEnemy(elapsedTime);
    createEnvironment();
    update(elapsedTime);
    render(elapsedTime);
    pollInput();

    frontContext.clearRect(0, 0, WIDTH, HEIGHT);
    frontContext.drawImage(backCanvas, 0, 0);
    window.requestAnimationFrame(loop)
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

function createEnemy(elapsedTime: number) {
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
            let id = environmentIdCounter;
            environments.set(id, new Environment(id, EnvironmentTypeEnum.CLOUD, Math.random() * WIDTH, -EnvironmentTypeEnum.CLOUD.shape.getHeight(), function (cause: DeathCauseEnum) {
                environments.delete(this.id);
            }));
            environmentIdCounter++;
    }
}

function update(elapsedTime: number) {
    if (currentInput.space && !priorInput.space) {
        player.shoot();
    }
    player.update(elapsedTime, currentInput.left ? -1 : (currentInput.right ? 1 : 0), currentInput.up);

    enemies.forEach(value => value.update(elapsedTime));
    shots.forEach(value => value.update(elapsedTime));

    shots.forEach(shot => {
        if (shot.isCollidingWith(player)) {
            player.onHit(shot);
            shot.onDestroyed();
        }
        enemies.forEach(enemy => {
            if (shot.isCollidingWith(enemy)) {
                enemy.onHit(shot);
                shot.onDestroyed();
            }
        })
    });
    environments.forEach(value => value.update(elapsedTime));
}

function render(elapsedTime: number) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);

    environments.forEach(value => {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });

    backContext.fillStyle = player.type.shape.color;
    backContext.fillRect(player.x, player.y, player.type.shape.getWidth(), player.type.shape.getHeight());

    enemies.forEach(value => {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });

    shots.forEach(value => {
        backContext.fillStyle = value.type.shape.color;
        backContext.fillRect(value.x, value.y, value.type.shape.getWidth(), value.type.shape.getHeight());
    });
}

function updateStatus(scoreDelta: number, healthDelta: number = 0) {
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


