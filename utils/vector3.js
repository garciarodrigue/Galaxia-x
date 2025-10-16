class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Operaciones básicas
    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    divide(scalar) {
        return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    // Producto punto
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    // Producto cruz
    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    // Magnitud
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // Normalizar
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector3();
        return this.divide(mag);
    }

    // Distancia a otro vector
    distanceTo(v) {
        return this.subtract(v).magnitude();
    }

    // Rotación alrededor de eje
    rotate(axis, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const oneMinusCos = 1 - cos;
        
        const rotationMatrix = [
            cos + axis.x * axis.x * oneMinusCos,
            axis.x * axis.y * oneMinusCos - axis.z * sin,
            axis.x * axis.z * oneMinusCos + axis.y * sin,
            
            axis.y * axis.x * oneMinusCos + axis.z * sin,
            cos + axis.y * axis.y * oneMinusCos,
            axis.y * axis.z * oneMinusCos - axis.x * sin,
            
            axis.z * axis.x * oneMinusCos - axis.y * sin,
            axis.z * axis.y * oneMinusCos + axis.x * sin,
            cos + axis.z * axis.z * oneMinusCos
        ];
        
        return new Vector3(
            this.x * rotationMatrix[0] + this.y * rotationMatrix[1] + this.z * rotationMatrix[2],
            this.x * rotationMatrix[3] + this.y * rotationMatrix[4] + this.z * rotationMatrix[5],
            this.x * rotationMatrix[6] + this.y * rotationMatrix[7] + this.z * rotationMatrix[8]
        );
    }

    // Clonar
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    // Representación string
    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`;
    }
}
