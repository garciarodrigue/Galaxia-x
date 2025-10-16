class AuthService {
    constructor() {
        this.auth = firebase.auth();
        this.firebaseService = new FirebaseService();
    }

    // 1. Iniciar sesión con Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await this.auth.signInWithPopup(provider);
            console.log('Inicio de sesión exitoso con Google:', result.user);
            
            // Actualizar el nombre de usuario si es necesario
            if (result.user) {
                await this.firebaseService.updateUserProfile({
                    username: result.user.displayName || `Explorador_${result.user.uid.substring(0, 8)}`,
                    email: result.user.email
                });
            }
            
            return result.user;
        } catch (error) {
            console.error('Error en inicio de sesión con Google:', error);
            
            // Mensajes de error más amigables
            let errorMessage = 'Error al iniciar sesión con Google';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'El popup de Google fue cerrado. Intenta de nuevo.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Error de conexión. Verifica tu internet.';
            }
            
            throw new Error(errorMessage);
        }
    }

    // 2. Iniciar sesión anónima
    async signInAnonymously() {
        try {
            const result = await this.auth.signInAnonymously();
            console.log('Sesión anónima iniciada:', result.user);
            
            // Crear datos de usuario anónimo
            await this.firebaseService.createNewUser(result.user.uid, true);
            
            return result.user;
        } catch (error) {
            console.error('Error en sesión anónima:', error);
            throw new Error('Error al crear sesión anónima');
        }
    }

    // 3. Crear cuenta con email y contraseña
    async createUserWithEmail(email, password, username) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Actualizar perfil con nombre de usuario
            await result.user.updateProfile({
                displayName: username
            });
            
            // Enviar verificación de email
            await result.user.sendEmailVerification();
            
            console.log('Usuario creado con email:', result.user);
            
            // Crear datos de usuario en Firestore
            await this.firebaseService.createNewUser(result.user.uid, false, {
                username: username,
                email: email
            });
            
            return result.user;
        } catch (error) {
            console.error('Error creando usuario:', error);
            
            let errorMessage = 'Error al crear cuenta';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email ya está registrado';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es muy débil';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión';
                    break;
            }
            
            throw new Error(errorMessage);
        }
    }

    // 4. Iniciar sesión con email y contraseña
    async signInWithEmail(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('Inicio de sesión exitoso con email:', result.user);
            return result.user;
        } catch (error) {
            console.error('Error en inicio de sesión con email:', error);
            
            let errorMessage = 'Error al iniciar sesión';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Cuenta deshabilitada';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Error de conexión';
                    break;
            }
            
            throw new Error(errorMessage);
        }
    }

    // 5. Cerrar sesión
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('Sesión cerrada');
            this.firebaseService.cleanup();
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            throw new Error('Error al cerrar sesión');
        }
    }

    // 6. Restablecer contraseña
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            console.log('Correo de restablecimiento enviado');
            return true;
        } catch (error) {
            console.error('Error restableciendo contraseña:', error);
            
            let errorMessage = 'Error al enviar correo de restablecimiento';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No existe una cuenta con este email';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            }
            
            throw new Error(errorMessage);
        }
    }

    // 7. Obtener usuario actual
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // 8. Verificar estado de autenticación
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    // 9. Eliminar cuenta
    async deleteAccount() {
        try {
            const user = this.auth.currentUser;
            if (user) {
                // Primero eliminar datos de Firestore
                await this.firebaseService.deleteUserData(user.uid);
                // Luego eliminar cuenta de Authentication
                await user.delete();
                console.log('Cuenta eliminada');
            }
        } catch (error) {
            console.error('Error eliminando cuenta:', error);
            throw new Error('Error al eliminar cuenta');
        }
    }

    // 10. Actualizar perfil de usuario
    async updateProfile(displayName, photoURL) {
        try {
            const user = this.auth.currentUser;
            if (user) {
                await user.updateProfile({
                    displayName: displayName,
                    photoURL: photoURL
                });
                console.log('Perfil actualizado');
            }
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            throw new Error('Error al actualizar perfil');
        }
    }

    // 11. Verificar si el email está verificado
    isEmailVerified() {
        const user = this.auth.currentUser;
        return user ? user.emailVerified : false;
    }

    // 12. Reenviar verificación de email
    async resendEmailVerification() {
        try {
            const user = this.auth.currentUser;
            if (user) {
                await user.sendEmailVerification();
                console.log('Correo de verificación reenviado');
                return true;
            }
        } catch (error) {
            console.error('Error reenviando verificación:', error);
            throw new Error('Error al reenviar verificación');
        }
    }
}
