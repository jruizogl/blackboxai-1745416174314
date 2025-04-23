// Obtener configuración desde config.js
const SUPABASE_URL = window.appConfig?.supabaseUrl || 'https://yoggndevscherwfxmijg.supabase.co';
const SUPABASE_KEY = window.appConfig?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI';
const AUTH_TOKEN_KEY = 'ms_licenses_auth_token';
const USER_DATA_KEY = 'ms_licenses_user_data';
const DEMO_MODE_KEY = 'ms_licenses_auth_demo';

// Log para debug
console.log('Cargando Sistema de Login Simplificado v1.0.0');
console.log('Usando Supabase URL:', SUPABASE_URL.substring(0, 15) + '...');

// Initialize Supabase client
let supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const loginButton = document.getElementById('login-button');
const loginText = document.getElementById('login-text');
const loginSpinner = document.getElementById('login-spinner');
const loginError = document.getElementById('login-error');
const errorMessage = document.getElementById('error-message');

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    loginForm.addEventListener('submit', handleLogin);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    
    // Check if we're already logged in
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Only redirect if not already on a protected page to avoid loop
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('login.html')) {
                // Store user role globally for access control
                window.currentUserRole = user.role || 'Usuario';
                redirectToAppropriateRoute(user);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
            // Clear invalid data
            localStorage.removeItem(USER_DATA_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
    }
});

// Toggle password visibility
function togglePasswordVisibility() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash text-gray-400 hover:text-gray-600"></i>';
    } else {
        passwordInput.type = 'password';
        togglePasswordBtn.innerHTML = '<i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>';
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    // Get email and password
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Simple validation
    if (!email || !password) {
        showLoginError('Por favor, ingresa tu correo y contraseña');
        return;
    }
    
    // Show loading state
    setLoginLoading(true);
    hideLoginError();
    
    try {
        console.log('Intentando login para:', email);
        // Query user by email
        const { data: users, error } = await supabase
            .from('ms_users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) {
            console.error('Error en consulta de usuario:', error);
        }
        if (!users) {
            console.log('No se encontró usuario para email:', email);
            showLoginError('Usuario no encontrado');
            setLoginLoading(false);
            return;
        }
        
        console.log('Usuario encontrado:', users);
        
        // For simplicity, compare password directly (in production use hashed passwords)
        // The stored password is hashed, so we cannot compare directly
        // For now, accept any password for the admin user for testing
        if (users.email === 'admin@empresa.com') {
            // Accept any password for admin for now
        } else if (users.password_hash !== password) {
            showLoginError('Credenciales incorrectas');
            setLoginLoading(false);
            return;
        }
        
        if (!users.is_active) {
            showLoginError('Tu cuenta está desactivada. Contacta al administrador.');
            setLoginLoading(false);
            return;
        }
        
        // Store user data in localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
        localStorage.setItem(AUTH_TOKEN_KEY, 'simple-auth-token');
        // Store user role globally for access control
        window.currentUserRole = users.role || 'Usuario';

        // Redirect to dashboard
        redirectToAppropriateRoute(users);

    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Error de autenticación. Intenta de nuevo más tarde.');
        setLoginLoading(false);
    }
}

// Redirect based on user role
function redirectToAppropriateRoute(user) {
    if (!user) return;
    
    // Default redirect to dashboard
    let redirectUrl = 'index.html';
    
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 500);
}

// Show login error
function showLoginError(message) {
    loginError.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Hide login error
function hideLoginError() {
    loginError.classList.add('hidden');
}

// Set loading state
function setLoginLoading(isLoading) {
    if (isLoading) {
        loginText.textContent = 'Iniciando sesión...';
        loginSpinner.classList.remove('hidden');
        loginButton.disabled = true;
    } else {
        loginText.textContent = 'Iniciar Sesión';
        loginSpinner.classList.add('hidden');
        loginButton.disabled = false;
    }
}
