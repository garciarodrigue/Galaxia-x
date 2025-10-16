class OrbitalMechanics {
    // 1. Leyes de Kepler y mecánica orbital
    static calculateOrbitalPeriod(centralMass, semiMajorAxis) {
        // T² ∝ a³ (Ley de Kepler)
        const T2 = (4 * Math.PI * Math.PI * Math.pow(semiMajorAxis * PhysicalConstants.AU, 3)) / 
                   (PhysicalConstants.G * centralMass * PhysicalConstants.SOLAR_MASS);
        return Math.sqrt(T2) / PhysicalConstants.YEAR_SECONDS; // En años
    }

    static calculateOrbitalVelocity(centralMass, distance) {
        // v = √(GM/r)
        const r = distance * PhysicalConstants.AU;
        const M = centralMass * PhysicalConstants.SOLAR_MASS;
        return Math.sqrt(PhysicalConstants.G * M / r) / 1000; // km/s
    }

    // 2. Cálculo de posición orbital (aproximación elíptica)
    static calculateOrbitalPosition(time, semiMajorAxis, eccentricity, inclination, longitudeAscendingNode, argumentPeriapsis, meanAnomalyEpoch) {
        // Calcular anomalía media
        const period = this.calculateOrbitalPeriod(1, semiMajorAxis); // Asumiendo masa solar=1
        const meanAnomaly = meanAnomalyEpoch + (2 * Math.PI * time) / period;
        
        // Resolver ecuación de Kepler para anomalía excéntrica
        let eccentricAnomaly = meanAnomaly;
        for (let i = 0; i < 10; i++) {
            eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
        }
        
        // Calcular anomalía verdadera
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
        );
        
        // Coordenadas en el plano orbital
        const distance = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
        const xOrbital = distance * Math.cos(trueAnomaly);
        const yOrbital = distance * Math.sin(trueAnomaly);
        
        // Transformar a coordenadas 3D
        const cosLAN = Math.cos(longitudeAscendingNode);
        const sinLAN = Math.sin(longitudeAscendingNode);
        const cosAP = Math.cos(argumentPeriapsis);
        const sinAP = Math.sin(argumentPeriapsis);
        const cosI = Math.cos(inclination);
        const sinI = Math.sin(inclination);
        
        const x = xOrbital * (cosAP * cosLAN - sinAP * cosI * sinLAN) - 
                  yOrbital * (sinAP * cosLAN + cosAP * cosI * sinLAN);
        const y = xOrbital * (cosAP * sinLAN + sinAP * cosI * cosLAN) + 
                  yOrbital * (cosAP * cosI * cosLAN - sinAP * sinLAN);
        const z = xOrbital * (sinAP * sinI) + yOrbital * (cosAP * sinI);
        
        return { x, y, z, distance };
    }

    // 3. Estabilidad orbital con múltiples cuerpos
    static calculateHillSphere(planetMass, starMass, distance) {
        // Radio de la esfera de Hill
        return distance * Math.pow(planetMass / (3 * starMass), 1/3);
    }

    static isOrbitStable(planet, star, otherPlanets) {
        const hillRadius = this.calculateHillSphere(planet.mass, star.mass, planet.orbit.semiMajorAxis);
        
        for (const otherPlanet of otherPlanets) {
            if (otherPlanet.id === planet.id) continue;
            
            const distance = Math.abs(planet.orbit.semiMajorAxis - otherPlanet.orbit.semiMajorAxis);
            if (distance < 3.5 * hillRadius) {
                return false; // Órbita inestable por perturbaciones
            }
        }
        
        return true;
    }

    // 4. Resonancias orbitales
    static findOrbitalResonances(planets) {
        const resonances = [];
        
        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const ratio = planets[i].orbitalPeriod / planets[j].orbitalPeriod;
                const tolerance = 0.02; // 2% de tolerancia
                
                // Buscar resonancias comunes
                const commonResonances = [
                    [2, 1], [3, 2], [3, 1], [4, 3], [5, 4], [5, 2]
                ];
                
                for (const [p, q] of commonResonances) {
                    if (Math.abs(ratio - p/q) < tolerance) {
                        resonances.push({
                            planets: [planets[i].id, planets[j].id],
                            resonance: `${p}:${q}`,
                            exactRatio: ratio,
                            strength: 1 - (Math.abs(ratio - p/q) / tolerance)
                        });
                    }
                }
            }
        }
        
        return resonances;
    }
}
