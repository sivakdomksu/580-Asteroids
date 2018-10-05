"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static from(x, y /*, modX: number, modY: number*/) {
        return new Vector(x, y /*, modX, modY*/);
    }
    static fromOther(other) {
        return new Vector(other.x, other.y /*, other.modX, other.modY*/);
    }
    static zero( /*modX: number, modY: number*/) {
        return new Vector(0, 0 /*, modX, modY*/);
    }
    static construct(magnitude, angle) {
        return new Vector(magnitude * Math.cos(rad(angle)), magnitude * Math.sin(rad(angle))).rotate(-90);
    }
    isZero() {
        return this.x == 0 && this.y == 0;
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    static add(a, b) {
        return Vector.fromOther(a).add(b);
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    static rotate(vector, angle) {
        return Vector.fromOther(vector).rotate(angle);
    }
    rotate(angle) {
        let oldX = this.x;
        this.x = this.x * Math.cos(rad(angle)) - this.y * Math.sin(rad(angle));
        this.y = oldX * Math.sin(rad(angle)) + this.y * Math.cos(rad(angle));
        return this;
    }
    static scale(vector, scalar) {
        return Vector.fromOther(vector).scale(scalar);
    }
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    static normalize(vector) {
        return Vector.fromOther(vector).normalize();
    }
    normalize() {
        return this.magnitude() === 0 ? this : this.scale(1 / this.magnitude());
    }
    static perpendicular(vector) {
        return Vector.fromOther(vector).perpendicular();
    }
    perpendicular() {
        let oldX = this.x;
        this.x = -this.y;
        this.y = oldX;
        return this;
    }
    static dotProduct(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    dotProduct(other) {
        return Vector.dotProduct(this, other);
    }
}
exports.default = Vector;
function mod(n, m) {
    return ((n % m) + m) % m;
}
exports.mod = mod;
function rad(n) {
    return n * (Math.PI / 180);
}
exports.rad = rad;
function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
exports.clamp = clamp;
//# sourceMappingURL=vector.js.map