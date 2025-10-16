class ClimateModel {
    // 1. Temperatura de equilibrio planetario
    static calculateEquilibriumTemperature(star, planet, atmosphere) {
        const solarConstant = star.luminosity * PhysicalConstants.SOLAR_LUMINOSITY / 
                            (4 * Math.PI * Math.pow(planet.orbit.semiMajorAxis * PhysicalConstants.AU, 2));
        
        const albedo = atmosphere.albedo || 0.3;
        const absorbedRadiation = solarConstant * (1 - albedo) / 4;
        
        // Ley de Stefan-Boltzmann
        const effectiveTemperature = Math.pow(absorbedRadiation / PhysicalConstants.SIGMA, 0.25);
        
        // Efecto invernadero
        const greenhouseEffect = this.calculateGreenhouseEffect(atmosphere);
        const surfaceTemperature = effectiveTemperature + greenhouseEffect;
        
        return {
            effective: effectiveTemperature - 273.15, // °C
            surface: surfaceTemperature - 273.15,      // °C
            greenhouse: greenhouseEffect,
            albedo: albedo
        };
    }

    // 2. Efecto invernadero detallado
    static calculateGreenhouseEffect(atmosphere) {
        let greenhouseForcing = 0;
        
        const greenhouseGases = {
            'CO2': { forcing: 5.35, concentration: atmosphere.composition?.CO2 || 0.0004 },
            'CH4': { forcing: 0.5, concentration: atmosphere.composition?.CH4 || 0.0000018 },
            'N2O': { forcing: 0.15, concentration: atmosphere.composition?.N2O || 0.00000032 },
            'H2O': { forcing: 2.0, concentration: atmosphere.composition?.H2O || 0.01 }
        };
        
        Object.values(greenhouseGases).forEach(gas => {
            if (gas.concentration > 0) {
                // Forzamiento radiativo aproximado
                greenhouseForcing += gas.forcing * Math.log(gas.concentration / 0.00028);
            }
        });
        
        // Conversión a °C (sensibilidad climática ~0.8 °C por W/m²)
        return greenhouseForcing * 0.8;
    }

    // 3. Zona habitable del sistema
    static calculateHabitableZone(star) {
        const innerEdge = 0.95 * Math.sqrt(star.luminosity);
        const outerEdge = 1.37 * Math.sqrt(star.luminosity);
        
        return {
            inner: innerEdge,
            outer: outerEdge,
            width: outerEdge - innerEdge
        };
    }

    // 4. Presión atmosférica basada en gravedad y composición
    static calculateSurfacePressure(planet, atmosphere) {
        const surfaceGravity = (PhysicalConstants.G * planet.mass * PhysicalConstants.EARTH_MASS) / 
                             Math.pow(planet.radius * PhysicalConstants.EARTH_RADIUS, 2);
        
        // Presión basada en masa atmosférica y gravedad
        const atmosphericMass = atmosphere.mass || 1.0; // En masas terrestres atmosféricas
        return atmosphericMass * surfaceGravity * 101.325; // kPa
    }
}
