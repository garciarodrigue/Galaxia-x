class CivilizationEvolution {
    // 1. Tasa de evolución basada en recursos
    static calculateEvolutionRate(planet, timeYears = 100) {
        let baseRate = 0.01; // 1% por siglo base
        
        // Factores de recursos
        const resourceFactor = this.calculateResourceFactor(planet.resources);
        const environmentFactor = this.calculateEnvironmentFactor(planet.environment);
        const stabilityFactor = this.calculateStabilityFactor(planet);
        
        // Efecto de las lunas en la evolución
        const moonFactor = planet.moons && planet.moons.length > 0 ? 
                          1 + (planet.moons.length * 0.05) : 1;
        
        const evolutionRate = baseRate * resourceFactor * environmentFactor * stabilityFactor * moonFactor;
        
        return Math.max(0.001, Math.min(0.1, evolutionRate));
    }

    // 2. Factor de recursos
    static calculateResourceFactor(resources) {
        const factors = [];
        
        if (resources.metals) {
            const metalFactor = Math.min(1, resources.metals.current / resources.metals.initial);
            factors.push(metalFactor * 0.4);
        }
        
        if (resources.energy) {
            const energyFactor = Math.min(1, resources.energy.current / resources.energy.capacity);
            factors.push(energyFactor * 0.3);
        }
        
        if (resources.rareElements) {
            const rareFactor = Math.min(1, resources.rareElements.current / 10000);
            factors.push(rareFactor * 0.3);
        }
        
        return factors.reduce((sum, factor) => sum + factor, 0);
    }

    // 3. Factor ambiental
    static calculateEnvironmentFactor(environment) {
        let factor = 1.0;
        
        if (environment.habitability < 0.3) factor *= 0.3;
        else if (environment.habitability < 0.6) factor *= 0.7;
        else if (environment.habitability > 0.9) factor *= 1.2;
        
        if (environment.temperature && environment.temperature.stability < 0.5) {
            factor *= 0.8;
        }
        
        return factor;
    }

    // 4. Factor de estabilidad
    static calculateStabilityFactor(planet) {
        let stability = 1.0;
        
        // Inestabilidad orbital
        if (planet.orbit && planet.orbit.eccentricity > 0.2) {
            stability *= 0.9;
        }
        
        // Actividad geológica extrema
        if (planet.tectonicActivity === 'high') {
            stability *= 0.8;
        }
        
        // Presencia de lunas grandes (estabiliza eje)
        if (planet.moons) {
            const largeMoons = planet.moons.filter(moon => moon.mass > 0.01);
            stability *= 1 + (largeMoons.length * 0.1);
        }
        
        return Math.min(1.5, stability);
    }

    // 5. Verificación de necesidad de migración
    static checkMigrationNeeded(planet, currentYear) {
        const issues = [];
        const yearsToCheck = [100, 1000, 10000];
        
        yearsToCheck.forEach(years => {
            const futureState = this.projectFutureState(planet, years);
            
            if (futureState.resourceCrisis) {
                issues.push({
                    type: 'resource_depletion',
                    severity: futureState.resourceCrisis.severity,
                    resource: futureState.resourceCrisis.type,
                    yearsRemaining: years,
                    message: `${futureState.resourceCrisis.type} se agotará en ~${years} años`
                });
            }
            
            if (futureState.environmentalCollapse) {
                issues.push({
                    type: 'environmental_collapse',
                    severity: 'critical',
                    yearsRemaining: years,
                    message: `Habitabilidad crítica en ~${years} años`
                });
            }
        });
        
        return issues;
    }

    // 6. Proyección del estado futuro
    static projectFutureState(planet, years) {
        const projection = {
            resourceCrisis: null,
            environmentalCollapse: false
        };
        
        // Proyectar recursos
        if (planet.resources) {
            Object.keys(planet.resources).forEach(resourceType => {
                const resource = planet.resources[resourceType];
                if (resource.current && resource.depletionRate) {
                    const yearsRemaining = resource.current / resource.depletionRate;
                    if (yearsRemaining <= years) {
                        projection.resourceCrisis = {
                            type: resourceType,
                            severity: yearsRemaining <= 100 ? 'critical' : 
                                     yearsRemaining <= 1000 ? 'high' : 'medium',
                            yearsRemaining: Math.floor(yearsRemaining)
                        };
                    }
                }
            });
        }
        
        // Proyectar ambiente
        if (planet.environment && planet.environment.habitability) {
            const habitabilityDecline = years * 0.0001; // 0.01% por año
            if (planet.environment.habitability - habitabilityDecline < 0.3) {
                projection.environmentalCollapse = true;
            }
        }
        
        return projection;
    }
}
