class PhysicalConstants {
    // Constantes fundamentales (CODATA 2018)
    static G = 6.67430e-11;          // m³/kg/s²
    static C = 299792458;            // m/s
    static H = 6.62607015e-34;       // J·s
    static K_B = 1.380649e-23;       // J/K
    static SIGMA = 5.670374419e-8;   // W/m²/K⁴ (Stefan-Boltzmann)
    static N_A = 6.02214076e23;      // mol⁻¹
    
    // Constantes astronómicas
    static AU = 1.495978707e11;      // metros
    static PARSEC = 3.085677581e16;  // metros
    static LIGHT_YEAR = 9.460730473e15; // metros
    static SOLAR_MASS = 1.98847e30;  // kg
    static SOLAR_RADIUS = 6.957e8;   // metros
    static SOLAR_LUMINOSITY = 3.828e26; // W
    
    // Constantes planetarias (Tierra)
    static EARTH_MASS = 5.9722e24;   // kg
    static EARTH_RADIUS = 6.371e6;   // metros
    static EARTH_DENSITY = 5514;     // kg/m³
    static EARTH_ALBEDO = 0.306;     // Bond albedo
    
    // Escalas de tiempo
    static YEAR_SECONDS = 31557600;  // año sideral
    static GALACTIC_YEAR = 2.25e8;   // años
    
    // Factores de conversión
    static toEarthMasses(kg) { return kg / this.EARTH_MASS; }
    static toSolarMasses(kg) { return kg / this.SOLAR_MASS; }
    static toAU(meters) { return meters / this.AU; }
    static toMeters(au) { return au * this.AU; }
}

// Tipos de estrellas y sus propiedades
const STAR_TYPES = {
    'enana_amarilla': {
        massRange: [0.8, 1.2],
        temperature: [5300, 6000],
        luminosity: [0.6, 1.5],
        lifespan: 1e10,
        color: '#FDB813'
    },
    'enana_roja': {
        massRange: [0.08, 0.45],
        temperature: [2400, 3700],
        luminosity: [0.0001, 0.08],
        lifespan: 1e12,
        color: '#FF4422'
    },
    'gigante_azul': {
        massRange: [2.5, 90],
        temperature: [10000, 50000],
        luminosity: [100, 1000000],
        lifespan: 1e7,
        color: '#4499FF'
    },
    'gigante_roja': {
        massRange: [0.8, 8],
        temperature: [3500, 5000],
        luminosity: [100, 1000],
        lifespan: 1e9,
        color: '#FF6B35'
    },
    'enana_blanca': {
        massRange: [0.17, 1.4],
        temperature: [8000, 40000],
        luminosity: [0.0001, 100],
        lifespan: 1e13,
        color: '#FFFFFF'
    }
};

// Tipos de planetas
const PLANET_TYPES = {
    'rocoso': {
        density: [3000, 5500],
        sizeRange: [0.3, 2.0],
        habitability: [0.1, 0.9]
    },
    'gaseoso': {
        density: [600, 2000],
        sizeRange: [3.0, 20.0],
        habitability: [0.0, 0.1]
    },
    'helado': {
        density: [1000, 2000],
        sizeRange: [0.5, 4.0],
        habitability: [0.0, 0.3]
    },
    'oceánico': {
        density: [2000, 4000],
        sizeRange: [0.8, 3.0],
        habitability: [0.5, 0.95]
    }
};
