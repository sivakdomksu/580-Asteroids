import Vector, {mod, rad} from "./vector";

const WIDTH = 800;
const HEIGHT = 600;
const ROTATION_SPEED = 0.2;
const ACC_SPEED = 1;
const DECELERATION_SPEED = 0.4;
const KNOCK_BACK = 0.65;
const MAX_SPEED = 8;
const ENEMY_RADIUS = 20;
const ENEMY_SPAWN_RATE = 1000;
const ENEMY_SPAWN_PROBABILITY = 3;

//region GameObject parts
type BountyCallback = (enemy: Unit, shot: Shot, type: HitTypeEnum) => any;
type SpeedStruct = { curr: number, dec: number, acc: number }

enum DeathCauseEnum {
    OUT_OF_BOUNDS,
    LIVES,
    COLLISION
}

enum HitTypeEnum {
    HIT,
    DESTROYED
}

class Boundary {
    constructor(public minX: number, public minY: number, public maxX: number, public maxY: number) {
    }

    isInBounds(x: number, y: number, shape: Shape): boolean {
        return x >= this.minX && y >= this.minY && (x + shape.getWidth()) <= this.maxX && (y + shape.getHeight()) <= this.maxY;
    }
}

class NoBoundary extends Boundary {
    constructor() {
        super(0, 0, 0, 0);
    }

    isInBounds(x: number, y: number, shape: Shape): boolean {
        return true;
    }
}

abstract class Shape {
    protected constructor(public color: string, public mass: number) {
    }

    public abstract getWidth(): number;

    public abstract getHeight(): number;

    public abstract render(context: CanvasRenderingContext2D);
}

class Rectangle extends Shape {
    constructor(public width: number, public height: number, color: string, mass: number) {
        super(color, mass);
    }

    getHeight(): number {
        return this.height
    }

    getWidth(): number {
        return this.width
    }

    render(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color;
        context.fillRect(0, 0, this.width, this.height);
    }
}

class Circle extends Shape {
    constructor(public radius: number, color: string, mass: number) {
        super(color, mass);
    }

    getHeight(): number {
        return 2 * this.radius;
    }

    getWidth(): number {
        return 2 * this.radius;
    }

    render(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI);
        context.fill();
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

abstract class Move {
    protected constructor() {
    }

    move(elapsedTime: number, rotation: number = 0, speed: SpeedStruct = null, moveVector: Vector = null): Vector {
        throw new Error("Not Implemented!");
    }

    abstract copy(): Move;

    abstract setRotation(rotation: number): Move;
}

class ConstantMove extends Move {
    constructor(public vector: Vector) {
        super();
    }

    move(elapsedTime: number, rotation: number = 0, speed: SpeedStruct = null, moveVector: Vector = null): Vector {
        return Vector.from(this.vector.x * elapsedTime, this.vector.y * elapsedTime);
    }

    public copy(): Move {
        return new ConstantMove(Vector.fromOther(this.vector));
    }


    public setRotation(rotation: number): Move {
        this.vector.rotate(rotation);
        return this;
    }
}

class DynamicMove extends Move {
    constructor(private decSpeed: number) {
        super();
    }

    move(elapsedTime: number, rotation: number, speed: SpeedStruct, moveVector: Vector): Vector {
        let vector = Vector.fromOther(moveVector);
        vector.scale(speed.dec === 0 ? 1 : speed.curr / (speed.curr + speed.dec));
        if (speed.acc > 0) {
            vector.add(Vector.construct(speed.acc, rotation));
        }
        return vector;
    }


    copy(): Move {
        return new DynamicMove(this.decSpeed);
    }

    setRotation(rotation: number): Move {
        return this;
    }
}

class AudioPool {
    private q: HTMLAudioElement[] = [];

    constructor(private url: string, count: number) {
        for (let i = 0; i < count; i++) {
            this.q.push(new Audio(url));
        }
    }

    public play() {
        let audio = this.q.pop();
        if (!audio) {
            console.log("Audio Pool is not big enough!", this.url);
            return;
        }
        audio.load();
        audio.addEventListener("ended", () => {
            this.q.push(audio);
        });
        audio.play();
    }
}

const ShapeEnum = {
    PLAYER: new Rectangle(20, 35, "#6a7fed", 0),
    ASTEROID_S: new Circle(ENEMY_RADIUS, "#ff2766", 0),
    ASTEROID_M: new Circle(2 * ENEMY_RADIUS, "#bb2c5b", 0),
    ASTEROID_L: new Circle(4 * ENEMY_RADIUS, "#a3163e", 0),
    SHOT: new Rectangle(5, 5, "#ffffff", 0),
    CLOUD: new Rectangle(150, 150, "#0a1e3a", 0)
};

const BoundaryEnum = {
    NONE: new NoBoundary(),
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
    PLAYER: new DynamicMove(DECELERATION_SPEED),
    ENEMY_SIMPLE: new ConstantMove(Vector.from(0, 0.1)),
    PLAYER_SHOT: new ConstantMove(Vector.from(0, -0.5)),
    ENEMY_SHOT: new ConstantMove(Vector.from(0, 0.4)),
    CLOUD: new ConstantMove(Vector.from(0, 0.05))
};

const ShotTypeEnum = {
    PLAYER: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.PLAYER_SHOT),
    ENEMY: new ShotType(1, ShapeEnum.SHOT, BoundaryEnum.SHOT, MoveTypeEnum.ENEMY_SHOT)
};

const UnitTypeEnum = {
    PLAYER: new UnitType(3, 0, ShapeEnum.PLAYER, BoundaryEnum.NONE, MoveTypeEnum.PLAYER, ShotTypeEnum.PLAYER, []),
    ASTEROID_S: new UnitType(1, 0, ShapeEnum.ASTEROID_S, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, []),
    ASTEROID_M: new UnitType(1, 0, ShapeEnum.ASTEROID_M, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, []),
    ASTEROID_L: new UnitType(1, 0, ShapeEnum.ASTEROID_L, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, []),
};

const EnvironmentTypeEnum = {
    CLOUD: new EnvironmentType(ShapeEnum.CLOUD, BoundaryEnum.CLOUD, MoveTypeEnum.CLOUD)
};

const AudioPoolEnum = {
    PLAYER_SHOT: new AudioPool("audio/player_shot.wav", 5),
};

//endregion

//region GameObjects
type HitCallback = (other: GameObject) => any;
type DestroyedCallback = (cause: DeathCauseEnum) => any;

abstract class GameObject {
    public rotation: number = 0;
    public move: Move = null;

    protected speed: number = 0;

    protected constructor(public id: number, public type: GameObjectType, public x: number, public y: number, public rot: number, public onDestroyed: DestroyedCallback) {
        this.move = type.move.copy().setRotation(rot);
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false) {
        let move = this.move.move(elapsedTime);
        let old = Vector.from(this.x, this.y);
        if (this.type.boundary.isInBounds(this.x + move.x, this.y + move.y, this.type.shape)) {
            this.x += move.x;
            this.y += move.y;
            if (this.type.boundary instanceof NoBoundary) {
                this.warpToOtherSide(old);
            }
        } else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(DeathCauseEnum.OUT_OF_BOUNDS);
        }
    }

    protected warpToOtherSide(old: Vector) {
        if (this.x > WIDTH && !(old.x > WIDTH))
            this.x = -this.getWidth();
        else if (this.x - this.getWidth() < 0 && !(old.x - this.getWidth() < 0))
            this.x = WIDTH;
        if (this.y > HEIGHT && !(old.y > HEIGHT))
            this.y = -this.getHeight();
        else if (this.y - this.getHeight() < 0 && !(old.y - this.getHeight() < 0))
            this.y = HEIGHT;
    }

    isCollidingWith(other: GameObject): boolean {
        //TODO
        return false;
    }

    public render(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.x + 0.5 * this.getWidth(), this.y + 0.5 * player.getHeight());
        context.rotate(rad(this.rotation));
        context.translate(-0.5 * this.getWidth(), -0.5 * this.getHeight());
        this.type.shape.render(context);
        context.restore();
    }

    //region Helper Methods
    public getWidth(): number {
        return this.type.shape.getWidth()
    }

    public getHeight(): number {
        return this.type.shape.getHeight();
    }

    public getColor(): string {
        return this.type.shape.color;
    }

    //endregion
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

    constructor(id: number, public type: UnitType, x: number, y: number, rot: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, rot, onDestroyed);
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
        let shot = new Shot(id, this.type, this.type.shot, this.x + this.getWidth() / 2, this.y + this.getHeight() / 2, this.rotation, (cause: DeathCauseEnum) => {
            shots.delete(id);
        });
        this.moveVector.add(Vector.construct(KNOCK_BACK, this.rotation).scale(-1));
        this.speed = Math.min(MAX_SPEED, this.speed + (KNOCK_BACK));
        shots.set(id, shot);
        shotIdCounter++;
        AudioPoolEnum.PLAYER_SHOT.play();
        return shot;
    }
}

class Player extends Unit {
    constructor(id: number, public type: UnitType, x: number, y: number, rot: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, rot, onDestroyed);
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false): void {
        this.rotation = mod(this.rotation + rotation * ROTATION_SPEED * elapsedTime, 360);
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

        let old = Vector.from(this.x, this.y);
        this.x += this.moveVector.x;
        this.y += this.moveVector.y;
        this.warpToOtherSide(old);
    }
}

class Shot extends GameObject {
    constructor(id: number, public initiator: UnitType, public type: ShotType, x: number, y: number, rot: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, rot, onDestroyed);
    }

    isCollidingWith(other: GameObject): boolean {
        return super.isCollidingWith(other) && this.initiator !== other.type;
    }
}

class Environment extends GameObject {
    constructor(id: number, type: EnvironmentType, x: number, y: number, rot: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, rot, onDestroyed);
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

var player = new Player(0, UnitTypeEnum.PLAYER, 0, 0, 0, () => {
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

function createEnemy(elapsedTime: number) {
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
            enemies.set(id, new Unit(id, type, Math.random() * (WIDTH - type.shape.getWidth()), -type.shape.getHeight(), Math.random() * 360, function (cause: DeathCauseEnum) {
                if (cause == DeathCauseEnum.LIVES) {
                    this.type.bounties.forEach(bounty => bounty(this, null, HitTypeEnum.DESTROYED));
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
            environments.set(id, new Environment(id, EnvironmentTypeEnum.CLOUD, Math.random() * WIDTH, -EnvironmentTypeEnum.CLOUD.shape.getHeight(), 0, function (cause: DeathCauseEnum) {
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
                shot.onDestroyed(DeathCauseEnum.COLLISION);
            }
        })
    });
    environments.forEach(value => value.update(elapsedTime));
}

function render(elapsedTime: number) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);

    environments.forEach(value => value.render(backContext));

    player.render(backContext);

    enemies.forEach(value => value.render(backContext));

    shots.forEach(value => value.render(backContext));
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


