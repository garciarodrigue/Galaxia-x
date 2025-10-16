class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentModal = null;
        this.explorationStats = null;
        this.isMenuVisible = true; // Control de visibilidad del menú
        
        this.init();
    }

    // 1. Inicialización
    init() {
        this.setupEventListeners();
        this.updateAuthState(false);
        this.addExplorationUI();
        this.addMenuToggle(); // Nuevo: botón para ocultar/mostrar menú
        this.startStatsUpdate();
        this.startEventMonitor(); // Nuevo: monitor de eventos
    }

    // 2. Configurar event listeners
    setupEventListeners() {
        // Botón crear sistema
        document.getElementById('createSystemBtn').addEventListener('click', () => {
            this.showCreateSystemModal();
        });

        // Botón centrar galaxia
        document.getElementById('centerGalaxyBtn').addEventListener('click', () => {
            this.gameEngine.centerGalaxy();
        });

        // Botón avanzar tiempo
        document.getElementById('advanceTimeBtn').addEventListener('click', () => {
            this.gameEngine.advanceTime(100);
        });

        // Botón iniciar sesión
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        // Cerrar modales
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal('createSystemModal');
        });

        document.getElementById('closeSystemModal').addEventListener('click', () => {
            this.hideModal('systemInfoModal');
        });

        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCurrentModal();
            }
        });
    }

    // 3. NUEVO: Agregar toggle del menú
    addMenuToggle() {
        const buttonGroup = document.querySelector('.button-group');
        
        // Botón para ocultar/mostrar menú
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleMenuBtn';
        toggleBtn.className = 'btn-secondary';
        toggleBtn.innerHTML = '👁️ Ocultar UI';
        toggleBtn.addEventListener('click', () => this.toggleMenu());
        
        buttonGroup.appendChild(toggleBtn);
    }

    // 4. NUEVO: Alternar visibilidad del menú
    toggleMenu() {
        const menu = document.querySelector('.control-panel');
        const toggleBtn = document.getElementById('toggleMenuBtn');
        
        this.isMenuVisible = !this.isMenuVisible;
        
        if (menu) {
            if (this.isMenuVisible) {
                menu.style.transform = 'translateX(0)';
                toggleBtn.innerHTML = '👁️ Ocultar UI';
            } else {
                menu.style.transform = 'translateX(-100%)';
                toggleBtn.innerHTML = '👁️ Mostrar UI';
            }
        }
    }

    // 5. Agregar UI de exploración
    addExplorationUI() {
        const buttonGroup = document.querySelector('.button-group');
        
        // Botón de exploración
        const exploreBtn = document.createElement('button');
        exploreBtn.id = 'exploreBtn';
        exploreBtn.className = 'btn-secondary';
        exploreBtn.innerHTML = '🔭 Explorar Área';
        exploreBtn.addEventListener('click', () => this.exploreCurrentArea());
        
        // Botón de búsqueda
        const searchBtn = document.createElement('button');
        searchBtn.id = 'searchBtn';
        searchBtn.className = 'btn-secondary';
        searchBtn.innerHTML = '🔍 Buscar Sistemas';
        searchBtn.addEventListener('click', () => this.showSearchModal());
        
        // Insertar después del botón de centrar galaxia
        const centerBtn = document.getElementById('centerGalaxyBtn');
        buttonGroup.insertBefore(exploreBtn, centerBtn.nextSibling);
        buttonGroup.insertBefore(searchBtn, exploreBtn.nextSibling);
    }

    // 6. NUEVO: Monitor de eventos
    startEventMonitor() {
        // Verificar eventos cada 10 segundos
        setInterval(async () => {
            if (this.gameEngine.currentUser && this.gameEngine.userSystems.length > 0) {
                await this.checkForEvents();
            }
        }, 10000);
    }

    // 7. NUEVO: Verificar eventos en sistemas
    async checkForEvents() {
        try {
            for (const system of this.gameEngine.userSystems) {
                const events = await this.detectSystemEvents(system);
                if (events.length > 0) {
                    this.showEvents(system, events);
                }
            }
        } catch (error) {
            console.error('Error verificando eventos:', error);
        }
    }

    // 8. NUEVO: Detectar eventos en sistema
    async detectSystemEvents(system) {
        const events = [];
        
        // Verificar cada planeta en el sistema
        for (const planet of system.celestialBodies?.planets || []) {
            // Evento: Cometa
            if (this.shouldGenerateCometEvent(planet)) {
                events.push({
                    type: 'comet',
                    planet: planet.name,
                    message: `☄️ ¡Cometa detectado acercándose a ${planet.name}! Posible impacto inminente.`,
                    severity: 'high'
                });
            }
            
            // Evento: Terremoto
            if (this.shouldGenerateEarthquakeEvent(planet)) {
                events.push({
                    type: 'earthquake',
                    planet: planet.name,
                    message: `🌋 ¡Terremoto masivo en ${planet.name}! Daños significativos reportados.`,
                    severity: 'medium'
                });
            }
            
            // Evento: Radiación
            if (this.shouldGenerateRadiationEvent(planet, system)) {
                events.push({
                    type: 'radiation',
                    planet: planet.name,
                    message: `☢️ ¡Pico de radiación en ${planet.name}! Peligro para la población.`,
                    severity: 'high'
                });
            }
            
            // Evento: Crisis de recursos
            if (this.shouldGenerateResourceCrisis(planet)) {
                events.push({
                    type: 'resource_crisis',
                    planet: planet.name,
                    message: `⛽ Crisis de recursos en ${planet.name}! Reservas críticamente bajas.`,
                    severity: 'medium'
                });
            }
        }
        
        // Evento: Agujero negro cercano
        if (this.shouldGenerateBlackHoleEvent(system)) {
            events.push({
                type: 'black_hole',
                system: system.basicInfo.name,
                message: `🕳️ ¡Agujero negro detectado cerca de ${system.basicInfo.name}! Campo gravitacional afectando órbitas.`,
                severity: 'critical'
            });
        }
        
        // Evento: Supernova cercana
        if (this.shouldGenerateSupernovaEvent(system)) {
            events.push({
                type: 'supernova',
                system: system.basicInfo.name,
                message: `💥 ¡Supernova detectada en sector cercano! Radiación gamma en camino.`,
                severity: 'critical'
            });
        }
        
        return events;
    }

    // 9. NUEVO: Mostrar eventos
    showEvents(system, events) {
        events.forEach(event => {
            // Mostrar notificación
            this.showNotification(event.message, this.getEventSeverityColor(event.severity));
            
            // Mostrar modal de evento crítico
            if (event.severity === 'critical') {
                this.showCriticalEventModal(system, event);
            }
        });
    }

    // 10. NUEVO: Mostrar modal de evento crítico
    showCriticalEventModal(system, event) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #ff6b6b, #c44569); color: white;">
                <div class="modal-header">
                    <h2>🚨 ALERTA CRÍTICA</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="event-alert">
                        <div class="event-icon" style="font-size: 3rem; text-align: center; margin: 20px 0;">
                            ${this.getEventIcon(event.type)}
                        </div>
                        <h3 style="text-align: center; margin-bottom: 20px;">${event.message}</h3>
                        <div class="event-details">
                            <p><strong>Sistema:</strong> ${system.basicInfo.name}</p>
                            ${event.planet ? `<p><strong>Planeta afectado:</strong> ${event.planet}</p>` : ''}
                            <p><strong>Severidad:</strong> ${event.severity.toUpperCase()}</p>
                        </div>
                        <div class="event-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                            <button class="btn-primary" onclick="this.closest('.modal').remove()">
                                📡 Monitorear
                            </button>
                            <button class="btn-warning" onclick="window.gameEngine.uiManager.centerOnSystem('${system.id}')">
                                🎯 Ir al Sistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // 11. NUEVO: Helper - Obtener icono de evento
    getEventIcon(eventType) {
        const icons = {
            'comet': '☄️',
            'earthquake': '🌋',
            'radiation': '☢️',
            'resource_crisis': '⛽',
            'black_hole': '🕳️',
            'supernova': '💥'
        };
        return icons[eventType] || '⚠️';
    }

    // 12. NUEVO: Helper - Obtener color de severidad
    getEventSeverityColor(severity) {
        const colors = {
            'low': 'info',
            'medium': 'warning',
            'high': 'error',
            'critical': 'error'
        };
        return colors[severity] || 'info';
    }

    // 13. NUEVO: Generadores de eventos (lógica simplificada)
    shouldGenerateCometEvent(planet) {
        return Math.random() < 0.02; // 2% de probabilidad
    }

    shouldGenerateEarthquakeEvent(planet) {
        return planet.type === 'terrestre' && Math.random() < 0.03;
    }

    shouldGenerateRadiationEvent(planet, system) {
        const star = system.physics?.primaryStar;
        return star?.type === 'gigante_azul' && Math.random() < 0.04;
    }

    shouldGenerateResourceCrisis(planet) {
        return planet.civilization && Math.random() < 0.05;
    }

    shouldGenerateBlackHoleEvent(system) {
        return Math.random() < 0.01; // 1% de probabilidad
    }

    shouldGenerateSupernovaEvent(system) {
        return Math.random() < 0.005; // 0.5% de probabilidad
    }

    // 14. Explorar área actual - MEJORADO
    async exploreCurrentArea() {
        if (!this.gameEngine.currentUser) {
            this.showLoginPrompt();
            return;
        }

        try {
            this.showLoading('🔭 Explorando área...');
            
            // Usar el método del GameEngine para explorar
            const discoveredSystems = await this.gameEngine.exploreCurrentArea();
            
            if (discoveredSystems && discoveredSystems.length > 0) {
                this.showNotification(
                    `🎉 ¡Descubriste ${discoveredSystems.length} nuevo(s) sistema(s)!`, 
                    'success'
                );
                
                this.showDiscoveryResults(discoveredSystems);
            } else {
                this.showNotification('🔍 No se encontraron nuevos sistemas en esta área', 'info');
            }
            
        } catch (error) {
            console.error('❌ Error explorando área:', error);
            this.showNotification(`❌ Error explorando: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 15. Mostrar resultados de descubrimiento
    showDiscoveryResults(systems) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>🎉 ¡Nuevos Descubrimientos!</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="discovery-results">
                        <p>Has descubierto <strong>${systems.length}</strong> nuevo(s) sistema(s):</p>
                        <div class="discovered-systems">
                            ${systems.map(system => `
                                <div class="discovered-system">
                                    <div class="system-badge">⭐</div>
                                    <div class="system-info">
                                        <strong>${system.basicInfo?.name || 'Sistema Desconocido'}</strong>
                                        <div class="system-details">
                                            <span>${(system.publicInfo?.starType || 'enana_amarilla').replace('_', ' ')}</span>
                                            <span>•</span>
                                            <span>${system.publicInfo?.planetCount || 0} planetas</span>
                                            <span>•</span>
                                            <span>Creado por: ${system.ownership?.ownerName || 'Usuario'}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="discovery-stats">
                            <div class="stat">
                                <span class="stat-label">Total descubiertos:</span>
                                <span class="stat-value">${systems.length}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Puntos de exploración:</span>
                                <span class="stat-value">+${systems.length * 10}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // 16. Mostrar modal de búsqueda
    showSearchModal() {
        if (!this.gameEngine.currentUser) {
            this.showLoginPrompt();
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>🔍 Buscar Sistemas</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="search-section">
                        <div class="form-group">
                            <label>Buscar por nombre o tipo:</label>
                            <input type="text" id="searchQuery" placeholder="Ej: Sol, enana roja, etc.">
                        </div>
                        
                        <div class="filters-section">
                            <h3>Filtros</h3>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Tipo de estrella:</label>
                                    <select id="filterStarType">
                                        <option value="">Cualquier tipo</option>
                                        <option value="enana_amarilla">Enana Amarilla</option>
                                        <option value="enana_roja">Enana Roja</option>
                                        <option value="gigante_azul">Gigante Azul</option>
                                        <option value="gigante_roja">Gigante Roja</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Mínimo de planetas:</label>
                                    <input type="number" id="filterMinPlanets" min="1" max="15" value="1">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Mostrar:</label>
                                <div class="checkbox-group">
                                    <label>
                                        <input type="checkbox" id="filterMySystems" checked> Mis sistemas
                                    </label>
                                    <label>
                                        <input type="checkbox" id="filterExplored" checked> Sistemas explorados
                                    </label>
                                    <label>
                                        <input type="checkbox" id="filterUnexplored" checked> Sistemas sin explorar
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <button id="performSearch" class="btn-primary" style="width: 100%; margin-top: 15px;">
                            🔍 Buscar Sistemas
                        </button>
                    </div>
                    
                    <div id="searchResults" class="search-results" style="margin-top: 20px; display: none;">
                        <h3>Resultados de la búsqueda</h3>
                        <div id="resultsList" class="results-list"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupSearchListeners(modal);
    }

    // 17. Configurar listeners de búsqueda
    setupSearchListeners(modal) {
        modal.querySelector('#performSearch').addEventListener('click', async () => {
            await this.performSearch(modal);
        });

        // Buscar al presionar Enter
        modal.querySelector('#searchQuery').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.performSearch(modal);
            }
        });
    }

    // 18. Realizar búsqueda - MEJORADO
    async performSearch(modal) {
        try {
            this.showLoading('Buscando sistemas...');
            
            const query = modal.querySelector('#searchQuery').value.toLowerCase();
            const starType = modal.querySelector('#filterStarType').value;
            const minPlanets = parseInt(modal.querySelector('#filterMinPlanets').value) || 1;
            const showMySystems = modal.querySelector('#filterMySystems').checked;
            const showExplored = modal.querySelector('#filterExplored').checked;
            const showUnexplored = modal.querySelector('#filterUnexplored').checked;
            
            // Combinar todos los sistemas disponibles
            const allSystems = [...this.gameEngine.userSystems, ...(this.gameEngine.explorableSystems || [])];
            
            console.log('🔍 Sistemas disponibles para búsqueda:', {
                userSystems: this.gameEngine.userSystems.length,
                explorableSystems: this.gameEngine.explorableSystems?.length || 0,
                total: allSystems.length
            });
            
            let results = allSystems.filter(system => {
                // Filtro por nombre/tipo
                const matchesQuery = !query || 
                    system.basicInfo?.name?.toLowerCase().includes(query) ||
                    system.publicInfo?.starType?.includes(query);
                
                // Filtro por tipo de estrella
                const matchesStarType = !starType || system.publicInfo?.starType === starType;
                
                // Filtro por número de planetas
                const matchesMinPlanets = (system.publicInfo?.planetCount || 0) >= minPlanets;
                
                // Filtro por estado
                const systemStatus = this.getSystemStatus(system);
                const matchesStatus = 
                    (showMySystems && systemStatus === 'Tu sistema') ||
                    (showExplored && systemStatus === 'Explorado') ||
                    (showUnexplored && systemStatus === 'No explorado');
                
                return matchesQuery && matchesStarType && matchesMinPlanets && matchesStatus;
            });
            
            console.log('🔍 Resultados de búsqueda:', results.length);
            
            this.displaySearchResults(modal, results);
            
        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            this.showNotification(`Error buscando: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 19. Mostrar resultados de búsqueda
    displaySearchResults(modal, results) {
        const resultsContainer = modal.querySelector('#resultsList');
        const resultsSection = modal.querySelector('#searchResults');
        
        resultsSection.style.display = 'block';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>🔍 No se encontraron sistemas que coincidan con tu búsqueda.</p>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
                        Tip: Intenta con diferentes filtros o crea nuevos sistemas.
                    </p>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = results.map(system => `
            <div class="search-result-item" data-system-id="${system.id}">
                <div class="result-header">
                    <h4>${system.basicInfo?.name || 'Sistema Sin Nombre'}</h4>
                    <span class="result-distance">${this.calculateDistance(system)} UA</span>
                </div>
                <div class="result-details">
                    <div class="detail">
                        <span class="label">Estrella:</span>
                        <span class="value">${(system.publicInfo?.starType || 'enana_amarilla').replace('_', ' ')}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Planetas:</span>
                        <span class="value">${system.publicInfo?.planetCount || 0}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Creador:</span>
                        <span class="value">${system.ownership?.ownerName || 'Desconocido'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Estado:</span>
                        <span class="value ${this.getSystemStatusClass(system)}">${this.getSystemStatus(system)}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-small btn-primary" onclick="window.gameEngine.uiManager.centerOnSystem('${system.id}')">
                        🎯 Centrar
                    </button>
                    <button class="btn-small btn-secondary" onclick="window.gameEngine.uiManager.showSystemInfoFromId('${system.id}')">
                        ℹ️ Info
                    </button>
                    ${this.getSystemStatus(system) === 'No explorado' ? `
                        <button class="btn-small btn-success" onclick="window.gameEngine.uiManager.exploreSystem('${system.id}')">
                            🔍 Explorar
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 20. Centrar en sistema - MEJORADO
    async centerOnSystem(systemId) {
        try {
            // Buscar el sistema en todos los sistemas cargados
            const allSystems = [...this.gameEngine.userSystems, ...(this.gameEngine.explorableSystems || [])];
            const system = allSystems.find(s => s.id === systemId);
            
            if (system && system.basicInfo?.coordinates) {
                this.gameEngine.galaxyRenderer.centerOn(
                    system.basicInfo.coordinates.x,
                    system.basicInfo.coordinates.y
                );
                this.hideCurrentModal();
                this.showNotification(`🎯 Centrado en ${system.basicInfo.name}`, 'success');
                
                // Debug: mostrar coordenadas
                console.log('📍 Coordenadas del sistema:', system.basicInfo.coordinates);
            } else {
                console.error('❌ Sistema no encontrado:', systemId);
                this.showNotification('Sistema no encontrado o sin coordenadas', 'error');
            }
        } catch (error) {
            console.error('❌ Error centrando sistema:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // 21. Mostrar info de sistema por ID
    async showSystemInfoFromId(systemId) {
        try {
            const allSystems = [...this.gameEngine.userSystems, ...(this.gameEngine.explorableSystems || [])];
            const system = allSystems.find(s => s.id === systemId);
            
            if (system) {
                this.showSystemInfo(system);
            } else {
                this.showNotification('Sistema no encontrado', 'error');
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // 22. Explorar sistema específico - CORREGIDO
    async exploreSystem(systemId) {
        try {
            this.showLoading('Explorando sistema...');
            
            // Verificar que el servicio de Firebase existe
            if (!this.gameEngine.firebaseService || !this.gameEngine.firebaseService.addDiscovererToSystem) {
                throw new Error('Servicio de Firebase no disponible');
            }
            
            const success = await this.gameEngine.firebaseService.addDiscovererToSystem(
                systemId, 
                this.gameEngine.currentUser.uid
            );
            
            if (success) {
                this.showNotification('✅ ¡Sistema explorado!', 'success');
                this.hideModal('systemInfoModal');
                
                // Actualizar estadísticas
                await this.updateExplorationStats();
                
                // Recargar sistemas explorables
                if (this.gameEngine.loadAllSystems) {
                    await this.gameEngine.loadAllSystems();
                }
            } else {
                this.showNotification('❌ No se pudo explorar el sistema', 'error');
            }
        } catch (error) {
            console.error('❌ Error explorando sistema:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // ... (resto de métodos se mantienen igual, pero con mejor manejo de errores)

    // 23. Iniciar actualización de estadísticas
    async startStatsUpdate() {
        // Actualizar estadísticas cada 30 segundos
        setInterval(async () => {
            if (this.gameEngine.currentUser) {
                await this.updateExplorationStats();
            }
        }, 30000);
        
        // Actualizar inmediatamente si hay usuario
        if (this.gameEngine.currentUser) {
            await this.updateExplorationStats();
        }
    }

    // 24. Actualizar estadísticas de exploración
    async updateExplorationStats() {
        try {
            this.explorationStats = await this.gameEngine.getExplorationStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // 25. Actualizar display de estadísticas
    updateStatsDisplay() {
        if (!this.explorationStats) return;
        
        const stats = this.explorationStats;
        const playerInfo = document.querySelector('.player-info');
        
        if (!playerInfo) return;
        
        // Agregar o actualizar elemento de estadísticas
        let statsElement = document.getElementById('explorationStats');
        if (!statsElement) {
            statsElement = document.createElement('div');
            statsElement.id = 'explorationStats';
            statsElement.className = 'exploration-stats';
            playerInfo.appendChild(statsElement);
        }
        
        statsElement.innerHTML = `
            <div class="info-row">
                <span class="text-gray-300">Rango:</span>
                <span class="font-bold text-purple-400">${stats.discoveryRank || 'Novato'}</span>
            </div>
            <div class="info-row">
                <span class="text-gray-300">Explorado:</span>
                <span class="font-bold text-green-400">${stats.userDiscovered || 0}/${stats.totalSystems || 0}</span>
            </div>
            <div class="info-row">
                <span class="text-gray-300">Progreso:</span>
                <span class="font-bold text-blue-400">${(stats.explorationPercentage || 0).toFixed(1)}%</span>
            </div>
            <div class="info-row">
                <span class="text-gray-300">Creados:</span>
                <span class="font-bold text-yellow-400">${this.gameEngine.userSystems?.length || 0}</span>
            </div>
        `;
    }

    // 26. Helper - Calcular distancia
    calculateDistance(system) {
        const centerX = 25000, centerY = 25000;
        const coords = system.basicInfo?.coordinates || { x: centerX, y: centerY };
        const distance = Math.sqrt(
            Math.pow(coords.x - centerX, 2) +
            Math.pow(coords.y - centerY, 2)
        );
        return Math.floor(distance / 1000);
    }

    // 27. Helper - Obtener estado del sistema
    getSystemStatus(system) {
        const currentUser = this.gameEngine.currentUser;
        if (!currentUser) return 'No explorado';
        
        if (system.ownership?.ownerId === currentUser.uid) return 'Tu sistema';
        if (system.discovery?.discoverers?.includes(currentUser.uid)) return 'Explorado';
        return 'No explorado';
    }

    // 28. Helper - Obtener clase de estado
    getSystemStatusClass(system) {
        const status = this.getSystemStatus(system);
        switch (status) {
            case 'Tu sistema': return 'status-owned';
            case 'Explorado': return 'status-explored';
            default: return 'status-unexplored';
        }
    }

    // ... (resto de métodos de creación de sistemas, login, etc. se mantienen igual)

    // 29. Mostrar notificación
    showNotification(message, type = 'info') {
        try {
            // Crear elemento de notificación
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;

            // Estilos para la notificación
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.getNotificationColor(type)};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            `;

            document.body.appendChild(notification);

            // Auto-eliminar después de 5 segundos
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);

            // Cerrar al hacer click
            notification.querySelector('.notification-close').addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        } catch (error) {
            console.error('Error mostrando notificación:', error);
        }
    }

    // 30. Obtener color de notificación
    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    // 31. Mostrar carga
    showLoading(message = 'Cargando...') {
        console.log('Loading:', message);
        // Podrías implementar un spinner aquí
    }

    // 32. Ocultar carga
    hideLoading() {
        console.log('Loading complete');
    }
}

// Hacer disponible globalmente
window.UIManager = UIManager;
