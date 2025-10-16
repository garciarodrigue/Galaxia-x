class GameEngine {
    constructor() {
        this.firebaseService = new FirebaseService();
        this.authService = new AuthService();
        this.galaxyRenderer = null;
        this.uiManager = null;
        
        this.currentUser = null;
        this.userSystems = [];
        this.gameState = {
            galacticYear: 2024,
            isPaused: false,
            simulationSpeed: 1
        };
        
        this.init();
    }

    // 1. Inicialización del juego
    async init() {
        console.log('Inicializando Galaxia X...');
        
        try {
            // Inicializar Firebase
            await this.firebaseService.initialize();
            this.currentUser = this.firebaseService.currentUser;
            
            // Inicializar renderizador
            this.galaxyRenderer = new GalaxyRenderer('galaxyCanvas');
            
            // Inicializar UI Manager
            this.uiManager = new UIManager(this);
            
            // Cargar sistemas del usuario
            await this.loadUserSystems();
            
            // Configurar listeners en tiempo real
            this.setupRealTimeListeners();
            
            // Ocultar pantalla de carga
            this.hideLoadingScreen();
            
            console.log('Juego inicializado correctamente');
            
        } catch (error) {
            console.error('Error inicializando el juego:', error);
            this.showError('Error al inicializar el juego: ' + error.message);
        }
    }

    // 2. Cargar sistemas del usuario
    async loadUserSystems() {
        if (!this.currentUser) return;
        
        try {
            this.userSystems = await this.firebaseService.getUserStarSystems();
            this.galaxyRenderer.updateSystems(this.userSystems);
            console.log(`Sistemas cargados: ${this.userSystems.length}`);
        } catch (error) {
            console.error('Error cargando sistemas:', error);
        }
    }

    // 3. Configurar listeners en tiempo real
    setupRealTimeListeners() {
        // Escuchar cambios en sistemas del usuario
        this.firebaseService.listenToUserSystems((systems) => {
            this.userSystems = systems;
            this.galaxyRenderer.updateSystems(systems);
            this.uiManager.updateSystemsList(systems);
        });
        
        // Escuchar cambios de autenticación
        this.authService.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            this.firebaseService.currentUser = user;
            
            if (user) {
                await this.loadUserSystems();
                this.uiManager.updateAuthState(true, user);
            } else {
                this.userSystems = [];
                this.galaxyRenderer.updateSystems([]);
                this.uiManager.updateAuthState(false);
            }
        });
    }

    // 4. Crear nuevo sistema estelar
    async createStarSystem(systemData) {
        if (!this.currentUser) {
            this.uiManager.showLoginPrompt();
            return;
        }

        try {
            // Validar datos del sistema
            if (!this.validateSystemData(systemData)) {
                throw new Error('Datos del sistema inválidos');
            }

            // Generar coordenadas si no se proporcionan
            if (!systemData.coordinates) {
                systemData.coordinates = this.generateRandomCoordinates();
            }

            // Crear sistema en Firebase
            const systemId = await this.firebaseService.createStarSystem(systemData);
            
            // Centrar vista en el nuevo sistema
            this.galaxyRenderer.centerOn(
                systemData.coordinates.x,
                systemData.coordinates.y
            );
            
            // Mostrar mensaje de éxito
            this.uiManager.showNotification(
                `Sistema "${systemData.name}" creado exitosamente!`,
                'success'
            );
            
            return systemId;
            
        } catch (error) {
            console.error('Error creando sistema:', error);
            this.uiManager.showNotification(
                `Error creando sistema: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    // 5. Validar datos del sistema
    validateSystemData(systemData) {
        const required = ['name', 'starType', 'starMass', 'planetsCount'];
        
        for (const field of required) {
            if (!systemData[field]) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        }
        
        if (systemData.planetsCount < 1 || systemData.planetsCount > 15) {
            throw new Error('El número de planetas debe estar entre 1 y 15');
        }
        
        if (systemData.starMass < 0.1 || systemData.starMass > 100) {
            throw new Error('La masa estelar debe estar entre 0.1 y 100 masas solares');
        }
        
        return true;
    }

    // 6. Generar coordenadas aleatorias
    generateRandomCoordinates() {
        const margin = 5000;
        const x = margin + Math.random() * (50000 - 2 * margin);
        const y = margin + Math.random() * (50000 - 2 * margin);
        
        return { x, y };
    }

    // 7. Avanzar tiempo de simulación
    async advanceTime(years = 100) {
        if (!this.currentUser) return;
        
        try {
            this.gameState.galacticYear += years;
            this.uiManager.updateGalacticYear(this.gameState.galacticYear);
            
            // Simular evolución de todos los sistemas
            for (const system of this.userSystems) {
                await this.simulateSystemEvolution(system, years);
            }
            
            this.uiManager.showNotification(
                `¡Tiempo avanzado ${years} años! Año galáctico: ${this.gameState.galacticYear}`,
                'info'
            );
            
        } catch (error) {
            console.error('Error avanzando tiempo:', error);
            this.uiManager.showNotification(
                `Error avanzando tiempo: ${error.message}`,
                'error'
            );
        }
    }

    // 8. Simular evolución del sistema
    async simulateSystemEvolution(system, years) {
        // Evolucionar cada planeta en el sistema
        for (const planet of system.celestialBodies.planets) {
            await this.evolvePlanet(planet, years, system);
        }
        
        // Actualizar sistema en Firebase
        await this.updateSystemInFirebase(system);
    }

    // 9. Evolucionar planeta
    async evolvePlanet(planet, years, system) {
        // Calcular tasa de evolución
        const evolutionRate = CivilizationEvolution.calculateEvolutionRate(planet, years);
        
        // Evolución de la civilización
        if (planet.civilization) {
            // Aumentar nivel Kardashev
            planet.civilization.kardashev.level += evolutionRate * years / 100;
            
            // Aumentar población
            const growthFactor = Math.pow(planet.civilization.growthRate, years);
            planet.civilization.population = Math.floor(planet.civilization.population * growthFactor);
            
            // Desarrollar tecnología
            Object.keys(planet.civilization.technology).forEach(tech => {
                planet.civilization.technology[tech] += evolutionRate * years / 50;
            });
            
            // Consumir recursos
            this.simulateResourceConsumption(planet, years);
            
            // Verificar crisis
            const crises = CivilizationEvolution.checkMigrationNeeded(planet, this.gameState.galacticYear);
            if (crises.length > 0) {
                this.handlePlanetaryCrises(planet, crises);
            }
        }
        
        // Evolución geológica y climática
        this.simulateEnvironmentalChanges(planet, years, system);
    }

    // 10. Simular consumo de recursos
    simulateResourceConsumption(planet, years) {
        if (!planet.resources) return;
        
        Object.keys(planet.resources).forEach(resourceType => {
            const resource = planet.resources[resourceType];
            if (resource.current && resource.depletionRate) {
                resource.current -= resource.depletionRate * years;
                resource.current = Math.max(0, resource.current);
                
                // Recalcular años restantes
                if (resource.depletionRate > 0) {
                    resource.yearsRemaining = Math.floor(resource.current / resource.depletionRate);
                }
            }
        });
    }

    // 11. Simular cambios ambientales
    simulateEnvironmentalChanges(planet, years, system) {
        if (!planet.conditions) return;
        
        // Cambios climáticos lentos
        const climateChange = years * 0.001; // 0.1°C por siglo
        planet.conditions.temperature.surface += climateChange;
        
        // Cambios en habitabilidad
        if (planet.conditions.habitability) {
            const habitabilityChange = this.calculateHabitabilityChange(planet, system, years);
            planet.conditions.habitability += habitabilityChange;
            planet.conditions.habitability = MathUtils.clamp(planet.conditions.habitability, 0, 1);
        }
    }

    // 12. Calcular cambio en habitabilidad
    calculateHabitabilityChange(planet, system, years) {
        let change = 0;
        
        // Efecto de la evolución estelar
        const star = system.physics.primaryStar;
        const futureLuminosity = StellarEvolution.calculateLuminosity(star.mass, star.age + years);
        const currentLuminosity = star.luminosity;
        
        if (futureLuminosity > currentLuminosity * 1.1) {
            // Estrella se vuelve más brillante - puede reducir habitabilidad
            change -= 0.01 * years / 100;
        }
        
        // Efecto de la actividad industrial
        if (planet.civilization && planet.civilization.kardashev.level > 0.5) {
            change -= 0.005 * years / 100; // Impacto ambiental
        }
        
        return change;
    }

    // 13. Manejar crisis planetarias
    handlePlanetaryCrises(planet, crises) {
        crises.forEach(crisis => {
            switch (crisis.type) {
                case 'resource_depletion':
                    this.handleResourceCrisis(planet, crisis);
                    break;
                case 'environmental_collapse':
                    this.handleEnvironmentalCrisis(planet, crisis);
                    break;
            }
        });
    }

    // 14. Manejar crisis de recursos
    handleResourceCrisis(planet, crisis) {
        // Reducir felicidad y estabilidad
        planet.civilization.happiness -= 20;
        planet.civilization.stability -= 15;
        
        // Aplicar límites
        planet.civilization.happiness = Math.max(0, planet.civilization.happiness);
        planet.civilization.stability = Math.max(0, planet.civilization.stability);
        
        console.log(`Crisis de recursos en ${planet.name}: ${crisis.message}`);
    }

    // 15. Manejar crisis ambiental
    handleEnvironmentalCrisis(planet, crisis) {
        // Impacto severo en la civilización
        planet.civilization.happiness -= 30;
        planet.civilization.stability -= 25;
        planet.civilization.population = Math.floor(planet.civilization.population * 0.8);
        
        console.log(`Crisis ambiental en ${planet.name}: ${crisis.message}`);
    }

    // 16. Actualizar sistema en Firebase
    async updateSystemInFirebase(system) {
        try {
            await this.firebaseService.db.collection('starSystems')
                .doc(system.id)
                .update({
                    ...system,
                    updated: new Date()
                });
        } catch (error) {
            console.error('Error actualizando sistema:', error);
        }
    }

    // 17. Ocultar pantalla de carga
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    // 18. Mostrar error
    showError(message) {
        console.error(message);
        this.uiManager.showNotification(message, 'error');
    }

    // 19. Obtener estadísticas del jugador
    getPlayerStats() {
        if (!this.currentUser) return null;
        
        const stats = {
            systems: this.userSystems.length,
            totalPlanets: this.userSystems.reduce((sum, system) => 
                sum + system.celestialBodies.planets.length, 0),
            totalPopulation: 0,
            averageKardashev: 0
        };
        
        // Calcular población total y Kardashev promedio
        let totalKardashev = 0;
        let planetCount = 0;
        
        this.userSystems.forEach(system => {
            system.celestialBodies.planets.forEach(planet => {
                if (planet.civilization) {
                    stats.totalPopulation += planet.civilization.population;
                    totalKardashev += planet.civilization.kardashev.level;
                    planetCount++;
                }
            });
        });
        
        stats.averageKardashev = planetCount > 0 ? totalKardashev / planetCount : 0;
        
        return stats;
    }

    // 20. Centrar galaxia
    centerGalaxy() {
        if (this.galaxyRenderer) {
            this.galaxyRenderer.centerGalaxy();
        }
    }

    // 21. Destruir instancia (cleanup)
    destroy() {
        if (this.firebaseService) {
            this.firebaseService.cleanup();
        }
        console.log('GameEngine destruido');
    }
}
