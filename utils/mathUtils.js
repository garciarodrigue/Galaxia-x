class MathUtils {
    // 1. Mapeo de valores
    static map(value, fromMin, fromMax, toMin, toMax) {
        return toMin + (toMax - toMin) * ((value - fromMin) / (fromMax - fromMin));
    }

    // 2. Clamp de valores
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // 3. Interpolación lineal
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // 4. Ruido aleatorio con semilla
    static seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // 5. Distribución normal (campana de Gauss)
    static normalDistribution(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // 6. Generar número en rango con distribución normal
    static normalRange(min, max, mean = null, stdDev = null) {
        if (mean === null) mean = (min + max) / 2;
        if (stdDev === null) stdDev = (max - min) / 6;
        
        let value;
        do {
            value = this.normalDistribution(mean, stdDev);
        } while (value < min || value > max);
        
        return value;
    }

    // 7. Conversión de unidades
    static yearsToSeconds(years) {
        return years * 31557600;
    }

    static secondsToYears(seconds) {
        return seconds / 31557600;
    }

    // 8. Cálculo de distancia 2D
    static distance2D(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // 9. Cálculo de distancia 3D
    static distance3D(x1, y1, z1, x2, y2, z2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
    }
}
