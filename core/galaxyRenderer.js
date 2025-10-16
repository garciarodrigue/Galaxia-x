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

        // Buscar sistema clickeado
        for (const system of this.systems) {
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

    // 9. Bucle de animación
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    // 10. Dibujar escena
    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Dibujar estrellas de fondo
        this.drawBackgroundStars();

        // Dibujar sistemas estelares
        this.drawStarSystems();

        // Dibujar sistema seleccionado
        if (this.selectedSystem) {
            this.drawSelectedSystem();
        }
    }

    // 11. Dibujar estrellas de fondo
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

    // 12. Dibujar sistemas estelares
    drawStarSystems() {
        this.systems.forEach(system => {
            const x = (system.basicInfo.coordinates.x - this.offsetX) * this.scale;
            const y = (system.basicInfo.coordinates.y - this.offsetY) * this.scale;
            
            if (x < -50 || y < -50 || x > this.width + 50 || y > this.height + 50) {
                return;
            }

            // Color basado en tipo de estrella
            const starType = system.physics.primaryStar.type;
            const color = STAR_TYPES[starType]?.color || '#FFFFFF';
            
            // Tamaño basado en masa estelar
            const size = Math.max(2, Math.min(10, system.physics.primaryStar.mass * 5 * this.scale));
            
            // Dibujar estrella
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Efecto de brillo para sistemas del usuario
            if (system.ownership.ownerId === window.gameEngine.firebaseService.currentUser?.uid) {
                this.ctx.strokeStyle = '#3B82F6';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(x, y, size + 5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            // Nombre del sistema (solo con zoom suficiente)
            if (this.scale > 0.5) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `${10 * this.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(system.basicInfo.name, x, y + size + 15);
            }
        });
    }

    // 13. Dibujar sistema seleccionado
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
            this.ctx.fillStyle = '#10B981';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(system.basicInfo.name, x, y - 25);
            
            this.ctx.fillStyle = '#9CA3AF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `Tipo: ${system.physics.primaryStar.type.replace('_', ' ')}`,
                x, y - 10
            );
            this.ctx.fillText(
                `Planetas: ${system.celestialBodies.planets.length}`,
                x, y + 35
            );
        }
    }

    // 14. Centrar en coordenadas
    centerOn(x, y) {
        this.offsetX = x - this.width / 2 / this.scale;
        this.offsetY = y - this.height / 2 / this.scale;
    }

    // 15. Centrar galaxia
    centerGalaxy() {
        this.offsetX = 25000 - this.width / 2 / this.scale;
        this.offsetY = 25000 - this.height / 2 / this.scale;
        this.scale = 0.3;
    }

    // 16. Callback cuando se selecciona un sistema
    onSystemSelected(system) {
        if (window.gameEngine && window.gameEngine.uiManager) {
            window.gameEngine.uiManager.showSystemInfo(system);
        }
    }
}
