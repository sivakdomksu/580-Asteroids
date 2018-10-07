import Vector, {clamp, mod, rad} from "./vector";

const WIDTH = 1366;
const HEIGHT = 768;
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

//region GameObject parts
type BountyCallback = (enemy: Unit, shot: Shot, type: HitTypeEnum) => any;
type LevelScale = (level: number) => number;
type SpeedStruct = { curr: number, dec: number, acc: number }
type Endpoint = { value: number, isMax: boolean, object: GameObject }
type CollisionPair = { a: GameObject, b: Unit }
type CollisionResult = { a: Vector, b: Vector }

enum DeathCauseEnum {
    OUT_OF_BOUNDS,
    LIVES,
    COLLISION
}

enum HitTypeEnum {
    HIT,
    DESTROYED
}

enum Role {
    PLAYER,
    ENEMY
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

    public abstract isCollidingWithRectangle(pos: Vector, other: Rectangle, otherPos: Vector): boolean;

    public abstract isCollidingWithCircle(pos: Vector, other: Circle, otherPos: Vector): boolean;

    public isCollidingWith(pos: Vector, other: Shape, otherPos: Vector): boolean {
        if (other instanceof Rectangle) {
            return this.isCollidingWithRectangle(pos, other, otherPos);
        } else if (other instanceof Circle) {
            return this.isCollidingWithCircle(pos, other, otherPos);
        } else {
            throw new Error("Unknown shape type: " + other);
        }
    }


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

    public isCollidingWithCircle(pos: Vector, other: Circle, otherPos: Vector): boolean {
        return other.isCollidingWithRectangle(otherPos, this, pos);
    }

    public isCollidingWithRectangle(pos: Vector, other: Rectangle, otherPos: Vector): boolean {
        return pos.x < otherPos.x + other.getWidth() &&
            pos.x + this.getWidth() > otherPos.x &&
            pos.y < otherPos.y + other.getHeight() &&
            pos.y + this.getHeight() > otherPos.y;
    }
}

class CharRectangle extends Rectangle {
    constructor(width: number, height: number, color: string, mass: number, private readonly char: string) {
        super(width, height, color, mass);
        this.char = this.char.charAt(0);
    }

    render(context: CanvasRenderingContext2D): void {
        super.render(context);
        context.font = "20px Arial";
        context.fillStyle = "#ffffff";
        let txtWidth = context.measureText(this.char).width;
        context.fillText(this.char, 0.5 * this.width - 0.5 * txtWidth, 0.5 * this.height + 0.5 * 20);
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
        context.strokeStyle = "#fff";
        context.strokeRect(0, 0, 2 * this.radius, 2 * this.radius);
        context.beginPath();
        context.arc(this.radius, this.radius, this.radius, 0, 2 * Math.PI);
        context.fill();
    }

    public isCollidingWithRectangle(pos: Vector, other: Rectangle, otherPos: Vector): boolean {
        let closestX = clamp(this.center(pos.x), otherPos.x, otherPos.x + other.getWidth());
        let closestY = clamp(this.center(pos.y), otherPos.y, otherPos.y + other.getHeight());

        let distanceX = this.center(pos.x) - closestX;
        let distanceY = this.center(pos.y) - closestY;

        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (this.radius * this.radius);
    }

    public isCollidingWithCircle(pos: Vector, other: Circle, otherPos: Vector): boolean {
        return Math.pow(this.center(otherPos.x) - this.center(pos.x), 2)
            + Math.pow(this.center(pos.y) - this.center(otherPos.y), 2)
            < Math.pow(this.radius + other.radius, 2);
    }

    private center(n: number): number {
        return n + this.radius;
    }
}

abstract class GameObjectType {
    protected constructor(public shape: Shape, public boundary: Boundary, public move: Move) {

    }
}

class UnitType extends GameObjectType {
    public morph: UnitType;

    constructor(public role: Role, public lives: number, public shotFreq: number, shape: Shape, boundary: Boundary, move: Move, public shot: ShotType, public bounties: BountyCallback[]) {
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

    abstract getVector(): Vector;
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


    getVector(): Vector {
        return this.vector;
    }
}

class DynamicMove extends Move {
    private lastVector: Vector = Vector.zero();

    constructor(private decSpeed: number) {
        super();
    }

    move(elapsedTime: number, rotation: number, speed: SpeedStruct, moveVector: Vector): Vector {
        let vector = Vector.fromOther(moveVector);
        vector.scale(speed.dec === 0 ? 1 : speed.curr / (speed.curr + speed.dec));
        if (speed.acc > 0) {
            vector.add(Vector.construct(speed.acc, rotation));
        }
        this.lastVector = Vector.fromOther(vector).scale(1 / elapsedTime);
        return vector;
    }


    copy(): Move {
        return new DynamicMove(this.decSpeed);
    }

    setRotation(rotation: number): Move {
        return this;
    }


    getVector(): Vector {
        return this.lastVector;
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
            console.error("Audio Pool is not big enough!", this.url);
            return;
        }
        audio.load();
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
    PLAYER: new UnitType(Role.PLAYER, 3, 0, ShapeEnum.PLAYER, BoundaryEnum.NONE, MoveTypeEnum.PLAYER, ShotTypeEnum.PLAYER, []),
    ASTEROID_S: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_S, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.PLAYER, []),
    ASTEROID_M: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_M, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, []),
    ASTEROID_L: new UnitType(Role.ENEMY, 1, 0, ShapeEnum.ASTEROID_L, BoundaryEnum.NONE, MoveTypeEnum.ENEMY_SIMPLE, ShotTypeEnum.ENEMY, []),
};

const EnvironmentTypeEnum = {
    CLOUD: new EnvironmentType(ShapeEnum.CLOUD, BoundaryEnum.CLOUD, MoveTypeEnum.CLOUD)
};

const AudioPoolEnum = {
    PLAYER_SHOT: new AudioPool("audio/Shot.wav", 5),
    COLLISION: new AudioPool("audio/Collision.wav", 10)
};

//endregion

//region GameObjects
type HitCallback = (other: GameObject) => any;
type DestroyedCallback = (object: GameObject, cause: DeathCauseEnum) => any;

abstract class GameObject {
    public rotation: number = 0;
    public move: Move = null;
    public moveVector: Vector = Vector.zero();

    protected speed: number = 0;

    protected constructor(public id: number, public type: GameObjectType, public x: number, public y: number, public rot: number, public onDestroyed: DestroyedCallback) {
        this.move = type.move.copy().setRotation(rot);
    }

    update(elapsedTime: number, rotation: number = 0, movement: boolean = false) {
        this.moveVector = this.move.move(elapsedTime);
        let old = Vector.from(this.x, this.y);
        if (this.type.boundary.isInBounds(this.x + this.moveVector.x, this.y + this.moveVector.y, this.type.shape)) {
            this.x += this.moveVector.x;
            this.y += this.moveVector.y;
            if (this.type.boundary instanceof NoBoundary) {
                this.warpToOtherSide(old);
            }
        } else if (this.type != UnitTypeEnum.PLAYER) {
            this.onDestroyed(this, DeathCauseEnum.OUT_OF_BOUNDS);
        }
    }

    protected warpToOtherSide(old: Vector) {
        if (this.x > WIDTH && !(old.x > WIDTH))
            this.x = -this.getWidth();
        else if (this.x + this.getWidth() < 0 && !(old.x + this.getWidth() < 0))
            this.x = WIDTH;
        if (this.y > HEIGHT && !(old.y > HEIGHT))
            this.y = -this.getHeight();
        else if (this.y + this.getHeight() < 0 && !(old.y + this.getHeight() < 0))
            this.y = HEIGHT;
    }

    isCollidingWith(other: GameObject): boolean {
        return this.type.shape.isCollidingWith(Vector.from(this.x, this.y), other.type.shape, Vector.from(other.x, other.y));
    }

    public render(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.x + 0.5 * this.getWidth(), this.y + 0.5 * this.getHeight());
        context.rotate(rad(this.rotation));
        context.translate(-0.5 * this.getWidth(), -0.5 * this.getHeight());
        this.type.shape.render(context);
        context.restore();
    }

    public abstract onHit(other: GameObject);

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

    public getMass(): number {
        return this.type.shape.mass;
    }

    //endregion
}

class Unit extends GameObject {

    public onHit(other: GameObject) {
        if (/*this.type.role == Role.ENEMY && other instanceof Unit && other.type.role == Role.ENEMY*/true) {
            let collision = collide(this, other as Unit);
            this.moveVector = collision.a;
            other.moveVector = collision.b;
            this.move = new ConstantMove(collision.a);
            other.move = new ConstantMove(collision.b);
        }
        if (this.lives < 1) {
            if (this.type.morph) {
                morph(this);
            } else {
                this.onDestroyed(this, DeathCauseEnum.LIVES);
            }
        }
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
        let shot = new Shot(id, this.type, this.type.shot, this.x + this.getWidth() / 2, this.y + this.getHeight() / 2, this.rotation, (object, cause) => {
            shots.delete(object.id);
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

    public onHit(other: GameObject) {
        if (this.lives < 1) {
            this.onDestroyed(this, DeathCauseEnum.LIVES);
        }
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


    onHit(other: GameObject) {
        let o = other as Unit;
        if (this.initiator == o.type)
            return;
        o.type.bounties.forEach(bounty => {
            bounty(o, this, HitTypeEnum.HIT)
        });
        o.lives -= this.type.dmg;
        o.onHit(this);
        updateStatus(0);
        this.onDestroyed(this, DeathCauseEnum.COLLISION);
    }
}

class Environment extends GameObject {
    constructor(id: number, type: EnvironmentType, x: number, y: number, rot: number, onDestroyed: DestroyedCallback) {
        super(id, type, x, y, rot, onDestroyed);
    }


    onHit(other: GameObject) {
    }
}

class Level {
    private level: number = 0;
    private levelSpawns: number = 1;
    private passedSpawns: boolean = false;
    private currCooldown: number = 0;
    private state: number = 0;

    constructor(private levelScale: LevelScale, private enemyCounter: () => number, private cooldown: number) {
        this.reset();
    }

    /**
     * return true if enemies can be spawned, false otherwise.
     */
    public updateLevel(elapsedTime: number): boolean {
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

    public reset() {
        this.level++;
        this.levelSpawns = this.levelScale(this.level);
        this.passedSpawns = false;
        this.currCooldown = 0;
        this.state = 0;
    }

    public getLimit(): number {
        return this.levelSpawns;
    }

    public getLevel(): number {
        return this.level;
    }

    private checkAllSpawned() {
        if (this.enemyCounter() >= this.levelSpawns)
            this.state = 1;
    }

    private checkAllDestroyed() {
        if (this.enemyCounter() == 0)
            this.state = 2;
    }

    private checkCooldown(elapsedTime: number) {
        if (this.currCooldown > this.cooldown) {
            this.raiseLevel();
        } else {
            this.currCooldown += elapsedTime;
        }
    }

    private raiseLevel() {
        this.reset();
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
var levelElement = document.getElementById("level_text");

var enemyTimeToSpawn = 0;
var enemyIdCounter = 0;
var shotIdCounter = 0;
var environmentIdCounter = 0;
var enemies = new Map<number, Unit>();
var shots = new Map<number, Shot>();
var environments = new Map<number, Environment>();
var running: boolean = true;
let spawnCooldown: boolean = true;
let level: Level = new Level(lvl => ENEMY_SCALING * lvl, () => enemies.size, LVL_COOLDOWN);

UnitTypeEnum.ASTEROID_M.morph = UnitTypeEnum.ASTEROID_S;
UnitTypeEnum.ASTEROID_L.morph = UnitTypeEnum.ASTEROID_M;

function loop(timestamp) {
    if (!running)
        return;
    updateStatus(0, 0, level.getLevel());
    if (!start) start = timestamp;
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
            enemies.set(id, new Unit(id, type, Math.random() * (WIDTH - type.shape.getWidth()), -type.shape.getHeight(), Math.random() * 360, (object, cause) => {
                if (cause == DeathCauseEnum.LIVES) {
                    (object as Unit).type.bounties.forEach(bounty => bounty(object as Unit, null, HitTypeEnum.DESTROYED));
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

function collide(a: Unit, b: Unit): CollisionResult {
    //http://www.vobarian.com/collisions/2dcollisions2.pdf
    let un = Vector.from((b.x + 0.5 * b.getWidth()) - (a.x + 0.5 * a.getWidth()), (b.y + 0.5 * b.getHeight()) - (a.y + 0.5 * a.getHeight())).normalize();
    let ut = Vector.perpendicular(un);
    let v1n = Vector.dotProduct(un, a.move.getVector());
    let v1t = Vector.dotProduct(ut, a.move.getVector());
    let v2n = Vector.dotProduct(un, b.move.getVector());
    let v2t = Vector.dotProduct(ut, b.move.getVector());
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
        a: Vector.fromOther(un).scale(v_1n).add(Vector.fromOther(ut).scale(v_1t)),
        b: Vector.fromOther(un).scale(v_2n).add(Vector.fromOther(ut).scale(v_2t))
    };
}

function morph(unit: Unit) {
    let id = enemyIdCounter++;
    let copy = new Unit(id, unit.type.morph, unit.x, unit.y, 0, (object, cause) => {
        if (cause == DeathCauseEnum.LIVES) {
            (object as Unit).type.bounties.forEach(bounty => bounty(object as Unit, null, HitTypeEnum.DESTROYED));
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

function update(elapsedTime: number) {
    if (currentInput.space && !priorInput.space) {
        player.shoot();
    }
    player.update(elapsedTime, currentInput.left ? -1 : (currentInput.right ? 1 : 0), currentInput.up);

    enemies.forEach(value => value.update(elapsedTime));
    shots.forEach(value => value.update(elapsedTime));

    let collisionPairs: CollisionPair[] = [];

    shots.forEach(shot => {
        collisionPairs.push({a: shot, b: player});
        enemies.forEach(enemy => {
            collisionPairs.push({a: shot, b: enemy});
        })
    });
    let enemyList: Unit[] = [];
    enemies.forEach((value) => enemyList.push(value));
    for (let i = 0; i < enemyList.length; i++) {
        collisionPairs.push({a: player, b: enemyList[i]});
        for (let j = i + 1; j < enemyList.length; j++) {
            collisionPairs.push({a: enemyList[i], b: enemyList[j]});
        }
    }

    environments.forEach(value => value.update(elapsedTime));

    checkCollisions(collisionPairs);
}

function checkCollisions(pairs: CollisionPair[]) {
    pairs.forEach(value => {
        if (value.a.isCollidingWith(value.b)) {
            value.a.onHit(value.b);
        }
    });
}

function render(elapsedTime: number) {
    backContext.clearRect(0, 0, WIDTH, HEIGHT);

    environments.forEach(value => value.render(backContext));

    player.render(backContext);

    enemies.forEach(value => value.render(backContext));

    shots.forEach(value => value.render(backContext));
}

function updateStatus(scoreDelta: number, healthDelta: number = 0, level: number = null) {
    score += scoreDelta;
    player.lives += healthDelta;
    scoreElement.innerText = "" + score;
    livesElement.innerText = "" + player.lives;
    if (level !== null) {
        levelElement.innerText = "" + level;
    }
}

function endGame() {
    running = false;
    alert("Game over!");
}

window.requestAnimationFrame(loop);


