// 📁 physics/stellarEvolution.js

class StellarEvolution {
    // 1. Tiempo de vida en secuencia principal
    static calculateMainSequenceLifetime(mass) {
        // t ∝ M^(-2.5) para estrellas de baja masa
        // t ∝ M^(-3.5) para estrellas masivas
        const solarLifetime = 1e10; // 10 billones de años para el Sol
        
        if (mass <= 0.43) {
            return solarLifetime * Math.pow(mass, -2.3);
        } else if (mass <= 1.0) {
            return solarLifetime * Math.pow(mass, -2.5);
        } else {
            return solarLifetime * Math.pow(mass, -3.5);
        }
    }

    // 2. Luminosidad estelar
    static calculateLuminosity(mass, age) {
        const mainSequenceLifetime = this.calculateMainSequenceLifetime(mass);
        
        if (age <= mainSequenceLifetime) {
            // En secuencia principal: L ∝ M^3.5
            return Math.pow(mass, 3.5);
        } else {
            // Fase de gigante - simplificado
            return Math.pow(mass, 3.5) * (1 + (age - mainSequenceLifetime) / 1e9);
        }
    }

    // 3. Temperatura efectiva
    static calculateTemperature(mass, luminosity) {
        // Ley de Stefan-Boltzmann: L = 4πR²σT⁴
        const radius = this.calculateRadius(mass, luminosity);
        const temperature = Math.pow(
            luminosity * PhysicalConstants.SOLAR_LUMINOSITY / 
            (4 * Math.PI * Math.pow(radius * PhysicalConstants.SOLAR_RADIUS, 2) * 
             PhysicalConstants.SIGMA), 
            0.25
        );
        
        return temperature;
    }

    // 4. Radio estelar
    static calculateRadius(mass, luminosity) {
        // Relación masa-radio aproximada
        if (mass < 1.0) {
            return Math.pow(mass, 0.8);
        } else {
            return Math.pow(mass, 0.57);
        }
    }

    // 5. Evolución de la zona habitable
    static calculateEvolvingHabitableZone(star, currentAge) {
        const currentLuminosity = this.calculateLuminosity(star.mass, currentAge);
        const futureLuminosity = this.calculateLuminosity(star.mass, currentAge + 1e9);
        
        return {
            current: {
                inner: 0.95 * Math.sqrt(currentLuminosity),
                outer: 1.37 * Math.sqrt(currentLuminosity)
            },
            future: {
                inner: 0.95 * Math.sqrt(futureLuminosity),
                outer: 1.37 * Math.sqrt(futureLuminosity)
            },
            hasMoved: Math.abs(futureLuminosity - currentLuminosity) > 0.1
        };
    }

    // 6. Tipo espectral basado en temperatura
    static getSpectralClass(temperature) {
        if (temperature >= 30000) return 'O';
        if (temperature >= 10000) return 'B';
        if (temperature >= 7500) return 'A';
        if (temperature >= 6000) return 'F';
        if (temperature >= 5200) return 'G';
        if (temperature >= 3700) return 'K';
        return 'M';
    }

    // 7. Color basado en tipo espectral
    static getStarColor(spectralClass) {
        const colors = {
            'O': '#9BB0FF', // Azul muy claro
            'B': '#AABFFF', // Azul claro
            'A': '#CAD7FF', // Blanco azulado
            'F': '#F8F7FF', // Blanco
            'G': '#FFF4EA', // Blanco amarillento
            'K': '#FFD2A1', // Naranja claro
            'M': '#FFCC6F'  // Naranja rojizo
        };
        return colors[spectralClass] || '#FFFFFF';
    }

    // 8. Masa mínima para fusión nuclear
    static getMinimumFusionMass() {
        return 0.08; // 0.08 masas solares (80 veces la masa de Júpiter)
    }

    // 9. Verificar si la estrella es estable
    static isStarStable(mass, age) {
        const lifetime = this.calculateMainSequenceLifetime(mass);
        return age <= lifetime;
    }

    // 10. Etapa evolutiva de la estrella
    static getEvolutionaryStage(mass, age) {
        const lifetime = this.calculateMainSequenceLifetime(mass);
        
        if (age < lifetime * 0.1) return 'joven';
        if (age < lifetime * 0.9) return 'secuencia_principal';
        if (age < lifetime * 1.1) return 'gigante';
        if (age < lifetime * 1.5) return 'supergigante';
        return 'remanente';
    }
}

// Para compatibilidad con el código existente
// Si algún código usa StellarEvolution como objeto en lugar de clase
window.StellarEvolution = StellarEvolution;
