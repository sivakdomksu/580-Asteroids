"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Vector = /** @class */ (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.from = function (x, y) {
        return new Vector(x, y);
    };
    Vector.fromOther = function (other) {
        return new Vector(other.x, other.y);
    };
    Vector.zero = function () {
        return new Vector(0, 0);
    };
    Vector.prototype.isZero = function () {
        return this.x == 0 && this.y == 0;
    };
    Vector.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.add = function (a, b) {
        return Vector.from(a.x + b.x, a.y + b.y);
    };
    Vector.prototype.add = function (other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    };
    Vector.rotate = function (vector, angle) {
        return Vector.from(vector.x * Math.cos(angle) - vector.y * Math.sin(angle), vector.x * Math.sin(angle) + vector.y * Math.cos(angle));
    };
    Vector.prototype.rotate = function (angle) {
        var oldX = this.x;
        this.x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        this.y = oldX * Math.sin(angle) + this.y * Math.cos(angle);
        return this;
    };
    Vector.scale = function (vector, scalar) {
        return Vector.from(vector.x * scalar, vector.y * scalar);
    };
    Vector.prototype.scale = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    };
    Vector.normalize = function (vector) {
        return Vector.scale(Vector.fromOther(vector), 1 / vector.magnitude());
    };
    Vector.prototype.normalize = function () {
        return this.scale(1 / this.magnitude());
    };
    return Vector;
}());
exports.default = Vector;
//# sourceMappingURL=vector.js.map