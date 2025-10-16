class GameEngine {
    constructor() {
        this.firebaseService = new FirebaseService();
        this.authService = new AuthService();
        this.explorationSystem = new ExplorationSystem(this.firebaseService);
        this.galaxyRenderer = null;
        this.uiManager = null;
        
        this.currentUser = null;
        this.userSystems = [];
        this.explorableSystems = [];
        this.gameState = {
            galacticYear: 2024,
            isPaused: false,
            simulationSpeed: 1
        };
        
        this.init();
    }

    // 1. Inicialización del juego
    async init() {
        console.log('🚀 Inicializando Galaxia X...');
        
        try {
            // Mostrar pantalla de carga
            this.showLoadingScreen();
            
            // Inicializar Firebase
            await this.firebaseService.initialize();
            this.currentUser = this.firebaseService.currentUser;
            
            // Inicializar sistema de exploración
            if (this.currentUser) {
                await this.explorationSystem.initialize();
            }
            
            // Inicializar renderizador
            this.galaxyRenderer = new GalaxyRenderer('galaxyCanvas');
            
            // Inicializar UI Manager
            this.uiManager = new UIManager(this);
            
            // Cargar sistemas del usuario y explorables
            await this.loadAllSystems();
            
            // Configurar listeners en tiempo real
            this.setupRealTimeListeners();
            
            // Ocultar pantalla de carga
            this.hideLoadingScreen();
            
            console.log('✅ Juego inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando el juego:', error);
            this.showError('Error al inicializar el juego: ' + error.message);
        }
    }

    // 2. Cargar todos los sistemas
    async loadAllSystems() {
        if (!this.currentUser) {
            console.log('🔐 Usuario no autenticado, saltando carga de sistemas');
            return;
        }
        
        try {
            console.log('📥 Cargando sistemas...');
            
            // Cargar sistemas del usuario
            this.userSystems = await this.firebaseService.getUserStarSystems();
            console.log(`✅ Sistemas del usuario: ${this.userSystems.length}`);
            
            // Cargar sistemas explorables
            this.explorableSystems = await this.firebaseService.getExplorableSystems();
            console.log(`✅ Sistemas explorables: ${this.explorableSystems.length}`);
            
            // Actualizar renderizador
            this.galaxyRenderer.updateSystems(this.userSystems);
            this.galaxyRenderer.updateExplorableSystems(this.explorableSystems);
            
            console.log(`🎯 Total de sistemas cargados: ${this.userSystems.length + this.explorableSystems.length}`);
            
        } catch (error) {
            console.error('❌ Error cargando sistemas:', error);
        }
    }

    // 3. Configurar listeners en tiempo real
    setupRealTimeListeners() {
        // Escuchar cambios en sistemas del usuario
        this.firebaseService.listenToUserSystems((systems) => {
            console.log('🔄 Actualizando sistemas del usuario:', systems.length);
            this.userSystems = systems;
            this.galaxyRenderer.updateSystems(systems);
            if (this.uiManager) {
                this.uiManager.updateSystemsList(systems);
            }
        });
        
        // Escuchar sistemas explorables
        this.firebaseService.listenToExplorableSystems((systems) => {
            console.log('🔄 Actualizando sistemas explorables:', systems.length);
            this.explorableSystems = systems;
            this.galaxyRenderer.updateExplorableSystems(systems);
        });
        
        // Escuchar cambios de autenticación
        this.authService.onAuthStateChanged(async (user) => {
            console.log('🔐 Cambio de estado de autenticación:', user ? 'Conectado' : 'Desconectado');
            
            this.currentUser = user;
            this.firebaseService.currentUser = user;
            
            if (user) {
                // Usuario conectado
                await this.explorationSystem.initialize();
                await this.loadAllSystems();
                if (this.uiManager) {
                    this.uiManager.updateAuthState(true, user);
                }
            } else {
                // Usuario desconectado
                this.userSystems = [];
                this.explorableSystems = [];
                this.galaxyRenderer.updateSystems([]);
                this.galaxyRenderer.updateExplorableSystems([]);
                if (this.uiManager) {
                    this.uiManager.updateAuthState(false);
                }
            }
        });
    }

    // 4. Crear nuevo sistema estelar
    async createStarSystem(systemData) {
        if (!this.currentUser) {
            this.uiManager.showLoginPrompt();
            throw new Error('Usuario no autenticado');
        }

        try {
            console.log('🪐 Creando sistema estelar:', systemData.name);
            
            // Validar datos del sistema
            if (!this.validateSystemData(systemData)) {
                throw new Error('Datos del sistema inválidos');
            }

            // Generar coordenadas si no se proporcionan
            if (!systemData.coordinates) {
                systemData.coordinates = this.generateRandomCoordinates();
                console.log('📍 Coordenadas generadas:', systemData.coordinates);
            }

            // Crear sistema en Firebase
            const systemId = await this.firebaseService.createStarSystem(systemData);
            
            // Centrar vista en el nuevo sistema
            this.galaxyRenderer.centerOn(
                systemData.coordinates.x,
                systemData.coordinates.y
            );
            
            console.log('✅ Sistema creado exitosamente:', systemId);
            
            return systemId;
            
        } catch (error) {
            console.error('❌ Error creando sistema:', error);
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

    // 7. Explorar área actual
    async exploreCurrentArea() {
        if (!this.currentUser) {
            this.uiManager.showLoginPrompt();
            return [];
        }

        try {
            console.log('🔭 Iniciando exploración del área...');
            
            const viewport = this.galaxyRenderer.getCurrentViewport();
            console.log('📍 Viewport actual:', viewport);
            
            const discoveredSystems = await this.explorationSystem.exploreArea(
                viewport.centerX, 
                viewport.centerY, 
                viewport.radius
            );

            console.log('✅ Exploración completada. Sistemas descubiertos:', discoveredSystems.length);

            if (discoveredSystems.length > 0) {
                // Actualizar lista de sistemas explorables
                this.explorableSystems = await this.firebaseService.getExplorableSystems();
                this.galaxyRenderer.updateExplorableSystems(this.explorableSystems);
                
                // Generar evento aleatorio
                const event = await this.explorationSystem.generateRandomEvent(discoveredSystems);
                if (event && this.uiManager) {
                    this.uiManager.showNotification(`🎉 ${event.message}`, 'info');
                }
            }

            return discoveredSystems;
        } catch (error) {
            console.error('❌ Error explorando área:', error);
            throw error;
        }
    }

    // 8. Buscar sistemas
    async searchSystems(query, filters = {}) {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            console.log('🔍 Buscando sistemas:', { query, filters });
            const results = await this.explorationSystem.searchSystems(query, filters);
            console.log('✅ Búsqueda completada. Resultados:', results.length);
            return results;
        } catch (error) {
            console.error('❌ Error buscando sistemas:', error);
            throw error;
        }
    }

    // 9. Obtener sistemas populares
    async getPopularSystems(limit = 10) {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const popularSystems = await this.explorationSystem.getPopularSystems(limit);
            console.log('📊 Sistemas populares obtenidos:', popularSystems.length);
            return popularSystems;
        } catch (error) {
            console.error('❌ Error obteniendo sistemas populares:', error);
            throw error;
        }
    }

    // 10. Obtener sistemas recientes
    async getRecentlyDiscovered(limit = 5) {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const recentSystems = await this.explorationSystem.getRecentlyDiscovered(limit);
            console.log('🆕 Sistemas recientes obtenidos:', recentSystems.length);
            return recentSystems;
        } catch (error) {
            console.error('❌ Error obteniendo sistemas recientes:', error);
            throw error;
        }
    }

    // 11. Obtener estadísticas de exploración
    async getExplorationStats() {
        if (!this.currentUser) {
            return {
                totalSystems: 0,
                userDiscovered: 0,
                userCreated: 0,
                explorationPercentage: 0,
                discoveryRank: 'Novato'
            };
        }

        try {
            const stats = await this.explorationSystem.getExplorationStats();
            console.log('📈 Estadísticas de exploración:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                totalSystems: 0,
                userDiscovered: 0,
                userCreated: 0,
                explorationPercentage: 0,
                discoveryRank: 'Novato'
            };
        }
    }

    // 12. Obtener sistemas cercanos
    async getNearbySystems(maxDistance = 2000) {
        if (!this.currentUser) {
            return [];
        }

        try {
            const viewport = this.galaxyRenderer.getCurrentViewport();
            const nearbySystems = await this.explorationSystem.getNearbySystems(
                viewport.centerX, 
                viewport.centerY, 
                maxDistance
            );
            console.log('📍 Sistemas cercanos:', nearbySystems.length);
            return nearbySystems;
        } catch (error) {
            console.error('❌ Error obteniendo sistemas cercanos:', error);
            return [];
        }
    }

    // 13. Avanzar tiempo de simulación
    async advanceTime(years = 100) {
        if (!this.currentUser) {
            this.uiManager.showNotification('Inicia sesión para avanzar el tiempo', 'warning');
            return;
        }
        
        try {
            console.log('⏩ Avanzando tiempo:', years, 'años');
            
            this.gameState.galacticYear += years;
            
            // Actualizar UI
            if (this.uiManager) {
                this.uiManager.updateGalacticYear(this.gameState.galacticYear);
            }
            
            // Simular evolución de todos los sistemas del usuario
            for (const system of this.userSystems) {
                await this.simulateSystemEvolution(system, years);
            }
            
            console.log('✅ Tiempo avanzado. Año galáctico:', this.gameState.galacticYear);
            
            if (this.uiManager) {
                this.uiManager.showNotification(
                    `¡Tiempo avanzado ${years} años! Año galáctico: ${this.gameState.galacticYear}`,
                    'info'
                );
            }
            
        } catch (error) {
            console.error('❌ Error avanzando tiempo:', error);
            if (this.uiManager) {
                this.uiManager.showNotification(
                    `Error avanzando tiempo: ${error.message}`,
                    'error'
                );
            }
        }
    }

    // 14. Simular evolución del sistema
    async simulateSystemEvolution(system, years) {
        try {
            // Evolucionar cada planeta en el sistema
            for (const planet of system.celestialBodies.planets) {
                await this.evolvePlanet(planet, years, system);
            }
            
            // Actualizar sistema en Firebase
            await this.updateSystemInFirebase(system);
            
        } catch (error) {
            console.error(`❌ Error evolucionando sistema ${system.basicInfo.name}:`, error);
        }
    }

    // 15. Evolucionar planeta
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

    // 16. Simular consumo de recursos
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

    // 17. Simular cambios ambientales
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

    // 18. Calcular cambio en habitabilidad
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

    // 19. Manejar crisis planetarias
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

    // 20. Manejar crisis de recursos
    handleResourceCrisis(planet, crisis) {
        // Reducir felicidad y estabilidad
        planet.civilization.happiness -= 20;
        planet.civilization.stability -= 15;
        
        // Aplicar límites
        planet.civilization.happiness = Math.max(0, planet.civilization.happiness);
        planet.civilization.stability = Math.max(0, planet.civilization.stability);
        
        console.log(`⚠️ Crisis de recursos en ${planet.name}: ${crisis.message}`);
    }

    // 21. Manejar crisis ambiental
    handleEnvironmentalCrisis(planet, crisis) {
        // Impacto severo en la civilización
        planet.civilization.happiness -= 30;
        planet.civilization.stability -= 25;
        planet.civilization.population = Math.floor(planet.civilization.population * 0.8);
        
        console.log(`🌪️ Crisis ambiental en ${planet.name}: ${crisis.message}`);
    }

    // 22. Actualizar sistema en Firebase
    async updateSystemInFirebase(system) {
        try {
            await this.firebaseService.db.collection('starSystems')
                .doc(system.id)
                .update({
                    ...system,
                    updated: new Date()
                });
        } catch (error) {
            console.error('❌ Error actualizando sistema:', error);
        }
    }

    // 23. Obtener estadísticas del jugador
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

    // 24. Centrar galaxia
    centerGalaxy() {
        if (this.galaxyRenderer) {
            this.galaxyRenderer.centerGalaxy();
        }
    }

    // 25. Mostrar pantalla de carga
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    // 26. Ocultar pantalla de carga
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    // 27. Mostrar error
    showError(message) {
        console.error('❌ Error:', message);
        if (this.uiManager) {
            this.uiManager.showNotification(message, 'error');
        }
    }

    // 28. Destruir instancia (cleanup)
    destroy() {
        if (this.firebaseService) {
            this.firebaseService.cleanup();
        }
        console.log('🛑 GameEngine destruido');
    }
}

// Hacer disponible globalmente para debugging
window.GameEngine = GameEngine;
