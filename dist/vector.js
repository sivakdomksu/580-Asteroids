"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.from = function (x, y /*, modX: number, modY: number*/) {
        return new Vector(x, y /*, modX, modY*/);
    };
    Vector.fromOther = function (other) {
        return new Vector(other.x, other.y /*, other.modX, other.modY*/);
    };
    Vector.zero = function ( /*modX: number, modY: number*/) {
        return new Vector(0, 0 /*, modX, modY*/);
    };
    Vector.construct = function (magnitude, angle) {
        return new Vector(magnitude * Math.cos(rad(90 - angle)), magnitude * Math.cos(rad(angle)));
    };
    Vector.prototype.isZero = function () {
        return this.x == 0 && this.y == 0;
    };
    Vector.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.add = function (a, b) {
        return Vector.fromOther(a).add(b);
    };
    Vector.prototype.add = function (other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    };
    Vector.rotate = function (vector, angle) {
        return Vector.fromOther(vector).rotate(angle);
    };
    Vector.prototype.rotate = function (angle) {
        var oldX = this.x;
        this.x = this.x * Math.cos(rad(angle)) - this.y * Math.sin(rad(angle));
        this.y = oldX * Math.sin(rad(angle)) + this.y * Math.cos(rad(angle));
        return this;
    };
    Vector.scale = function (vector, scalar) {
        return Vector.fromOther(vector).scale(scalar);
    };
    Vector.prototype.scale = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    };
    Vector.normalize = function (vector) {
        return Vector.fromOther(vector).normalize();
    };
    Vector.prototype.normalize = function () {
        return this.magnitude() === 0 ? this : this.scale(1 / this.magnitude());
    };
    return Vector;
}());
exports.default = Vector;
function mod(n, m) {
    return ((n % m) + m) % m;
}
exports.mod = mod;
function rad(n) {
    return n * (Math.PI / 180);
}
exports.rad = rad;
//# sourceMappingURL=vector.js.map