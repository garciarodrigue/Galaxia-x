// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDoWsywnEGqZvCEQVlArfCIZolIPFGBYps",
    authDomain: "space-37875.firebaseapp.com",
    projectId: "space-37875",
    storageBucket: "space-37875.firebasestorage.app",
    messagingSenderId: "188596270605",
    appId: "1:188596270605:web:0d5f10831ceac567d70744"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios
const db = firebase.firestore();
const auth = firebase.auth();

console.log('Firebase inicializado correctamente');
