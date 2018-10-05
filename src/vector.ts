export default class Vector {
    private constructor(public x: number, public y: number, /*private modX: number, private modY: number*/) {
    }

    public static from(x: number, y: number/*, modX: number, modY: number*/): Vector {
        return new Vector(x, y/*, modX, modY*/);
    }

    public static fromOther(other: Vector): Vector {
        return new Vector(other.x, other.y/*, other.modX, other.modY*/);
    }

    public static zero(/*modX: number, modY: number*/): Vector {
        return new Vector(0, 0/*, modX, modY*/);
    }

    public static construct(magnitude: number, angle: number): Vector {
        return new Vector(magnitude * Math.cos(rad(angle)), magnitude * Math.sin(rad(angle))).rotate(-90);
    }

    public isZero(): boolean {
        return this.x == 0 && this.y == 0;
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public static add(a: Vector, b: Vector): Vector {
        return Vector.fromOther(a).add(b);
    }

    public add(other: Vector): Vector {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    public static rotate(vector: Vector, angle: number): Vector {
        return Vector.fromOther(vector).rotate(angle);
    }

    public rotate(angle: number): Vector {
        let oldX = this.x;
        this.x = this.x * Math.cos(rad(angle)) - this.y * Math.sin(rad(angle));
        this.y = oldX * Math.sin(rad(angle)) + this.y * Math.cos(rad(angle));
        return this;
    }

    public static scale(vector: Vector, scalar: number): Vector {
        return Vector.fromOther(vector).scale(scalar);
    }

    public scale(scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    public static normalize(vector: Vector): Vector {
        return Vector.fromOther(vector).normalize();
    }

    public normalize(): Vector {
        return this.magnitude() === 0 ? this : this.scale(1 / this.magnitude());
    }

    public static perpendicular(vector: Vector): Vector {
        return Vector.fromOther(vector).perpendicular();
    }

    public perpendicular(): Vector {
        let oldX = this.x;
        this.x = -this.y;
        this.y = oldX;
        return this;
    }

    public static dotProduct(a: Vector, b: Vector): number {
        return a.x * b.x + a.y * b.y;
    }

    public dotProduct(other: Vector): number {
        return Vector.dotProduct(this, other);
    }

}

export function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export function rad(n: number): number {
    return n * (Math.PI / 180);
}

export function clamp(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
}