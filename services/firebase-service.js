class FirebaseService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.unsubscribes = [];
    }

    // 1. Inicialización y autenticación
    async initialize() {
        return new Promise((resolve, reject) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    console.log('Usuario autenticado:', user.email);
                    await this.loadUserData(user.uid);
                    resolve(user);
                } else {
                    this.currentUser = null;
                    console.log('Usuario no autenticado');
                    resolve(null);
                }
            }, reject);
        });
    }

    // 2. Cargar datos del usuario
    async loadUserData(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                // Crear usuario nuevo
                await this.createNewUser(userId);
            } else {
                console.log('Datos de usuario cargados:', userDoc.data());
            }
        } catch (error) {
            console.error('Error cargando datos de usuario:', error);
        }
    }

    // 3. Crear nuevo usuario
    async createNewUser(userId, isAnonymous = false, additionalData = {}) {
        const userData = {
            basicInfo: {
                username: additionalData.username || `Explorador_${userId.substring(0, 8)}`,
                email: additionalData.email || (isAnonymous ? null : this.currentUser?.email),
                joinDate: new Date(),
                status: 'online',
                lastLogin: new Date(),
                isAnonymous: isAnonymous
            },
            progression: {
                level: 1,
                experience: 0,
                totalExperience: 1000,
                kardashevLevel: 0.1,
                rank: 'Novato',
                achievements: ['pionero']
            },
            resources: {
                energy: 1000,
                darkMatter: 0,
                quantumCrystals: 0,
                antimatter: 0,
                credits: 5000
            },
            statistics: {
                worldsCreated: 0,
                civilizationsEvolved: 0,
                systemsDiscovered: 0,
                alliancesFormed: 0,
                totalPlayTime: 0
            },
            settings: {
                notifications: true,
                musicVolume: 0.7,
                effectsVolume: 0.8,
                language: 'es',
                theme: 'dark'
            },
            social: {
                allianceId: null,
                friends: [],
                blockedUsers: [],
                reputation: 50
            }
        };

        await this.db.collection('users').doc(userId).set(userData);
        console.log('Nuevo usuario creado:', userData);
    }

    // 4. Crear sistema estelar (VERSIÓN MEJORADA)
    async createStarSystem(systemData) {
        if (!this.currentUser) throw new Error('Usuario no autenticado');

        const systemId = `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const system = {
            basicInfo: {
                name: systemData.name,
                discoveryDate: new Date(),
                discoveredBy: this.currentUser.uid,
                coordinates: {
                    x: systemData.coordinates?.x || this.generateRandomCoordinate(),
                    y: systemData.coordinates?.y || this.generateRandomCoordinate(),
                    quadrant: this.getQuadrant(systemData.coordinates?.x, systemData.coordinates?.y)
                }
            },
            
            // NUEVO: Sistema de descubrimiento
            discovery: {
                status: 'claimed', // unexplored, discovered, claimed
                discoverers: [this.currentUser.uid],
                discoveryDate: new Date(),
                firstDiscoverer: this.currentUser.uid,
                explorationPoints: 10
            },
            
            // NUEVO: Información pública
            publicInfo: {
                name: systemData.name,
                starType: systemData.starType,
                planetCount: systemData.planetsCount,
                hasCivilization: false,
                threatLevel: 'low',
                resources: 'unknown'
            },
            
            physics: {
                primaryStar: {
                    type: systemData.starType,
                    mass: systemData.starMass,
                    age: systemData.starAge,
                    temperature: STAR_TYPES[systemData.starType]?.temperature?.[0] || 5778,
                    luminosity: StellarEvolution.calculateLuminosity(systemData.starMass, systemData.starAge),
                    spectralClass: this.getSpectralClass(systemData.starType, systemData.starMass)
                },
                multipleSystem: {
                    type: systemData.multipleSystem,
                    stars: this.generateMultipleStars(systemData)
                },
                gravitationalSystem: {
                    hillSphere: OrbitalMechanics.calculateHillSphere(1, systemData.starMass, 1),
                    stabilityIndex: 0.9,
                    tidalForces: {
                        planetary: 0.1,
                        stellar: 0.05
                    }
                }
            },
            celestialBodies: {
                planets: this.generatePlanets(systemData),
                minorBodies: this.generateMinorBodies(systemData)
            },
            phenomena: {
                blackHoles: [],
                nebulas: [],
                asteroidStorms: [],
                radiationZones: [],
                wormholes: []
            },
            ownership: {
                ownerId: this.currentUser.uid,
                access: [this.currentUser.uid],
                permissions: 'private',
                allianceId: null
            },
            created: new Date(),
            updated: new Date()
        };

        // Calcular estabilidad orbital
        system.physics.gravitationalSystem.stabilityIndex = 
            this.calculateSystemStability(system);

        await this.db.collection('starSystems').doc(systemId).set(system);
        
        // Actualizar estadísticas del usuario
        await this.updateUserStatistics('worldsCreated', 1);
        
        console.log('Sistema estelar creado:', systemId);
        return systemId;
    }

    // 5. Generar planetas para el sistema
    generatePlanets(systemData) {
        const planets = [];
        const habitableZone = ClimateModel.calculateHabitableZone({
            luminosity: StellarEvolution.calculateLuminosity(systemData.starMass, systemData.starAge)
        });

        for (let i = 0; i < systemData.planetsCount; i++) {
            const planetType = this.determinePlanetType(i, systemData.planetsCount, habitableZone);
            const distance = this.calculateOrbitalDistance(i, systemData.planetsCount, habitableZone);
            
            const planet = {
                planetId: `planet_${Date.now()}_${i}`,
                name: `${systemData.name} ${this.romanize(i + 1)}`,
                type: planetType,
                size: MathUtils.normalRange(
                    PLANET_TYPES[planetType].sizeRange[0],
                    PLANET_TYPES[planetType].sizeRange[1]
                ),
                mass: MathUtils.normalRange(0.1, 10, 1, 2),
                orbit: {
                    semiMajorAxis: distance,
                    eccentricity: Math.random() * 0.1,
                    period: OrbitalMechanics.calculateOrbitalPeriod(systemData.starMass, distance),
                    inclination: Math.random() * 10
                },
                rotation: {
                    period: 10 + Math.random() * 30, // horas
                    axialTilt: Math.random() * 45
                },
                conditions: {
                    temperature: ClimateModel.calculateEquilibriumTemperature(
                        { luminosity: StellarEvolution.calculateLuminosity(systemData.starMass, systemData.starAge) },
                        { orbit: { semiMajorAxis: distance } },
                        { albedo: 0.3 }
                    ),
                    atmosphere: this.generateAtmosphere(planetType, distance, habitableZone),
                    pressure: ClimateModel.calculateSurfacePressure(
                        { mass: 1, radius: 1 },
                        { mass: 1 }
                    ),
                    habitability: MathUtils.normalRange(
                        PLANET_TYPES[planetType].habitability[0],
                        PLANET_TYPES[planetType].habitability[1]
                    )
                },
                resources: {
                    metals: {
                        current: 100000,
                        initial: 100000,
                        depletionRate: 100,
                        yearsRemaining: 1000,
                        recyclingEfficiency: 0.6
                    },
                    energy: {
                        current: 50000,
                        capacity: 50000,
                        consumption: 500,
                        sources: {
                            solar: { percentage: 60, efficiency: 0.15 },
                            nuclear: { percentage: 30, efficiency: 0.3 },
                            fusion: { percentage: 10, efficiency: 0.8 }
                        }
                    },
                    rareElements: {
                        current: 5000,
                        initial: 5000,
                        depletionRate: 10
                    }
                },
                civilization: {
                    currentEra: 'pre_industrial',
                    population: 1000000,
                    growthRate: 1.02,
                    happiness: 70,
                    stability: 75,
                    government: {
                        type: systemData.governmentType,
                        laws: {
                            economicSystem: 'mixed',
                            individualRights: 'medium',
                            environmentalProtection: 'medium',
                            technologicalDevelopment: 'medium',
                            militaryFocus: 'low'
                        }
                    },
                    technology: {
                        energy: 1.0,
                        computing: 1.0,
                        biotechnology: 1.0,
                        spaceTravel: 0.5,
                        weapons: 0.5,
                        medicine: 1.0
                    },
                    kardashev: {
                        level: 0.1,
                        energyConsumption: 1e12,
                        progressToNext: 0.1
                    }
                },
                moons: this.generateMoons(planetType, i),
                created: new Date()
            };

            planets.push(planet);
        }

        return planets;
    }

    // 6. Obtener todos los sistemas explorables
    async getExplorableSystems() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('starSystems')
                .where('discovery.status', 'in', ['discovered', 'claimed'])
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error obteniendo sistemas explorables:', error);
            return [];
        }
    }

    // 7. Agregar descubridor a un sistema
    async addDiscovererToSystem(systemId, userId) {
        try {
            await this.db.collection('starSystems').doc(systemId).update({
                'discovery.discoverers': firebase.firestore.FieldValue.arrayUnion(userId),
                'discovery.status': 'discovered',
                'publicInfo.lastExplored': new Date()
            });
            
            await this.updateUserStatistics('systemsDiscovered', 1);
            return true;
        } catch (error) {
            console.error('Error agregando descubridor:', error);
            return false;
        }
    }

    // 8. Buscar sistemas
    async searchSystems(query, filters = {}) {
        try {
            let systemsQuery = this.db.collection('starSystems')
                .where('discovery.status', 'in', ['discovered', 'claimed']);

            const snapshot = await systemsQuery.get();
            let systems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Aplicar filtros manualmente
            if (query) {
                systems = systems.filter(system => 
                    system.basicInfo.name.toLowerCase().includes(query.toLowerCase()) ||
                    system.publicInfo.starType.toLowerCase().includes(query.toLowerCase())
                );
            }

            if (filters.starType) {
                systems = systems.filter(system => 
                    system.publicInfo.starType === filters.starType
                );
            }

            if (filters.minPlanets) {
                systems = systems.filter(system => 
                    system.publicInfo.planetCount >= filters.minPlanets
                );
            }

            return systems;
        } catch (error) {
            console.error('Error buscando sistemas:', error);
            return [];
        }
    }

    // 9. Generar coordenada aleatoria
    generateRandomCoordinate() {
        return Math.random() * 45000 + 2500; // 2500 - 47500
    }

    // 10. Actualizar estadísticas del usuario
    async updateUserStatistics(stat, increment = 1) {
        if (!this.currentUser) return;

        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                [`statistics.${stat}`]: firebase.firestore.FieldValue.increment(increment),
                'basicInfo.lastLogin': new Date()
            });
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // 11. Obtener sistemas del usuario
    async getUserStarSystems() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('starSystems')
                .where('ownership.ownerId', '==', this.currentUser.uid)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error obteniendo sistemas:', error);
            return [];
        }
    }

    // 12. Escuchar cambios en tiempo real
    listenToUserSystems(callback) {
        if (!this.currentUser) return;

        const unsubscribe = this.db.collection('starSystems')
            .where('ownership.ownerId', '==', this.currentUser.uid)
            .onSnapshot(snapshot => {
                const systems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(systems);
            }, error => {
                console.error('Error escuchando sistemas:', error);
            });

        this.unsubscribes.push(unsubscribe);
        return unsubscribe;
    }

    // 13. Escuchar sistemas explorables
    listenToExplorableSystems(callback) {
        if (!this.currentUser) return;

        const unsubscribe = this.db.collection('starSystems')
            .where('discovery.status', 'in', ['discovered', 'claimed'])
            .onSnapshot(snapshot => {
                const systems = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(systems);
            }, error => {
                console.error('Error escuchando sistemas explorables:', error);
            });

        this.unsubscribes.push(unsubscribe);
        return unsubscribe;
    }

    // 14. Helper: Obtener cuadrante galáctico
    getQuadrant(x, y) {
        const centerX = 25000;
        const centerY = 25000;
        
        if (x < centerX && y < centerY) return 'alpha';
        if (x >= centerX && y < centerY) return 'beta';
        if (x < centerX && y >= centerY) return 'gamma';
        return 'delta';
    }

    // 15. Helper: Obtener clase espectral
    getSpectralClass(starType, mass) {
        const types = {
            'enana_amarilla': 'G',
            'enana_roja': 'M',
            'gigante_azul': 'O',
            'gigante_roja': 'K',
            'enana_blanca': 'D'
        };
        return types[starType] || 'G';
    }

    // 16. Helper: Generar estrellas múltiples
    generateMultipleStars(systemData) {
        if (systemData.multipleSystem === 'single') return [];
        
        const stars = [];
        const count = systemData.multipleSystem === 'binary' ? 1 : 2;
        
        for (let i = 0; i < count; i++) {
            stars.push({
                type: Math.random() > 0.5 ? 'enana_roja' : 'enana_amarilla',
                mass: systemData.starMass * (0.2 + Math.random() * 0.5),
                orbitDistance: 10 + Math.random() * 100 // AU
            });
        }
        
        return stars;
    }

    // 17. Helper: Generar cuerpos menores
    generateMinorBodies(systemData) {
        return [
            {
                type: 'asteroid_belt',
                innerRadius: 2.0,
                outerRadius: 4.0,
                resourceDensity: 0.7
            },
            {
                type: 'kuiper_belt',
                innerRadius: 30.0,
                outerRadius: 50.0,
                resourceDensity: 0.3
            }
        ];
    }

    // 18. Helper: Calcular estabilidad del sistema
    calculateSystemStability(system) {
        let stability = 1.0;
        const planets = system.celestialBodies.planets;
        
        // Verificar resonancias peligrosas
        const resonances = OrbitalMechanics.findOrbitalResonances(planets);
        resonances.forEach(resonance => {
            if (['2:1', '3:1'].includes(resonance.resonance)) {
                stability *= 0.8;
            }
        });
        
        // Verificar órbitas inestables
        planets.forEach(planet => {
            if (!OrbitalMechanics.isOrbitStable(planet, system.physics.primaryStar, planets)) {
                stability *= 0.5;
            }
        });
        
        return Math.max(0.1, stability);
    }

    // 19. Helper: Números romanos
    romanize(num) {
        const roman = {
            M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
            L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let str = '';
        for (let i of Object.keys(roman)) {
            let q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        return str;
    }

    // 20. Determinar tipo de planeta basado en posición
    determinePlanetType(index, totalPlanets, habitableZone) {
        const position = index / totalPlanets;
        
        if (position < 0.3) return 'rocoso';
        if (position >= 0.3 && position < 0.6) {
            // Zona habitable
            const inHabitableZone = Math.random() > 0.3;
            return inHabitableZone ? 'oceánico' : 'rocoso';
        }
        if (position >= 0.6 && position < 0.8) return 'gaseoso';
        return 'helado';
    }

    // 21. Calcular distancia orbital
    calculateOrbitalDistance(index, totalPlanets, habitableZone) {
        // Ley de Titus-Bode modificada
        const baseDistance = 0.4;
        const multiplier = 1.7;
        
        if (index === 0) return baseDistance;
        return baseDistance + (multiplier * Math.pow(2, index - 1));
    }

    // 22. Generar atmósfera
    generateAtmosphere(planetType, distance, habitableZone) {
        const baseAtmosphere = {
            composition: {},
            albedo: 0.3,
            pressure: 1.0,
            quality: 0.8
        };

        switch(planetType) {
            case 'rocoso':
                if (distance >= habitableZone.inner && distance <= habitableZone.outer) {
                    baseAtmosphere.composition = { N2: 0.78, O2: 0.21, CO2: 0.01 };
                } else {
                    baseAtmosphere.composition = { CO2: 0.95, N2: 0.05 };
                }
                break;
            case 'oceánico':
                baseAtmosphere.composition = { N2: 0.78, O2: 0.21, H2O: 0.01 };
                baseAtmosphere.albedo = 0.25;
                break;
            case 'gaseoso':
                baseAtmosphere.composition = { H2: 0.90, He: 0.10 };
                baseAtmosphere.pressure = 100.0;
                break;
            case 'helado':
                baseAtmosphere.composition = { CO2: 0.95, N2: 0.05 };
                baseAtmosphere.pressure = 0.1;
                break;
        }

        return baseAtmosphere;
    }

    // 23. Generar lunas para un planeta
    generateMoons(planetType, planetIndex) {
        const moonCount = planetType === 'gaseoso' ? 
            Math.floor(Math.random() * 10) + 5 : // Gigantes gaseosos tienen muchas lunas
            Math.floor(Math.random() * 3);       // Planetas rocosos tienen pocas lunas

        const moons = [];
        for (let i = 0; i < moonCount; i++) {
            moons.push({
                id: `moon_${planetIndex}_${i}`,
                name: `Luna ${i + 1}`,
                mass: Math.random() * 0.1,
                radius: Math.random() * 0.5,
                distance: 0.001 + Math.random() * 0.01,
                orbitalPeriod: 1 + Math.random() * 30,
                composition: 'rocky'
            });
        }
        return moons;
    }

    // 24. Actualizar perfil de usuario
    async updateUserProfile(profileData) {
        if (!this.currentUser) return;
        
        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                'basicInfo.username': profileData.username,
                'basicInfo.email': profileData.email,
                'basicInfo.lastLogin': new Date()
            });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
        }
    }

    // 25. Eliminar datos de usuario
    async deleteUserData(userId) {
        try {
            await this.db.collection('users').doc(userId).delete();
            console.log('Datos de usuario eliminados');
        } catch (error) {
            console.error('Error eliminando datos de usuario:', error);
            throw error;
        }
    }

    // 26. Limpiar listeners
    cleanup() {
        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];
    }
}
