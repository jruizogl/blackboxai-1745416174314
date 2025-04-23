// Configuración para el Dashboard de Licencias Microsoft
// Este archivo centraliza las configuraciones y permite usar variables de entorno en Vercel

// Función para obtener variables de entorno en Vercel o valores por defecto
function getConfig() {
    // Para entorno de desarrollo local
    if (typeof window !== 'undefined') {
        // Valores por defecto para desarrollo local
        return {
            supabaseUrl: window.SUPABASE_URL || 'https://yoggndevscherwfxmijg.supabase.co',
            supabaseKey: window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI',
            demoModeKey: 'ms_licenses_demo_data',
            version: '1.0.0'
        };
    }
    
    // Para Vercel con variables de entorno
    return {
        supabaseUrl: process.env.SUPABASE_URL || 'https://yoggndevscherwfxmijg.supabase.co',
        supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI',
        demoModeKey: 'ms_licenses_demo_data',
        version: '1.0.0'
    };
}

// Crear la configuración
const config = getConfig();

// Para uso en el navegador
window.appConfig = config;
