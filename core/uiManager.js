class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentModal = null;
        this.explorationStats = null;
        
        this.init();
    }

    // 1. Inicialización
    init() {
        this.setupEventListeners();
        this.updateAuthState(false);
        this.addExplorationUI();
        this.startStatsUpdate();
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

    // 3. Agregar UI de exploración
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

    // 4. Explorar área actual - CORREGIDO
    async exploreCurrentArea() {
        if (!this.gameEngine.currentUser) {
            this.showLoginPrompt();
            return;
        }

        try {
            this.showLoading('🔭 Explorando área...');
            
            // Obtener viewport actual del renderizador
            const viewport = this.gameEngine.galaxyRenderer.getCurrentViewport();
            console.log('📍 Explorando viewport:', viewport);
            
            // Buscar sistemas en el área visible
            const allSystems = [...this.gameEngine.userSystems, ...this.gameEngine.explorableSystems];
            const systemsInViewport = allSystems.filter(system => {
                const coords = system.basicInfo?.coordinates;
                if (!coords) return false;
                
                const distance = Math.sqrt(
                    Math.pow(coords.x - viewport.centerX, 2) +
                    Math.pow(coords.y - viewport.centerY, 2)
                );
                
                return distance <= viewport.radius;
            });

            console.log('📍 Sistemas en viewport:', systemsInViewport.length);

            // Filtrar sistemas no descubiertos por el usuario actual
            const undiscoveredSystems = systemsInViewport.filter(system => {
                return !system.discovery?.discoverers?.includes(this.gameEngine.currentUser.uid);
            });

            console.log('📍 Sistemas no descubiertos:', undiscoveredSystems.length);

            if (undiscoveredSystems.length > 0) {
                // Marcar sistemas como descubiertos
                const discoveryPromises = undiscoveredSystems.map(system => 
                    this.gameEngine.firebaseService.addDiscovererToSystem(system.id, this.gameEngine.currentUser.uid)
                );
                
                await Promise.all(discoveryPromises);
                
                this.showNotification(
                    `🎉 ¡Descubriste ${undiscoveredSystems.length} nuevo(s) sistema(s)!`, 
                    'success'
                );
                
                // Mostrar información de los sistemas descubiertos
                this.showDiscoveryResults(undiscoveredSystems);
                
                // Actualizar estadísticas
                await this.updateExplorationStats();
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

    // 5. Mostrar resultados de descubrimiento
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

    // 6. Mostrar modal de búsqueda
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

    // 7. Configurar listeners de búsqueda
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

    // 8. Realizar búsqueda - MEJORADO
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
            const allSystems = [...this.gameEngine.userSystems, ...this.gameEngine.explorableSystems];
            
            let results = allSystems.filter(system => {
                // Filtro por nombre/tipo
                const matchesQuery = !query || 
                    system.basicInfo?.name?.toLowerCase().includes(query) ||
                    system.publicInfo?.starType?.includes(query);
                
                // Filtro por tipo de estrella
                const matchesStarType = !starType || system.publicInfo?.starType === starType;
                
                // Filtro por número de planetas
                const matchesMinPlanets = system.publicInfo?.planetCount >= minPlanets;
                
                // Filtro por estado
                const systemStatus = this.getSystemStatus(system);
                const matchesStatus = 
                    (showMySystems && systemStatus === 'Tu sistema') ||
                    (showExplored && systemStatus === 'Explorado') ||
                    (showUnexplored && systemStatus === 'No explorado');
                
                return matchesQuery && matchesStarType && matchesMinPlanets && matchesStatus;
            });
            
            this.displaySearchResults(modal, results);
            
        } catch (error) {
            this.showNotification(`Error buscando: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 9. Mostrar resultados de búsqueda
    displaySearchResults(modal, results) {
        const resultsContainer = modal.querySelector('#resultsList');
        const resultsSection = modal.querySelector('#searchResults');
        
        resultsSection.style.display = 'block';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>🔍 No se encontraron sistemas que coincidan con tu búsqueda.</p>
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

    // 10. Centrar en sistema
    async centerOnSystem(systemId) {
        try {
            // Buscar el sistema en todos los sistemas cargados
            const allSystems = [...this.gameEngine.userSystems, ...this.gameEngine.explorableSystems];
            const system = allSystems.find(s => s.id === systemId);
            
            if (system && system.basicInfo?.coordinates) {
                this.gameEngine.galaxyRenderer.centerOn(
                    system.basicInfo.coordinates.x,
                    system.basicInfo.coordinates.y
                );
                this.hideCurrentModal();
                this.showNotification(`🎯 Centrado en ${system.basicInfo.name}`, 'success');
            } else {
                this.showNotification('Sistema no encontrado o sin coordenadas', 'error');
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // 11. Mostrar info de sistema por ID
    async showSystemInfoFromId(systemId) {
        try {
            const allSystems = [...this.gameEngine.userSystems, ...this.gameEngine.explorableSystems];
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

    // 12. Iniciar actualización de estadísticas
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

    // 13. Actualizar estadísticas de exploración
    async updateExplorationStats() {
        try {
            this.explorationStats = await this.gameEngine.getExplorationStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
        }
    }

    // 14. Actualizar display de estadísticas
    updateStatsDisplay() {
        if (!this.explorationStats) return;
        
        const stats = this.explorationStats;
        const playerInfo = document.querySelector('.player-info');
        
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
                <span class="font-bold text-yellow-400">${this.gameEngine.userSystems.length}</span>
            </div>
        `;
    }

    // 15. Helper - Calcular distancia
    calculateDistance(system) {
        // Distancia simplificada desde el centro de la galaxia
        const centerX = 25000, centerY = 25000;
        const coords = system.basicInfo?.coordinates || { x: centerX, y: centerY };
        const distance = Math.sqrt(
            Math.pow(coords.x - centerX, 2) +
            Math.pow(coords.y - centerY, 2)
        );
        return Math.floor(distance / 1000);
    }

    // 16. Helper - Obtener estado del sistema
    getSystemStatus(system) {
        const currentUser = this.gameEngine.currentUser;
        if (!currentUser) return 'No explorado';
        
        if (system.ownership?.ownerId === currentUser.uid) return 'Tu sistema';
        if (system.discovery?.discoverers?.includes(currentUser.uid)) return 'Explorado';
        return 'No explorado';
    }

    // 17. Helper - Obtener clase de estado
    getSystemStatusClass(system) {
        const status = this.getSystemStatus(system);
        switch (status) {
            case 'Tu sistema': return 'status-owned';
            case 'Explorado': return 'status-explored';
            default: return 'status-unexplored';
        }
    }

    // 18. Mostrar modal de crear sistema
    showCreateSystemModal() {
        if (!this.gameEngine.currentUser) {
            this.showLoginPrompt();
            return;
        }

        const modal = document.getElementById('createSystemModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = this.generateSystemCreationForm();
        this.showModal('createSystemModal');
        
        this.setupSystemFormListeners();
    }

    // 19. Generar formulario de creación
    generateSystemCreationForm() {
        return `
            <form id="systemCreationForm">
                <div class="form-group">
                    <label for="systemName">Nombre del Sistema:</label>
                    <input type="text" id="systemName" required 
                           placeholder="Ej: Sistema Solar Prime" maxlength="20">
                </div>

                <div class="section">
                    <h3>⭐ Configuración Estelar</h3>
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="starType">Tipo de Estrella:</label>
                            <select id="starType" required>
                                <option value="enana_amarilla">Enana Amarilla</option>
                                <option value="enana_roja">Enana Roja</option>
                                <option value="gigante_azul">Gigante Azul</option>
                                <option value="gigante_roja">Gigante Roja</option>
                                <option value="enana_blanca">Enana Blanca</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="starMass">Masa Estelar (Sol = 1):</label>
                            <input type="number" id="starMass" min="0.1" max="100" 
                                   step="0.1" value="1.0" required>
                        </div>
                        <div class="form-group">
                            <label for="starAge">Edad (millones de años):</label>
                            <input type="number" id="starAge" min="1" max="15000" 
                                   value="4500" required>
                        </div>
                        <div class="form-group">
                            <label for="multipleSystem">Sistema Múltiple:</label>
                            <select id="multipleSystem">
                                <option value="single">Simple</option>
                                <option value="binary">Binario</option>
                                <option value="trinary">Triple</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>🪐 Configuración Planetaria</h3>
                    <div class="grid-2">
                        <div class="form-group">
                            <label for="planetsCount">Número de Planetas:</label>
                            <input type="number" id="planetsCount" min="1" max="15" 
                                   value="4" required>
                        </div>
                        <div class="form-group">
                            <label for="habitableZone">Zona Habitable:</label>
                            <select id="habitableZone">
                                <option value="optimal">Zona Óptima</option>
                                <option value="inner">Borde Interior</option>
                                <option value="outer">Borde Exterior</option>
                                <option value="none">Fuera de Zona</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>⚖️ Leyes de Civilización</h3>
                    <div class="form-group">
                        <label for="governmentType">Tipo de Gobierno:</label>
                        <select id="governmentType">
                            <option value="democratica">Democracia Galáctica</option>
                            <option value="tecnocratica">Tecnocracia</option>
                            <option value="imperio">Imperio Estelar</option>
                            <option value="colectiva">Conciencia Colectiva</option>
                            <option value="corporativista">Estado Corporativo</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <button type="submit" class="btn-primary" style="width: 100%">
                        🚀 Crear Sistema Estelar
                    </button>
                </div>
            </form>
        `;
    }

    // 20. Configurar listeners del formulario
    setupSystemFormListeners() {
        const form = document.getElementById('systemCreationForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSystemCreation();
        });

        document.getElementById('starType').addEventListener('change', () => {
            this.updateStarInfo();
        });

        document.getElementById('starMass').addEventListener('input', () => {
            this.updateStarInfo();
        });
    }

    // 21. Actualizar información de la estrella
    updateStarInfo() {
        const starType = document.getElementById('starType').value;
        const starMass = parseFloat(document.getElementById('starMass').value);
        
        const starInfo = STAR_TYPES?.[starType];
        if (!starInfo) return;

        // Calcular luminosidad y tiempo de vida
        const luminosity = StellarEvolution?.calculateLuminosity?.(starMass, 4500) || starMass;
        const lifespan = StellarEvolution?.calculateMainSequenceLifetime?.(starMass) || (1e10 / starMass);
        
        console.log(`Estrella: ${starType}, Luminosidad: ${luminosity.toFixed(2)} L☉, Vida: ${(lifespan/1e9).toFixed(1)} Ga`);
    }

    // 22. Manejar creación de sistema
    async handleSystemCreation() {
        const formData = this.getSystemFormData();
        
        if (!formData) {
            this.showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        try {
            this.showLoading('Creando sistema...');
            
            await this.gameEngine.createStarSystem(formData);
            
            this.hideModal('createSystemModal');
            this.showNotification('✅ Sistema creado exitosamente!', 'success');
            
            // Actualizar estadísticas después de crear sistema
            await this.updateExplorationStats();
            
        } catch (error) {
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 23. Obtener datos del formulario
    getSystemFormData() {
        try {
            return {
                name: document.getElementById('systemName').value.trim(),
                starType: document.getElementById('starType').value,
                starMass: parseFloat(document.getElementById('starMass').value),
                starAge: parseFloat(document.getElementById('starAge').value),
                multipleSystem: document.getElementById('multipleSystem').value,
                planetsCount: parseInt(document.getElementById('planetsCount').value),
                habitableZone: document.getElementById('habitableZone').value,
                governmentType: document.getElementById('governmentType').value
            };
        } catch (error) {
            console.error('Error obteniendo datos del formulario:', error);
            return null;
        }
    }

    // 24. Mostrar información del sistema
    showSystemInfo(system) {
        if (!system) {
            this.hideModal('systemInfoModal');
            return;
        }

        const modal = document.getElementById('systemInfoModal');
        const content = document.getElementById('systemInfoContent');
        
        content.innerHTML = this.generateSystemInfoContent(system);
        this.showModal('systemInfoModal');
    }

    // 25. Generar contenido de información del sistema
    generateSystemInfoContent(system) {
        const star = system.physics?.primaryStar || { type: 'enana_amarilla', mass: 1, age: 4500, luminosity: 1 };
        const planets = system.celestialBodies?.planets || [];
        const currentUser = this.gameEngine.currentUser;
        const isOwned = system.ownership?.ownerId === currentUser?.uid;
        const isDiscovered = system.discovery?.discoverers?.includes(currentUser?.uid);
        
        return `
            <div class="system-info">
                <div class="system-header">
                    <h2>${system.basicInfo?.name || 'Sistema Sin Nombre'}</h2>
                    <div class="system-badges">
                        ${isOwned ? '<span class="badge badge-owned">★ Tu Sistema</span>' : ''}
                        ${isDiscovered && !isOwned ? '<span class="badge badge-explored">🔍 Explorado</span>' : ''}
                        ${!isDiscovered && !isOwned ? '<span class="badge badge-unexplored">❓ Sin explorar</span>' : ''}
                    </div>
                </div>

                <div class="info-section">
                    <h3>⭐ Información Estelar</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Tipo:</span>
                            <span class="value">${star.type.replace('_', ' ')}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Masa:</span>
                            <span class="value">${star.mass} M☉</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Edad:</span>
                            <span class="value">${(star.age / 1e6).toFixed(0)} millones de años</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Luminosidad:</span>
                            <span class="value">${star.luminosity?.toFixed(2) || '1.00'} L☉</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>📊 Información del Sistema</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Creador:</span>
                            <span class="value">${system.ownership?.ownerName || 'Desconocido'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Fecha creación:</span>
                            <span class="value">${system.basicInfo?.creationDate ? new Date(system.basicInfo.creationDate).toLocaleDateString() : 'Desconocida'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Coordenadas:</span>
                            <span class="value">X: ${system.basicInfo?.coordinates?.x || 0}, Y: ${system.basicInfo?.coordinates?.y || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>📊 Descubrimiento</h3>
                    <div class="discovery-info">
                        <div class="discovery-stat">
                            <span class="label">Descubridores:</span>
                            <span class="value">${system.discovery?.discoverers?.length || 0}</span>
                        </div>
                        <div class="discovery-stat">
                            <span class="label">Fecha descubrimiento:</span>
                            <span class="value">${system.discovery?.discoveryDate ? new Date(system.discovery.discoveryDate).toLocaleDateString() : 'No descubierto'}</span>
                        </div>
                        <div class="discovery-stat">
                            <span class="label">Estado:</span>
                            <span class="value">${system.discovery?.status || 'Sin explorar'}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>🪐 Planetas del Sistema (${planets.length})</h3>
                    ${planets.length > 0 ? 
                        planets.map(planet => this.generatePlanetInfo(planet)).join('') : 
                        '<p>No hay planetas en este sistema.</p>'
                    }
                </div>

                <div class="action-buttons">
                    <button onclick="window.gameEngine.uiManager.centerOnSystem('${system.id}')" 
                            class="btn-primary">
                        🎯 Centrar en Sistema
                    </button>
                    ${!isDiscovered && !isOwned ? `
                        <button onclick="window.gameEngine.uiManager.exploreSystem('${system.id}')" 
                                class="btn-secondary">
                            🔍 Explorar Sistema
                        </button>
                    ` : ''}
                    ${isOwned ? `
                        <button onclick="window.gameEngine.uiManager.manageSystem('${system.id}')" 
                                class="btn-warning">
                            ⚙️ Gestionar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 26. Generar información del planeta
    generatePlanetInfo(planet) {
        const civ = planet.civilization;
        
        return `
            <div class="planet-card">
                <div class="planet-header">
                    <h4>${planet.name || 'Planeta Sin Nombre'}</h4>
                    <span class="planet-type">${planet.type || 'Terrestre'}</span>
                </div>
                <div class="planet-details">
                    <div class="planet-stat">
                        <span>Distancia:</span>
                        <span>${(planet.orbit?.semiMajorAxis || 1).toFixed(2)} AU</span>
                    </div>
                    <div class="planet-stat">
                        <span>Habitabilidad:</span>
                        <span>${((planet.conditions?.habitability || 0) * 100).toFixed(0)}%</span>
                    </div>
                    ${civ ? `
                        <div class="planet-stat">
                            <span>Población:</span>
                            <span>${this.formatPopulation(civ.population || 0)}</span>
                        </div>
                        <div class="planet-stat">
                            <span>Kardashev:</span>
                            <span>${(civ.kardashev?.level || 0).toFixed(2)}</span>
                        </div>
                        <div class="planet-stat">
                            <span>Gobierno:</span>
                            <span>${(civ.government?.type || 'democratica').replace('_', ' ')}</span>
                        </div>
                    ` : `
                        <div class="planet-stat">
                            <span>Estado:</span>
                            <span>No habitado</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // 27. Formatear población
    formatPopulation(population) {
        if (population >= 1e9) return (population / 1e9).toFixed(1) + 'B';
        if (population >= 1e6) return (population / 1e6).toFixed(1) + 'M';
        if (population >= 1e3) return (population / 1e3).toFixed(1) + 'K';
        return population.toString();
    }

    // 28. Explorar sistema específico - CORREGIDO
    async exploreSystem(systemId) {
        try {
            this.showLoading('Explorando sistema...');
            
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
                await this.gameEngine.loadAllSystems();
            } else {
                this.showNotification('❌ Error explorando el sistema', 'error');
            }
        } catch (error) {
            console.error('❌ Error explorando sistema:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 29. Gestionar sistema (para el propietario)
    async manageSystem(systemId) {
        this.showNotification('⚙️ Funcionalidad de gestión en desarrollo', 'info');
    }

    // ... (resto de métodos de autenticación y UI se mantienen igual)

    // 30. Mostrar modal de inicio de sesión
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'loginModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>🔐 Iniciar Sesión</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="login-options">
                        <button id="googleLoginBtn" class="btn-primary" style="width: 100%; margin-bottom: 10px;">
                            🚀 Continuar con Google
                        </button>
                        <button id="anonymousLoginBtn" class="btn-secondary" style="width: 100%; margin-bottom: 10px;">
                            👤 Jugar como Invitado
                        </button>
                        <div class="login-divider">
                            <span>o</span>
                        </div>
                        <div class="email-login">
                            <div class="form-group">
                                <label>Email:</label>
                                <input type="email" id="loginEmail" placeholder="tu@email.com">
                            </div>
                            <div class="form-group">
                                <label>Contraseña:</label>
                                <input type="password" id="loginPassword" placeholder="••••••••">
                            </div>
                            <button id="emailLoginBtn" class="btn-primary" style="width: 100%; margin-bottom: 10px;">
                                📧 Iniciar con Email
                            </button>
                        </div>
                        <div class="login-footer">
                            <p>¿No tienes cuenta? <a href="#" id="showRegister">Regístrate aquí</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupLoginListeners(modal);
    }

    // 31. Configurar listeners del login
    setupLoginListeners(modal) {
        // Login con Google
        modal.querySelector('#googleLoginBtn').addEventListener('click', async () => {
            try {
                await this.gameEngine.authService.signInWithGoogle();
                modal.remove();
                this.showNotification('¡Sesión iniciada con Google!', 'success');
            } catch (error) {
                this.showNotification(`Error: ${error.message}`, 'error');
            }
        });

        // Login anónimo
        modal.querySelector('#anonymousLoginBtn').addEventListener('click', async () => {
            try {
                await this.gameEngine.authService.signInAnonymously();
                modal.remove();
                this.showNotification('¡Sesión anónima iniciada!', 'success');
            } catch (error) {
                this.showNotification(`Error: ${error.message}`, 'error');
            }
        });

        // Login con email
        modal.querySelector('#emailLoginBtn').addEventListener('click', async () => {
            const email = modal.querySelector('#loginEmail').value;
            const password = modal.querySelector('#loginPassword').value;
            
            if (!email || !password) {
                this.showNotification('Por favor ingresa email y contraseña', 'error');
                return;
            }

            try {
                await this.gameEngine.authService.signInWithEmail(email, password);
                modal.remove();
                this.showNotification('¡Sesión iniciada!', 'success');
            } catch (error) {
                this.showNotification(`Error: ${error.message}`, 'error');
            }
        });

        // Mostrar registro
        modal.querySelector('#showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal(modal);
        });

        // Cerrar modal con ESC
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // 32. Mostrar modal de registro
    showRegisterModal(loginModal) {
        loginModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'registerModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>👤 Crear Cuenta</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nombre de usuario:</label>
                        <input type="text" id="registerUsername" placeholder="Tu nombre en el juego">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="registerEmail" placeholder="tu@email.com">
                    </div>
                    <div class="form-group">
                        <label>Contraseña:</label>
                        <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres">
                    </div>
                    <div class="form-group">
                        <label>Confirmar contraseña:</label>
                        <input type="password" id="registerPasswordConfirm" placeholder="Repite la contraseña">
                    </div>
                    <button id="registerBtn" class="btn-primary" style="width: 100%; margin-bottom: 10px;">
                        🚀 Crear Cuenta
                    </button>
                    <div class="login-footer">
                        <p>¿Ya tienes cuenta? <a href="#" id="showLogin">Inicia sesión aquí</a></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Configurar registro
        modal.querySelector('#registerBtn').addEventListener('click', async () => {
            const username = modal.querySelector('#registerUsername').value;
            const email = modal.querySelector('#registerEmail').value;
            const password = modal.querySelector('#registerPassword').value;
            const passwordConfirm = modal.querySelector('#registerPasswordConfirm').value;

            if (!username || !email || !password) {
                this.showNotification('Por favor completa todos los campos', 'error');
                return;
            }

            if (password !== passwordConfirm) {
                this.showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            if (password.length < 6) {
                this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            try {
                await this.gameEngine.authService.createUserWithEmail(email, password, username);
                modal.remove();
                this.showNotification('¡Cuenta creada exitosamente!', 'success');
            } catch (error) {
                this.showNotification(`Error: ${error.message}`, 'error');
            }
        });

        // Volver al login
        modal.querySelector('#showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            this.showLoginModal();
        });
    }

    // 33. Mostrar prompt de login
    showLoginPrompt() {
        this.showNotification('🔐 Por favor inicia sesión para explorar', 'info');
        this.showLoginModal();
    }

    // 34. Mostrar modal
    showModal(modalId) {
        this.hideCurrentModal();
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.currentModal = modalId;
        }
    }

    // 35. Ocultar modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            if (this.currentModal === modalId) {
                this.currentModal = null;
            }
        }
    }

    // 36. Ocultar modal actual
    hideCurrentModal() {
        if (this.currentModal) {
            this.hideModal(this.currentModal);
        }
    }

    // 37. Mostrar notificación
    showNotification(message, type = 'info') {
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
    }

    // 38. Obtener color de notificación
    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    // 39. Actualizar estado de autenticación
    updateAuthState(isAuthenticated, user = null) {
        const loginBtn = document.getElementById('loginBtn');
        
        if (isAuthenticated && user) {
            loginBtn.innerHTML = '👤 ' + (user.displayName || user.email || 'Usuario');
            loginBtn.title = 'Cerrar sesión';
            loginBtn.onclick = () => this.gameEngine.authService.signOut();
            // Actualizar stats al iniciar sesión
            this.updateExplorationStats();
        } else {
            loginBtn.innerHTML = '🔐 Iniciar Sesión';
            loginBtn.title = 'Iniciar sesión';
            loginBtn.onclick = () => this.showLoginModal();
        }
    }

    // 40. Actualizar año galáctico
    updateGalacticYear(year) {
        const yearElement = document.getElementById('galacticYear');
        if (yearElement) {
            yearElement.textContent = year;
        }
    }

    // 41. Actualizar lista de sistemas
    updateSystemsList(systems) {
        const worldsElement = document.getElementById('playerWorlds');
        if (worldsElement) {
            worldsElement.textContent = systems.length;
        }
    }

    // 42. Mostrar carga
    showLoading(message = 'Cargando...') {
        // Implementación básica - podrías usar un spinner
        console.log('Loading:', message);
    }

    // 43. Ocultar carga
    hideLoading() {
        console.log('Loading complete');
    }
}

// Hacer disponible globalmente
window.UIManager = UIManager;
