// 📁 game/explorationSystem.js - ARCHIVO NUEVO

class ExplorationSystem {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.exploredSystems = new Set();
        this.galacticEvents = [];
    }

    // 1. Explorar sistemas en un área
    async exploreArea(centerX, centerY, radius = 1000) {
        if (!this.firebaseService.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            console.log(`🔭 Explorando área: (${centerX}, ${centerY}) - Radio: ${radius}`);
            
            // Obtener todos los sistemas explorables
            const allSystems = await this.firebaseService.getExplorableSystems();
            
            // Filtrar sistemas en el área de exploración
            const systemsInArea = allSystems.filter(system => {
                const distance = Math.sqrt(
                    Math.pow(system.basicInfo.coordinates.x - centerX, 2) +
                    Math.pow(system.basicInfo.coordinates.y - centerY, 2)
                );
                return distance <= radius;
            });

            // Filtrar sistemas que el usuario aún no ha descubierto
            const newSystems = systemsInArea.filter(system => 
                system.ownership.ownerId !== this.firebaseService.currentUser.uid &&
                !system.discovery.discoverers.includes(this.firebaseService.currentUser.uid)
            );

            console.log(`📊 Sistemas encontrados: ${systemsInArea.length}, Nuevos: ${newSystems.length}`);

            // Agregar usuario como descubridor de los nuevos sistemas
            const discoveryResults = [];
            for (const system of newSystems) {
                const success = await this.firebaseService.addDiscovererToSystem(system.id, this.firebaseService.currentUser.uid);
                if (success) {
                    discoveryResults.push(system);
                    this.exploredSystems.add(system.id);
                }
            }

            // Generar evento aleatorio si se descubrieron sistemas
            if (discoveryResults.length > 0 && Math.random() > 0.7) {
                await this.generateRandomEvent(discoveryResults);
            }

            return discoveryResults;

        } catch (error) {
            console.error('Error explorando área:', error);
            throw error;
        }
    }

    // 2. Buscar sistemas por nombre o características
    async searchSystems(query, filters = {}) {
        try {
            const systems = await this.firebaseService.searchSystems(query, filters);
            
            // Ordenar por relevancia
            return systems.sort((a, b) => {
                // Priorizar sistemas del usuario
                if (a.ownership.ownerId === this.firebaseService.currentUser.uid && 
                    b.ownership.ownerId !== this.firebaseService.currentUser.uid) {
                    return -1;
                }
                if (b.ownership.ownerId === this.firebaseService.currentUser.uid && 
                    a.ownership.ownerId !== this.firebaseService.currentUser.uid) {
                    return 1;
                }
                
                // Priorizar sistemas descubiertos por el usuario
                const aDiscovered = a.discovery.discoverers.includes(this.firebaseService.currentUser.uid);
                const bDiscovered = b.discovery.discoverers.includes(this.firebaseService.currentUser.uid);
                
                if (aDiscovered && !bDiscovered) return -1;
                if (!aDiscovered && bDiscovered) return 1;
                
                return 0;
            });
        } catch (error) {
            console.error('Error buscando sistemas:', error);
            return [];
        }
    }

    // 3. Obtener sistemas populares (más explorados)
    async getPopularSystems(limit = 10) {
        try {
            const systems = await this.firebaseService.getExplorableSystems();
            
            return systems
                .map(system => ({
                    ...system,
                    popularity: system.discovery.discoverers.length,
                    discoveryPercentage: (system.discovery.discoverers.length / 100) * 100 // estimado
                }))
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, limit);
        } catch (error) {
            console.error('Error obteniendo sistemas populares:', error);
            return [];
        }
    }

    // 4. Obtener sistemas recientemente descubiertos
    async getRecentlyDiscovered(limit = 5) {
        try {
            const systems = await this.firebaseService.getExplorableSystems();
            
            return systems
                .filter(system => system.discovery.status === 'discovered')
                .sort((a, b) => new Date(b.discovery.discoveryDate) - new Date(a.discovery.discoveryDate))
                .slice(0, limit)
                .map(system => ({
                    ...system,
                    discovererName: this.getDiscovererName(system),
                    timeAgo: this.getTimeAgo(system.discovery.discoveryDate)
                }));
        } catch (error) {
            console.error('Error obteniendo sistemas recientes:', error);
            return [];
        }
    }

    // 5. Generar evento galáctico aleatorio
    async generateRandomEvent(discoveredSystems = []) {
        const events = [
            {
                type: 'supernova',
                name: 'Supernova Brillante',
                message: '¡Una estrella ha explotado como supernova! Los sistemas cercanos son más fáciles de detectar.',
                effect: 'boost_exploration',
                radius: 2000,
                duration: 24, // horas
                color: '#FF6B35',
                icon: '💥'
            },
            {
                type: 'wormhole',
                name: 'Agujero de Gusano',
                message: 'Un portal interestelar se ha abierto, revelando sistemas distantes.',
                effect: 'reveal_distant',
                connectedRegions: ['alpha', 'beta'],
                duration: 48,
                color: '#8B5CF6',
                icon: '🌀'
            },
            {
                type: 'nebula',
                name: 'Nebulosa Misteriosa',
                message: 'Una nebulosa interestelar oculta sistemas en esta región.',
                effect: 'hide_systems',
                radius: 1500,
                duration: 12,
                color: '#06B6D4',
                icon: '☁️'
            },
            {
                type: 'alien_signal',
                name: 'Señal Alienígena',
                message: 'Se ha detectado una señal de origen artificial. ¡Podría haber vida inteligente!',
                effect: 'reveal_civilizations',
                duration: 36,
                color: '#10B981',
                icon: '👽'
            }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        // Enriquecer evento con datos de sistemas descubiertos
        const enrichedEvent = {
            ...randomEvent,
            id: `event_${Date.now()}`,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + randomEvent.duration * 60 * 60 * 1000),
            active: true,
            relatedSystems: discoveredSystems.map(s => s.id),
            discoveredBy: this.firebaseService.currentUser.uid
        };

        this.galacticEvents.push(enrichedEvent);
        
        console.log(`🎉 Evento galáctico: ${enrichedEvent.name}`, enrichedEvent);
        
        // En una implementación completa, guardaríamos en Firestore
        // await this.firebaseService.db.collection('galacticEvents').add(enrichedEvent);
        
        return enrichedEvent;
    }

    // 6. Obtener eventos activos
    getActiveEvents() {
        const now = new Date();
        return this.galacticEvents.filter(event => 
            event.active && event.expiresAt > now
        );
    }

    // 7. Verificar si un sistema ha sido explorado por el usuario
    isSystemExplored(systemId) {
        return this.exploredSystems.has(systemId);
    }

    // 8. Obtener estadísticas de exploración
    async getExplorationStats() {
        try {
            const systems = await this.firebaseService.getExplorableSystems();
            const userSystems = await this.firebaseService.getUserStarSystems();
            
            const totalSystems = systems.length;
            const userDiscovered = systems.filter(system => 
                system.discovery.discoverers.includes(this.firebaseService.currentUser.uid)
            ).length;
            
            const userCreated = userSystems.length;
            
            return {
                totalSystems,
                userDiscovered,
                userCreated,
                explorationPercentage: totalSystems > 0 ? (userDiscovered / totalSystems) * 100 : 0,
                discoveryRank: this.calculateDiscoveryRank(userDiscovered)
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                totalSystems: 0,
                userDiscovered: 0,
                userCreated: 0,
                explorationPercentage: 0,
                discoveryRank: 'Novato'
            };
        }
    }

    // 9. Helper: Calcular rango de descubrimiento
    calculateDiscoveryRank(discoveredCount) {
        if (discoveredCount >= 100) return 'Pionero Galáctico';
        if (discoveredCount >= 50) return 'Explorador Estelar';
        if (discoveredCount >= 25) return 'Navegante Espacial';
        if (discoveredCount >= 10) return 'Cartógrafo';
        if (discoveredCount >= 5) return 'Astrónomo';
        return 'Novato';
    }

    // 10. Helper: Obtener nombre del descubridor
    getDiscovererName(system) {
        if (system.ownership.ownerId === this.firebaseService.currentUser.uid) {
            return 'Tú';
        }
        
        // En una implementación real, buscaríamos el nombre del usuario
        const firstDiscoverer = system.discovery.firstDiscoverer;
        if (firstDiscoverer === this.firebaseService.currentUser.uid) {
            return 'Tú';
        }
        
        return `Explorador ${firstDiscoverer.substring(0, 8)}`;
    }

    // 11. Helper: Formatear tiempo transcurrido
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'ahora mismo';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours} h`;
        if (diffDays === 1) return 'hace 1 día';
        return `hace ${diffDays} días`;
    }

    // 12. Obtener sistemas cercanos a una posición
    async getNearbySystems(centerX, centerY, maxDistance = 2000) {
        try {
            const systems = await this.firebaseService.getExplorableSystems();
            
            return systems
                .map(system => {
                    const distance = Math.sqrt(
                        Math.pow(system.basicInfo.coordinates.x - centerX, 2) +
                        Math.pow(system.basicInfo.coordinates.y - centerY, 2)
                    );
                    
                    return {
                        ...system,
                        distance: Math.floor(distance),
                        direction: this.getDirection(centerX, centerY, system.basicInfo.coordinates.x, system.basicInfo.coordinates.y)
                    };
                })
                .filter(system => system.distance <= maxDistance)
                .sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Error obteniendo sistemas cercanos:', error);
            return [];
        }
    }

    // 13. Helper: Obtener dirección cardinal
    getDirection(fromX, fromY, toX, toY) {
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
        
        if (angle >= -45 && angle < 45) return 'este';
        if (angle >= 45 && angle < 135) return 'sur';
        if (angle >= 135 || angle < -135) return 'oeste';
        return 'norte';
    }

    // 14. Limpiar eventos expirados
    cleanupExpiredEvents() {
        const now = new Date();
        this.galacticEvents = this.galacticEvents.filter(event => 
            event.expiresAt > now
        );
    }

    // 15. Inicializar sistema de exploración
    async initialize() {
        // Cargar eventos activos (en una implementación real, desde Firestore)
        this.cleanupExpiredEvents();
        
        // Cargar sistemas ya explorados por el usuario
        try {
            const systems = await this.firebaseService.getExplorableSystems();
            systems.forEach(system => {
                if (system.discovery.discoverers.includes(this.firebaseService.currentUser.uid)) {
                    this.exploredSystems.add(system.id);
                }
            });
        } catch (error) {
            console.error('Error inicializando exploración:', error);
        }
    }
}
