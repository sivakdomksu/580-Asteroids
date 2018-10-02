export default class Vector {
    private constructor(public x: number, public y: number) {
    }

    public static from(x: number, y: number): Vector {
        return new Vector(x, y);
    }

    public static fromOther(other: Vector): Vector {
        return new Vector(other.x, other.y);
    }

    public static zero(): Vector {
        return new Vector(0, 0);
    }

    public isZero(): boolean {
        return this.x == 0 && this.y == 0;
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public static add(a: Vector, b: Vector): Vector {
        return Vector.from(a.x + b.x, a.y + b.y);
    }

    public add(other: Vector): Vector {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    public static rotate(vector: Vector, angle: number): Vector {
        return Vector.from(
            vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
            vector.x * Math.sin(angle) + vector.y * Math.cos(angle));
    }

    public rotate(angle: number): Vector {
        let oldX = this.x;
        this.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        this.y = oldX * Math.sin(angle) + this.y * Math.cos(angle);
        return this;
    }

    public static scale(vector: Vector, scalar: number): Vector {
        return Vector.from(vector.x * scalar, vector.y * scalar);
    }

    public scale(scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    public static normalize(vector: Vector): Vector {
        return Vector.scale(Vector.fromOther(vector), 1 / vector.magnitude());
    }

    public normalize(): Vector {
        return this.scale(1 / this.magnitude());
    }

}