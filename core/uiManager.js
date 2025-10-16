class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentModal = null;
        
        this.init();
    }

    // 1. Inicialización
    init() {
        this.setupEventListeners();
        this.updateAuthState(false);
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

    // 3. Mostrar modal de crear sistema
    showCreateSystemModal() {
        if (!this.gameEngine.currentUser) {
            this.showLoginPrompt();
            return;
        }

        const modal = document.getElementById('createSystemModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = this.generateSystemCreationForm();
        this.showModal('createSystemModal');
        
        // Configurar event listeners del formulario
        this.setupSystemFormListeners();
    }

    // 4. Generar formulario de creación de sistema
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

    // 5. Configurar listeners del formulario
    setupSystemFormListeners() {
        const form = document.getElementById('systemCreationForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSystemCreation();
        });

        // Actualizar información en tiempo real según selecciones
        document.getElementById('starType').addEventListener('change', () => {
            this.updateStarInfo();
        });

        document.getElementById('starMass').addEventListener('input', () => {
            this.updateStarInfo();
        });
    }

    // 6. Actualizar información de la estrella
    updateStarInfo() {
        const starType = document.getElementById('starType').value;
        const starMass = parseFloat(document.getElementById('starMass').value);
        
        const starInfo = STAR_TYPES[starType];
        if (!starInfo) return;

        // Calcular luminosidad y tiempo de vida
        const luminosity = StellarEvolution.calculateLuminosity(starMass, 4500);
        const lifespan = StellarEvolution.calculateMainSequenceLifetime(starMass);
        
        // Mostrar información (podría mostrarse en un tooltip o elemento aparte)
        console.log(`Estrella: ${starType}, Luminosidad: ${luminosity.toFixed(2)} L☉, Vida: ${(lifespan/1e9).toFixed(1)} Ga`);
    }

    // 7. Manejar creación de sistema
    async handleSystemCreation() {
        const formData = this.getSystemFormData();
        
        if (!formData) {
            this.showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        try {
            // Mostrar indicador de carga
            this.showLoading('Creando sistema...');
            
            // Crear sistema
            await this.gameEngine.createStarSystem(formData);
            
            // Ocultar modal
            this.hideModal('createSystemModal');
            
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 8. Obtener datos del formulario
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

    // 9. Mostrar información del sistema
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

    // 10. Generar contenido de información del sistema
    generateSystemInfoContent(system) {
        const star = system.physics.primaryStar;
        const planets = system.celestialBodies.planets;
        
        return `
            <div class="system-info">
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
                            <span class="value">${star.luminosity.toFixed(2)} L☉</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <h3>🪐 Planetas del Sistema (${planets.length})</h3>
                    ${planets.map(planet => this.generatePlanetInfo(planet)).join('')}
                </div>

                <div class="info-section">
                    <h3>📊 Estadísticas</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Planetas habitables:</span>
                            <span class="stat-value">
                                ${planets.filter(p => p.conditions.habitability > 0.6).length}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Población total:</span>
                            <span class="stat-value">
                                ${this.formatPopulation(planets.reduce((sum, p) => 
                                    sum + (p.civilization?.population || 0), 0))}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Kardashev máximo:</span>
                            <span class="stat-value">
                                ${Math.max(...planets.map(p => 
                                    p.civilization?.kardashev.level || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 11. Generar información del planeta
    generatePlanetInfo(planet) {
        const civ = planet.civilization;
        
        return `
            <div class="planet-card">
                <div class="planet-header">
                    <h4>${planet.name}</h4>
                    <span class="planet-type">${planet.type}</span>
                </div>
                <div class="planet-details">
                    <div class="planet-stat">
                        <span>Distancia:</span>
                        <span>${planet.orbit.semiMajorAxis.toFixed(2)} AU</span>
                    </div>
                    <div class="planet-stat">
                        <span>Habitabilidad:</span>
                        <span>${(planet.conditions.habitability * 100).toFixed(0)}%</span>
                    </div>
                    ${civ ? `
                        <div class="planet-stat">
                            <span>Población:</span>
                            <span>${this.formatPopulation(civ.population)}</span>
                        </div>
                        <div class="planet-stat">
                            <span>Kardashev:</span>
                            <span>${civ.kardashev.level.toFixed(2)}</span>
                        </div>
                        <div class="planet-stat">
                            <span>Gobierno:</span>
                            <span>${civ.government.type.replace('_', ' ')}</span>
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

    // 12. Formatear población
    formatPopulation(population) {
        if (population >= 1e9) return (population / 1e9).toFixed(1) + 'B';
        if (population >= 1e6) return (population / 1e6).toFixed(1) + 'M';
        if (population >= 1e3) return (population / 1e3).toFixed(1) + 'K';
        return population.toString();
    }

    // 13. Mostrar modal de inicio de sesión COMPLETO
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

        // Configurar event listeners
        this.setupLoginListeners(modal);
    }

    // 14. Configurar listeners del login
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

    // 15. Mostrar modal de registro
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

    // 16. Mostrar prompt de inicio de sesión
    showLoginPrompt() {
        this.showNotification('Por favor inicia sesión para crear sistemas', 'warning');
        this.showLoginModal();
    }

    // 17. Mostrar modal
    showModal(modalId) {
        this.hideCurrentModal();
        
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.currentModal = modalId;
        }
    }

    // 18. Ocultar modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            if (this.currentModal === modalId) {
                this.currentModal = null;
            }
        }
    }

    // 19. Ocultar modal actual
    hideCurrentModal() {
        if (this.currentModal) {
            this.hideModal(this.currentModal);
        }
    }

    // 20. Mostrar notificación
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

    // 21. Obtener color de notificación
    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    // 22. Actualizar estado de autenticación
    updateAuthState(isAuthenticated, user = null) {
        const loginBtn = document.getElementById('loginBtn');
        
        if (isAuthenticated && user) {
            loginBtn.innerHTML = '👤 ' + (user.displayName || user.email || 'Usuario');
            loginBtn.title = 'Cerrar sesión';
            loginBtn.onclick = () => this.gameEngine.authService.signOut();
        } else {
            loginBtn.innerHTML = '🔐 Iniciar Sesión';
            loginBtn.title = 'Iniciar sesión';
            loginBtn.onclick = () => this.showLoginModal();
        }
    }

    // 23. Actualizar año galáctico
    updateGalacticYear(year) {
        const yearElement = document.getElementById('galacticYear');
        if (yearElement) {
            yearElement.textContent = year;
        }
    }

    // 24. Actualizar lista de sistemas
    updateSystemsList(systems) {
        // Actualizar contador en la UI
        const worldsElement = document.getElementById('playerWorlds');
        if (worldsElement) {
            worldsElement.textContent = systems.length;
        }
    }

    // 25. Mostrar carga
    showLoading(message = 'Cargando...') {
        // Podrías implementar un spinner o overlay de carga
        console.log('Loading:', message);
    }

    // 26. Ocultar carga
    hideLoading() {
        console.log('Loading complete');
    }
}
