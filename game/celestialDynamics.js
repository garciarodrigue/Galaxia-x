class CelestialDynamics {
    // 1. Generación de cometas
    static generateComet(starSystem) {
        const semiMajorAxis = 30 + Math.random() * 970; // 30-1000 AU
        const eccentricity = 0.7 + Math.random() * 0.29; // 0.7-0.99
        
        return {
            id: `comet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'comet',
            name: `C/${new Date().getFullYear()} ${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
            orbit: {
                semiMajorAxis: semiMajorAxis,
                eccentricity: eccentricity,
                inclination: Math.random() * 180, // 0-180 grados
                period: OrbitalMechanics.calculateOrbitalPeriod(starSystem.primaryStar.mass, semiMajorAxis)
            },
            size: 100 + Math.random() * 4900, // 0.1-5 km
            composition: {
                ice: 0.6 + Math.random() * 0.3,
                dust: 0.2 + Math.random() * 0.2,
                organic: Math.random() * 0.1
            },
            discovered: false,
            threatLevel: this.calculateThreatLevel(semiMajorAxis, eccentricity)
        };
    }

    // 2. Simulación de trayectorias
    static simulateOrbitalMotion(objects, timeStep) {
        const newPositions = [];
        
        objects.forEach(obj => {
            if (obj.orbit) {
                const position = OrbitalMechanics.calculateOrbitalPosition(
                    Date.now() / 1000, // tiempo actual en segundos
                    obj.orbit.semiMajorAxis,
                    obj.orbit.eccentricity,
                    obj.orbit.inclination * Math.PI / 180, // a radianes
                    0, 0, 0 // simplificado por ahora
                );
                
                newPositions.push({
                    id: obj.id,
                    position: position,
                    distance: position.distance
                });
            }
        });
        
        return newPositions;
    }

    // 3. Detección de colisiones
    static checkCollisions(positions, planets) {
        const collisions = [];
        
        positions.forEach(obj => {
            planets.forEach(planet => {
                const distance = Math.sqrt(
                    Math.pow(obj.position.x - planet.position.x, 2) +
                    Math.pow(obj.position.y - planet.position.y, 2)
                );
                
                // Radio de influencia gravitacional
                const influenceRadius = planet.radius * 0.1; // 10% del radio planetario
                
                if (distance < influenceRadius) {
                    collisions.push({
                        objectId: obj.id,
                        planetId: planet.id,
                        distance: distance,
                        energy: this.calculateImpactEnergy(obj, planet),
                        timestamp: Date.now()
                    });
                }
            });
        });
        
        return collisions;
    }

    // 4. Energía de impacto
    static calculateImpactEnergy(impactor, planet) {
        const velocity = 20 + Math.random() * 50; // km/s
        const density = 1000; // kg/m³ promedio para cometas
        const volume = (4/3) * Math.PI * Math.pow(impactor.size * 500, 3); // m³
        const mass = density * volume; // kg
        const energy = 0.5 * mass * Math.pow(velocity * 1000, 2); // joules
        
        // Convertir a megatones de TNT
        return energy / 4.184e15;
    }

    // 5. Nivel de amenaza
    static calculateThreatLevel(semiMajorAxis, eccentricity) {
        // Cometas con perihelio interior y alta excentricidad son más peligrosos
        const perihelion = semiMajorAxis * (1 - eccentricity);
        let threat = 0;
        
        if (perihelion < 1.0) threat += 0.6; // Cruza órbita terrestre
        if (perihelion < 0.5) threat += 0.3; // Muy cercano al sol
        if (eccentricity > 0.9) threat += 0.1; // Órbita muy excéntrica
        
        return Math.min(1, threat);
    }
}
