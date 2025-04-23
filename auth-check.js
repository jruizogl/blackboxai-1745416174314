// Script para verificar autenticación antes de permitir acceso a páginas protegidas

// Constantes - aseguramos que no hay conflicto con otros archivos
// al usar el mismo nombre para la misma finalidad
const AUTH_TOKEN_KEY = 'ms_licenses_auth_token';
const USER_DATA_KEY = 'ms_licenses_user_data';
const DEMO_MODE_KEY = 'ms_licenses_auth_demo';

// Páginas que no requieren autenticación
const PUBLIC_PAGES = ['login.html'];

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Comprobar si estamos en una página pública
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (PUBLIC_PAGES.includes(currentPage)) {
        // Estamos en una página pública, no necesitamos verificar autenticación
        return;
    }

    // Verificar si hay token de autenticación
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    
    if (!authToken || !userData) {
        // No hay token o datos de usuario, redirigir a login
        redirectToLogin();
        return;
    }
    
    try {
        // Verificar que los datos del usuario son válidos
        const user = JSON.parse(userData);
        
        // Actualizar elementos de la interfaz con información del usuario
        updateUIWithUserInfo(user);
        
        // Verificar permisos específicos por página
        const hasAccess = checkPagePermissions(user, currentPage);
        if (!hasAccess) {
            // Si no tiene acceso, redirigir a dashboard
            window.location.href = 'index.html';
            return;
        }
        
        // Configurar el botón de logout si existe
        setupLogoutButton();
        
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Si hay error al parsear los datos del usuario, redirigir a login
        redirectToLogin();
    }
});

// Redirigir a página de login
function redirectToLogin() {
    // Limpiar datos de autenticación
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Guardar página actual para redirigir después del login
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!PUBLIC_PAGES.includes(currentPage)) {
        sessionStorage.setItem('redirect_after_login', currentPage);
    }
    
    // Redirigir a login
    window.location.href = 'login.html';
}

// Actualizar elementos de la interfaz con información del usuario
function updateUIWithUserInfo(user) {
    // Agregar nombre de usuario en la interfaz si existe el elemento
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.full_name || user.email;
    }
    
    // Agregar rol en la interfaz si existe el elemento
    const userRoleElement = document.getElementById('userRole');
    if (userRoleElement) {
        userRoleElement.textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';
    }
    
    // Mostrar/ocultar elementos según el rol del usuario
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    adminOnlyElements.forEach(element => {
        if (user.role === 'admin') {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

// Verificar permisos específicos por página
function checkPagePermissions(user, currentPage) {
    // Páginas que requieren ser administrador
    const adminPages = ['user-management.html'];
    
    // Verificar si el usuario tiene permiso para acceder a la página actual
    if (adminPages.includes(currentPage) && user.role !== 'admin') {
        // Usuario no tiene permisos, redirigir a dashboard
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Configurar el botón de logout
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Obtener datos del usuario para log
                const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY));
                
                // Limpiar datos de autenticación
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(USER_DATA_KEY);
                
                // Log de evento de cierre de sesión
                if (userData) {
                    // Si estamos en modo demo, guardar en localStorage
                    if (localStorage.getItem(DEMO_MODE_KEY)) {
                        const auditLogs = JSON.parse(localStorage.getItem('ms_license_audit_logs') || '[]');
                        
                        auditLogs.push({
                            id: crypto.randomUUID(),
                            user_id: userData.id,
                            action: 'logout',
                            resource_type: 'user',
                            resource_id: userData.id,
                            details: {
                                email: userData.email,
                                method: 'manual',
                                ip_address: '127.0.0.1',
                                user_agent: navigator.userAgent
                            },
                            created_at: new Date().toISOString()
                        });
                        
                        localStorage.setItem('ms_license_audit_logs', JSON.stringify(auditLogs));
                    } else {
                        // En modo real, enviar a Supabase
                        const SUPABASE_URL = window.appConfig?.supabaseUrl || 'https://yoggndevscherwfxmijg.supabase.co';
                        const SUPABASE_KEY = window.appConfig?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI';
                        
                        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                        
                        await supabase
                            .from('ms_audit_log')
                            .insert({
                                user_id: userData.id,
                                action: 'logout',
                                resource_type: 'user',
                                resource_id: userData.id,
                                details: {
                                    email: userData.email,
                                    method: 'manual',
                                    ip_address: '(not collected in browser)',
                                    user_agent: navigator.userAgent
                                }
                            });
                    }
                }
                
                // Redirigir a login
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                // En caso de error, redirigir a login de todas formas
                window.location.href = 'login.html';
            }
        });
    }
}
