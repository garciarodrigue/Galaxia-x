// Archivo principal - Punto de entrada de la aplicación
class GalaxiaX {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando Galaxia X...');
            
            // Esperar a que DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                await this.initializeApp();
            }
            
        } catch (error) {
            console.error('Error fatal inicializando Galaxia X:', error);
            this.showFatalError(error);
        }
    }

    async initializeApp() {
        // Mostrar pantalla de carga
        this.showLoadingScreen();
        
        // Inicializar motor del juego
        this.gameEngine = new GameEngine();
        
        // Hacer disponible globalmente para debugging
        window.gameEngine = this.gameEngine;
        
        this.isInitialized = true;
        console.log('✅ Galaxia X inicializada correctamente');
    }

    showLoadingScreen() {
        // La pantalla de carga ya está en el HTML
        // Podemos agregar animaciones o mensajes aquí
        const loadingText = document.querySelector('.loading-content p');
        if (loadingText) {
            const messages = [
                'Cargando universo...',
                'Generando estrellas...',
                'Calculando órbitas...',
                'Preparando civilizaciones...'
            ];
            
            let currentMessage = 0;
            setInterval(() => {
                loadingText.textContent = messages[currentMessage];
                currentMessage = (currentMessage + 1) % messages.length;
            }, 2000);
        }
    }

    showFatalError(error) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-content">
                    <h2>❌ Error Crítico</h2>
                    <p>No se pudo inicializar Galaxia X</p>
                    <p class="error-details">${error.message}</p>
                    <button onclick="window.location.reload()">Reintentar</button>
                </div>
            `;
            
            // Agregar estilos para el error
            const style = document.createElement('style');
            style.textContent = `
                .error-content {
                    text-align: center;
                    color: white;
                }
                .error-content h2 {
                    color: #EF4444;
                    margin-bottom: 20px;
                }
                .error-details {
                    color: #9CA3AF;
                    font-size: 14px;
                    margin: 10px 0;
                }
                .error-content button {
                    background: #3B82F6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Método para limpiar recursos
    destroy() {
        if (this.gameEngine) {
            this.gameEngine.destroy();
        }
        this.isInitialized = false;
    }
}

// Inicializar la aplicación cuando se carga la página
const galaxiaX = new GalaxiaX();

// Manejar cierre de página
window.addEventListener('beforeunload', () => {
    if (galaxiaX.isInitialized) {
        galaxiaX.destroy();
    }
});

// Exportar para uso global (opcional)
window.GalaxiaX = GalaxiaX;
