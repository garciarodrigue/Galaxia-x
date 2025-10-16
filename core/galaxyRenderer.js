class GalaxyRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.stars = [];
        this.systems = [];
        this.explorableSystems = [];
        this.selectedSystem = null;
        
        this.offsetX = 25000;
        this.offsetY = 25000;
        this.scale = 0.3;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        this.init();
    }

    // 1. Inicialización
    init() {
        this.generateBackgroundStars();
        this.setupEventListeners();
        this.animate();
    }

    // 2. Generar estrellas de fondo
    generateBackgroundStars() {
        const numStars = 5000;
        
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * 50000,
                y: Math.random() * 50000,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }

    // 3. Configurar event listeners
    setupEventListeners() {
        // Zoom con rueda del mouse
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        });

        // Arrastrar para mover
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            this.handleDrag(e);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Click en sistemas
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });

        // Redimensionar ventana
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // 4. Manejar zoom
    handleZoom(e) {
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);

        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const worldX = mouseX / this.scale + this.offsetX;
        const worldY = mouseY / this.scale + this.offsetY;

        this.scale *= zoom;
        this.scale = Math.max(0.05, Math.min(5, this.scale)); // Limitar zoom
        
        this.offsetX = worldX - mouseX / this.scale;
        this.offsetY = worldY - mouseY / this.scale;
    }

    // 5. Manejar arrastre
    handleDrag(e) {
        const dx = (e.clientX - this.lastX) / this.scale;
        const dy = (e.clientY - this.lastY) / this.scale;
        
        this.offsetX -= dx;
        this.offsetY -= dy;
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    // 6. Manejar click
    handleClick(e) {
        if (this.isDragging) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Buscar sistema clickeado (primero en sistemas del usuario, luego explorables)
        const allSystems = [...this.systems, ...this.explorableSystems];
        
        for (const system of allSystems) {
            const x = (system.basicInfo.coordinates.x - this.offsetX) * this.scale;
            const y = (system.basicInfo.coordinates.y - this.offsetY) * this.scale;
            
            const distance = MathUtils.distance2D(mouseX, mouseY, x, y);
            const clickRadius = Math.max(8, 15 * this.scale);
            
            if (distance < clickRadius) {
                this.selectedSystem = system;
                this.onSystemSelected(system);
                return;
            }
        }
        
        this.selectedSystem = null;
        this.onSystemSelected(null);
    }

    // 7. Manejar redimensionado
    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    // 8. Actualizar sistemas
    updateSystems(systems) {
        this.systems = systems;
    }

    // 9. Actualizar sistemas explorables
    updateExplorableSystems(systems) {
        this.explorableSystems = systems;
    }

    // 10. Bucle de animación
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    // 11. Dibujar escena
    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Dibujar estrellas de fondo
        this.drawBackgroundStars();

        // Dibujar sistemas explorables (grises - no descubiertos)
        this.drawExplorableSystems();

        // Dibujar sistemas del usuario y descubiertos
        this.drawStarSystems();

        // Dibujar sistema seleccionado
        if (this.selectedSystem) {
            this.drawSelectedSystem();
        }

        // Dibujar UI de exploración
        this.drawExplorationUI();
    }

    // 12. Dibujar estrellas de fondo
    drawBackgroundStars() {
        const time = Date.now() * 0.001;
        
        this.stars.forEach(star => {
            const x = (star.x - this.offsetX) * this.scale;
            const y = (star.y - this.offsetY) * this.scale;
            
            if (x < -20 || y < -20 || x > this.width + 20 || y > this.height + 20) {
                return;
            }
            
            const twinkle = star.brightness + Math.sin(time * star.twinkleSpeed) * 0.2;
            const alpha = Math.max(0.1, Math.min(1, twinkle));
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(x, y, star.size, star.size);
        });
    }

    // 13. Dibujar sistemas explorables (no descubiertos)
    drawExplorableSystems() {
        this.explorableSystems.forEach(system => {
            const x = (system.basicInfo.coordinates.x - this.offsetX) * this.scale;
            const y = (system.basicInfo.coordinates.y - this.offsetY) * this.scale;
            
            if (x < -50 || y < -50 || x > this.width + 50 || y > this.height + 50) {
                return;
            }

            // Solo mostrar sistemas no descubiertos por el usuario
            const isDiscovered = system.discovery?.discoverers?.includes(
                window.gameEngine?.firebaseService?.currentUser?.uid
            );
            
            if (isDiscovered) return;

            // Sistema no descubierto - punto gris tenue
            const size = Math.max(1, 3 * this.scale);
            this.ctx.fillStyle = 'rgba(107, 114, 128, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 14. Dibujar sistemas estelares (del usuario y descubiertos)
    drawStarSystems() {
        const allSystems = [...this.systems, ...this.explorableSystems.filter(sys => 
            sys.discovery?.discoverers?.includes(window.gameEngine?.firebaseService?.currentUser?.uid)
        )];

        allSystems.forEach(system => {
            const x = (system.basicInfo.coordinates.x - this.offsetX) * this.scale;
            const y = (system.basicInfo.coordinates.y - this.offsetY) * this.scale;
            
            if (x < -50 || y < -50 || x > this.width + 50 || y > this.height + 50) {
                return;
            }

            // COLOR BASADO EN PROPIEDAD Y DESCUBRIMIENTO
            const color = this.getSystemColor(system);
            const size = this.getSystemSize(system);
            
            // Dibujar sistema
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // INDICADORES VISUALES
            this.drawSystemIndicators(system, x, y);
            
            // NOMBRE (condicional)
            if (this.shouldShowSystemName(system)) {
                this.drawSystemName(system, x, y, size);
            }
        });
    }

    // 15. Obtener color del sistema
    getSystemColor(system) {
        const currentUser = window.gameEngine?.firebaseService?.currentUser;
        if (!currentUser) return '#6B7280';

        const isOwned = system.ownership.ownerId === currentUser.uid;
        const isDiscovered = system.discovery?.discoverers?.includes(currentUser.uid);
        
        if (isOwned) return '#3B82F6'; // Azul - tus sistemas
        if (isDiscovered) return '#10B981'; // Verde - sistemas explorados
        return '#6B7280'; // Gris - sistemas no descubiertos
    }

    // 16. Obtener tamaño del sistema
    getSystemSize(system) {
        const baseSize = Math.max(2, Math.min(10, system.physics.primaryStar.mass * 5 * this.scale));
        
        // Sistemas con civilizaciones son más grandes
        const hasCivilization = system.celestialBodies?.planets?.some(p => p.civilization);
        if (hasCivilization) {
            return baseSize * 1.5;
        }
        
        return baseSize;
    }

    // 17. Dibujar indicadores del sistema
    drawSystemIndicators(system, x, y) {
        const currentUser = window.gameEngine?.firebaseService?.currentUser;
        if (!currentUser) return;

        const isOwned = system.ownership.ownerId === currentUser.uid;
        const isDiscovered = system.discovery?.discoverers?.includes(currentUser.uid);
        const hasCivilization = system.celestialBodies?.planets?.some(p => p.civilization);
        
        // Borde de propiedad
        if (isOwned) {
            this.ctx.strokeStyle = '#3B82F6';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        // Borde de descubrimiento
        else if (isDiscovered) {
            this.ctx.strokeStyle = '#10B981';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Indicador de civilización
        if (hasCivilization) {
            this.ctx.fillStyle = '#F59E0B';
            this.ctx.beginPath();
            this.ctx.arc(x + 8, y - 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Indicador de sistema popular (muchos descubridores)
        const popularity = system.discovery?.discoverers?.length || 0;
        if (popularity > 5) {
            this.ctx.fillStyle = '#EC4899';
            this.ctx.beginPath();
            this.ctx.arc(x - 8, y - 8, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 18. Decidir si mostrar nombre del sistema
    shouldShowSystemName(system) {
        const currentUser = window.gameEngine?.firebaseService?.currentUser;
        if (!currentUser) return false;

        const isOwned = system.ownership.ownerId === currentUser.uid;
        const isDiscovered = system.discovery?.discoverers?.includes(currentUser.uid);
        
        // Mostrar nombre si: es tuyo, está descubierto, o el zoom es suficiente
        return isOwned || isDiscovered || this.scale > 0.8;
    }

    // 19. Dibujar nombre del sistema
    drawSystemName(system, x, y, size) {
        const currentUser = window.gameEngine?.firebaseService?.currentUser;
        const isOwned = system.ownership.ownerId === currentUser?.uid;
        
        this.ctx.fillStyle = isOwned ? '#3B82F6' : '#FFFFFF';
        this.ctx.font = `${10 * this.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(system.basicInfo.name, x, y + size + 15);

        // Información adicional con buen zoom
        if (this.scale > 1.2) {
            this.ctx.fillStyle = '#9CA3AF';
            this.ctx.font = `${8 * this.scale}px Arial`;
            this.ctx.fillText(
                `${system.publicInfo.planetCount} planetas • ${system.publicInfo.starType.replace('_', ' ')}`,
                x, y + size + 28
            );
        }
    }

    // 20. Dibujar sistema seleccionado
    drawSelectedSystem() {
        const system = this.selectedSystem;
        const x = (system.basicInfo.coordinates.x - this.offsetX) * this.scale;
        const y = (system.basicInfo.coordinates.y - this.offsetY) * this.scale;
        
        // Círculo de selección
        this.ctx.strokeStyle = '#10B981';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.stroke();

        // Información del sistema
        if (this.scale > 0.3) {
            this.drawSystemTooltip(system, x, y);
        }
    }

    // 21. Dibujar tooltip del sistema
    drawSystemTooltip(system, x, y) {
        const currentUser = window.gameEngine?.firebaseService?.currentUser;
        const isOwned = system.ownership.ownerId === currentUser?.uid;
        const isDiscovered = system.discovery?.discoverers?.includes(currentUser?.uid);
        
        this.ctx.fillStyle = '#10B981';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(system.basicInfo.name, x, y - 25);
        
        this.ctx.fillStyle = '#9CA3AF';
        this.ctx.font = '12px Arial';
        
        if (isOwned) {
            this.ctx.fillText('★ Tu Sistema', x, y - 10);
        } else if (isDiscovered) {
            const discoverers = system.discovery.discoverers.length;
            this.ctx.fillText(`👥 ${discoverers} explorador${discoverers > 1 ? 'es' : ''}`, x, y - 10);
        } else {
            this.ctx.fillText('🔍 Sin explorar', x, y - 10);
        }
        
        this.ctx.fillText(
            `Planetas: ${system.publicInfo.planetCount} | ${system.publicInfo.starType.replace('_', ' ')}`,
            x, y + 35
        );
    }

    // 22. Dibujar UI de exploración
    drawExplorationUI() {
        const explorableCount = this.explorableSystems.filter(system => 
            !system.discovery?.discoverers?.includes(window.gameEngine?.firebaseService?.currentUser?.uid)
        ).length;

        // Contador de sistemas explorables en el área visible
        if (explorableCount > 0 && this.scale < 1) {
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
            this.ctx.fillRect(10, 10, 200, 40);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`🔍 ${explorableCount} sistemas por explorar`, 20, 30);
            this.ctx.fillText('Haz clic en "Explorar Área"', 20, 45);
        }
    }

    // 23. Centrar en coordenadas
    centerOn(x, y) {
        this.offsetX = x - this.width / 2 / this.scale;
        this.offsetY = y - this.height / 2 / this.scale;
    }

    // 24. Centrar galaxia
    centerGalaxy() {
        this.offsetX = 25000 - this.width / 2 / this.scale;
        this.offsetY = 25000 - this.height / 2 / this.scale;
        this.scale = 0.3;
    }

    // 25. Obtener posición actual del viewport
    getCurrentViewport() {
        const centerX = this.offsetX + (this.width / 2) / this.scale;
        const centerY = this.offsetY + (this.height / 2) / this.scale;
        const radius = Math.max(this.width, this.height) / this.scale / 2;
        
        return { centerX, centerY, radius };
    }

    // 26. Callback cuando se selecciona un sistema
    onSystemSelected(system) {
        if (window.gameEngine && window.gameEngine.uiManager) {
            window.gameEngine.uiManager.showSystemInfo(system);
        }
    }
}
