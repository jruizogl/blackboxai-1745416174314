// Obtener configuración desde config.js
const SUPABASE_URL = window.appConfig?.supabaseUrl || 'https://yoggndevscherwfxmijg.supabase.co';
const SUPABASE_KEY = window.appConfig?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI';
const DEMO_MODE_KEY = window.appConfig?.demoModeKey || 'ms_licenses_demo_data';
const APP_VERSION = window.appConfig?.version || '1.0.0';

// Log para debug
console.log('Cargando Dashboard de Licencias Microsoft v' + APP_VERSION);
console.log('Usando Supabase URL:', SUPABASE_URL.substring(0, 15) + '...');

// Initialize Supabase client or use demo mode
let supabase;
let demoMode = false;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
    } else {
        throw new Error('Supabase client not available');
    }
} catch (error) {
    console.warn('Could not initialize Supabase client, using demo mode instead');
    demoMode = true;
}

// DOM Elements
const licenseTableBody = document.getElementById('licenseTableBody');
const licenseForm = document.getElementById('licenseForm');
const licenseModal = document.getElementById('licenseModal');
const deleteModal = document.getElementById('deleteModal');
const searchInput = document.getElementById('searchInput');
const totalLicensesEl = document.getElementById('totalLicenses');
const assignedLicensesEl = document.getElementById('assignedLicenses');
const availableLicensesEl = document.getElementById('availableLicenses');
const totalCostEl = document.getElementById('totalCost');
const deleteId = document.getElementById('deleteId');

// Store licenses
let licenses = [];

// Charts
let licensesChart;
let typesChart;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Set up event listeners
    document.getElementById('addLicenseButton').addEventListener('click', openAddModal);
    document.getElementById('syncButton').addEventListener('click', fetchLicenses);
    licenseForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterLicenses);

    // Fetch initial data
    await fetchLicenses();
    
    // Initialize charts
    initCharts();
    
    // Set up real-time subscription
    setupRealtimeSubscription();
});

// Generate demo data
function generateDemoData() {
    // Create demo licenses if none exist
    if (!localStorage.getItem(DEMO_MODE_KEY)) {
        const demoLicenses = [
            {
                id: crypto.randomUUID(),
                license_type: 'Office 365 Business Standard',
                username: 'usuario1@empresa.com',
                assignee: 'Juan Pérez',
                renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().split('T')[0],
                monthly_cost: 12.50,
                status: 'Activa',
                notes: 'Licencia para departamento de ventas',
                created_at: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                license_type: 'Microsoft 365 E3',
                username: 'usuario2@empresa.com',
                assignee: 'Ana Gómez',
                renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString().split('T')[0],
                monthly_cost: 32.00,
                status: 'Activa',
                notes: 'Gerencia de operaciones',
                created_at: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                license_type: 'Office 365 Business Basic',
                username: 'usuario3@empresa.com',
                assignee: 'Carlos Rodríguez',
                renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().split('T')[0],
                monthly_cost: 6.00,
                status: 'Activa',
                notes: 'Departamento de soporte',
                created_at: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                license_type: 'Office 365 Business Premium',
                username: 'usuario4@empresa.com',
                assignee: 'María García',
                renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 7)).toISOString().split('T')[0],
                monthly_cost: 22.00,
                status: 'Inactiva',
                notes: 'Departamento de marketing',
                created_at: new Date().toISOString()
            },
            {
                id: crypto.randomUUID(),
                license_type: 'Microsoft 365 E5',
                username: '',
                assignee: '',
                renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                monthly_cost: 57.00,
                status: 'Pendiente',
                notes: 'Licencia disponible para asignación',
                created_at: new Date().toISOString()
            }
        ];
        
        localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoLicenses));
        return demoLicenses;
    }
    
    // Return existing demo licenses
    return JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
}

// Fetch licenses from Supabase or demo data
async function fetchLicenses() {
    try {
        showNotification('Actualizando datos...', 'bg-blue-500');
        
        if (demoMode) {
            // Use demo data from localStorage
            licenses = generateDemoData();
            updateDashboard();
            renderLicenses();
            updateCharts();
            showNotification('Datos demo cargados correctamente', 'bg-green-500');
            return;
        }
        
        // Use Supabase
        const { data, error } = await supabase
            .from('ms_licenses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        licenses = data || [];
        updateDashboard();
        renderLicenses();
        updateCharts();
        
        showNotification('Datos actualizados correctamente', 'bg-green-500');
    } catch (error) {
        console.error('Error fetching licenses:', error);
        
        // Switch to demo mode if there's an error
        if (!demoMode) {
            demoMode = true;
            showNotification('Error de conexión. Cambiando a modo demo.', 'bg-yellow-500');
            licenses = generateDemoData();
            updateDashboard();
            renderLicenses();
            updateCharts();
        } else {
            showNotification('Error al cargar datos', 'bg-red-500');
        }
    }
}

// Create licenses table if it doesn't exist
async function createLicensesTable() {
    try {
        // Create the table through SQL RPC
        const { error } = await supabase.rpc('create_ms_licenses_table');
        
        if (error) {
            console.error('Error creating table:', error);
            showNotification('Error al crear la tabla de licencias', 'bg-red-500');
            return;
        }
        
        // Add sample data
        await addSampleData();
        await fetchLicenses();
    } catch (error) {
        console.error('Error creating table:', error);
        showNotification('Error al configurar la base de datos', 'bg-red-500');
    }
}

// Add sample license data
async function addSampleData() {
    const sampleData = [
        {
            license_type: 'Office 365 Business Standard',
            username: 'usuario1@empresa.com',
            assignee: 'Juan Pérez',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().split('T')[0],
            monthly_cost: 12.50,
            status: 'Activa',
            notes: 'Licencia para departamento de ventas'
        },
        {
            license_type: 'Microsoft 365 E3',
            username: 'usuario2@empresa.com',
            assignee: 'Ana Gómez',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString().split('T')[0],
            monthly_cost: 32.00,
            status: 'Activa',
            notes: 'Gerencia de operaciones'
        },
        {
            license_type: 'Office 365 Business Basic',
            username: 'usuario3@empresa.com',
            assignee: 'Carlos Rodríguez',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().split('T')[0],
            monthly_cost: 6.00,
            status: 'Activa',
            notes: 'Departamento de soporte'
        },
        {
            license_type: 'Office 365 Business Premium',
            username: 'usuario4@empresa.com',
            assignee: 'María García',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 7)).toISOString().split('T')[0],
            monthly_cost: 22.00,
            status: 'Inactiva',
            notes: 'Departamento de marketing'
        },
        {
            license_type: 'Microsoft 365 E5',
            username: '',
            assignee: '',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            monthly_cost: 57.00,
            status: 'Pendiente',
            notes: 'Licencia disponible para asignación'
        }
    ];

    try {
        for (const license of sampleData) {
            const { error } = await supabase.from('ms_licenses').insert(license);
            if (error) throw error;
        }
        showNotification('Datos de ejemplo añadidos', 'bg-green-500');
    } catch (error) {
        console.error('Error adding sample data:', error);
        showNotification('Error al añadir datos de ejemplo', 'bg-red-500');
    }
}

// Set up realtime subscription
function setupRealtimeSubscription() {
    if (demoMode) {
        // For demo mode, use localStorage events to simulate real-time
        window.addEventListener('storage', (e) => {
            if (e.key === DEMO_MODE_KEY) {
                fetchLicenses();
                showNotification('Datos actualizados desde otro dispositivo', 'bg-blue-500');
            }
        });
        
        // Set a demo badge in the UI
        const navbarDiv = document.querySelector('nav div.flex.justify-between');
        if (navbarDiv) {
            const demoBadge = document.createElement('span');
            demoBadge.className = 'bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs ml-3';
            demoBadge.textContent = 'MODO DEMO';
            navbarDiv.querySelector('h1').appendChild(demoBadge);
        }
        
        console.log('Demo mode real-time subscription setup (using localStorage events)');
        return;
    }
    
    // For Supabase mode, use actual real-time subscription
    try {
        const subscription = supabase
            .channel('ms_licenses_changes')
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_licenses'
            }, async () => {
                await fetchLicenses();
                showNotification('Datos actualizados desde otro dispositivo', 'bg-blue-500');
            })
            .subscribe();
        console.log('Supabase real-time subscription active');
    } catch (error) {
        console.error('Failed to setup real-time subscription:', error);
    }
}

// Update dashboard statistics
function updateDashboard() {
    const total = licenses.length;
    const assigned = licenses.filter(l => l.status === 'Activa' && l.assignee).length;
    const available = licenses.filter(l => l.status !== 'Activa' || !l.assignee).length;
    const totalCost = licenses.reduce((sum, license) => sum + (parseFloat(license.monthly_cost) || 0), 0);
    
    totalLicensesEl.textContent = total;
    assignedLicensesEl.textContent = assigned;
    availableLicensesEl.textContent = available;
    totalCostEl.textContent = `$${totalCost.toFixed(2)}`;
}

// Render licenses table
function renderLicenses(filteredLicenses = null) {
    const dataToRender = filteredLicenses || licenses;
    
    licenseTableBody.innerHTML = '';
    
    if (dataToRender.length === 0) {
        licenseTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron licencias. Agrega una nueva licencia para comenzar.
                </td>
            </tr>
        `;
        return;
    }
    
    dataToRender.forEach(license => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Format renewal date
        const renewalDate = license.renewal_date ? new Date(license.renewal_date).toLocaleDateString('es-ES') : '-';
        
        // Status badge class
        let statusClass = '';
        switch (license.status) {
            case 'Activa':
                statusClass = 'bg-green-100 text-green-800';
                break;
            case 'Inactiva':
                statusClass = 'bg-red-100 text-red-800';
                break;
            case 'Pendiente':
                statusClass = 'bg-yellow-100 text-yellow-800';
                break;
            default:
                statusClass = 'bg-gray-100 text-gray-800';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${license.license_type}</div>
                <div class="text-xs text-gray-500">${license.id.substring(0, 8)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${license.username || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${license.assignee || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${renewalDate}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">$${parseFloat(license.monthly_cost).toFixed(2)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${license.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openEditModal('${license.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="openDeleteModal('${license.id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        licenseTableBody.appendChild(row);
    });
}

// Filter licenses based on search input
function filterLicenses() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        renderLicenses();
        return;
    }
    
    const filtered = licenses.filter(license => 
        license.license_type.toLowerCase().includes(searchTerm) ||
        (license.username && license.username.toLowerCase().includes(searchTerm)) ||
        (license.assignee && license.assignee.toLowerCase().includes(searchTerm)) ||
        license.status.toLowerCase().includes(searchTerm)
    );
    
    renderLicenses(filtered);
}

// Initialize charts
function initCharts() {
    // Licenses distribution chart
    const licensesCtx = document.getElementById('licensesChart').getContext('2d');
    licensesChart = new Chart(licensesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Activas', 'Inactivas', 'Pendientes'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(234, 179, 8, 0.7)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(234, 179, 8, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // License types chart
    const typesCtx = document.getElementById('typesChart').getContext('2d');
    typesChart = new Chart(typesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Cantidad',
                data: [],
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update charts with current data
function updateCharts() {
    if (!licensesChart || !typesChart) return;
    
    // Update license status chart
    const activeCount = licenses.filter(l => l.status === 'Activa').length;
    const inactiveCount = licenses.filter(l => l.status === 'Inactiva').length;
    const pendingCount = licenses.filter(l => l.status === 'Pendiente').length;
    
    licensesChart.data.datasets[0].data = [activeCount, inactiveCount, pendingCount];
    licensesChart.update();
    
    // Update license types chart
    const typeCounts = {};
    licenses.forEach(license => {
        typeCounts[license.license_type] = (typeCounts[license.license_type] || 0) + 1;
    });
    
    typesChart.data.labels = Object.keys(typeCounts);
    typesChart.data.datasets[0].data = Object.values(typeCounts);
    typesChart.update();
}

// Open add license modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Licencia';
    document.getElementById('licenseId').value = '';
    
    // Reset form
    licenseForm.reset();
    
    // Set default date to 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('renewalDate').value = nextYear.toISOString().split('T')[0];
    
    // Display modal
    licenseModal.classList.remove('hidden');
    licenseModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Open edit license modal
function openEditModal(id) {
    const license = licenses.find(l => l.id === id);
    if (!license) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Licencia';
    document.getElementById('licenseId').value = id;
    
    // Fill form with license data
    document.getElementById('licenseType').value = license.license_type;
    document.getElementById('username').value = license.username || '';
    document.getElementById('assignee').value = license.assignee || '';
    document.getElementById('renewalDate').value = license.renewal_date || '';
    document.getElementById('monthlyCost').value = license.monthly_cost || '';
    document.getElementById('licenseStatus').value = license.status;
    document.getElementById('notes').value = license.notes || '';
    
    // Display modal
    licenseModal.classList.remove('hidden');
    licenseModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Open delete confirmation modal
function openDeleteModal(id) {
    deleteId.value = id;
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Close license modal
function closeModal() {
    licenseModal.classList.remove('flex');
    licenseModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Close delete modal
function closeDeleteModal() {
    deleteModal.classList.remove('flex');
    deleteModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Handle license form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const licenseId = document.getElementById('licenseId').value;
    const licenseData = {
        license_type: document.getElementById('licenseType').value,
        username: document.getElementById('username').value,
        assignee: document.getElementById('assignee').value,
        renewal_date: document.getElementById('renewalDate').value,
        monthly_cost: parseFloat(document.getElementById('monthlyCost').value) || 0,
        status: document.getElementById('licenseStatus').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            if (licenseId) {
                // Update existing license
                const demoLicenses = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
                const index = demoLicenses.findIndex(l => l.id === licenseId);
                
                if (index !== -1) {
                    demoLicenses[index] = {
                        ...demoLicenses[index],
                        ...licenseData,
                        updated_at: new Date().toISOString()
                    };
                    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoLicenses));
                    showNotification('Licencia actualizada correctamente', 'bg-green-500');
                }
            } else {
                // Add new license
                const demoLicenses = JSON.parse(localStorage.getItem(DEMO_MODE_KEY) || '[]');
                demoLicenses.push({
                    id: crypto.randomUUID(),
                    ...licenseData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoLicenses));
                showNotification('Licencia añadida correctamente', 'bg-green-500');
            }
            
            // Refresh data
            await fetchLicenses();
            closeModal();
            return;
        }
        
        // Supabase mode
        if (licenseId) {
            // Update existing license
            const { error } = await supabase
                .from('ms_licenses')
                .update(licenseData)
                .eq('id', licenseId);
                
            if (error) throw error;
            showNotification('Licencia actualizada correctamente', 'bg-green-500');
        } else {
            // Add new license
            const { error } = await supabase
                .from('ms_licenses')
                .insert({
                    ...licenseData,
                    created_at: new Date().toISOString()
                });
                
            if (error) throw error;
            showNotification('Licencia añadida correctamente', 'bg-green-500');
        }
        
        // Refresh data
        await fetchLicenses();
        
        // Close modal
        closeModal();
    } catch (error) {
        console.error('Error saving license:', error);
        
        // If we're not in demo mode but had an error, try to switch to demo mode
        if (!demoMode) {
            demoMode = true;
            showNotification('Error de conexión. Cambiando a modo demo.', 'bg-yellow-500');
            handleFormSubmit(e); // Retry with demo mode
        } else {
            showNotification('Error al guardar la licencia', 'bg-red-500');
        }
    }
}

// Confirm and execute delete
async function confirmDelete() {
    const id = deleteId.value;
    
    if (!id) {
        closeDeleteModal();
        return;
    }
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            const demoLicenses = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
            const newLicenses = demoLicenses.filter(l => l.id !== id);
            localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(newLicenses));
            showNotification('Licencia eliminada correctamente', 'bg-green-500');
            await fetchLicenses();
            closeDeleteModal();
            return;
        }
        
        // Supabase mode
        const { error } = await supabase
            .from('ms_licenses')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification('Licencia eliminada correctamente', 'bg-green-500');
        await fetchLicenses();
    } catch (error) {
        console.error('Error deleting license:', error);
        
        // If we're not in demo mode but had an error, try to switch to demo mode
        if (!demoMode) {
            demoMode = true;
            showNotification('Error de conexión. Cambiando a modo demo.', 'bg-yellow-500');
            confirmDelete(); // Retry with demo mode
        } else {
            showNotification('Error al eliminar la licencia', 'bg-red-500');
        }
    }
    
    closeDeleteModal();
}

// Show notification
function showNotification(message, bgColor = 'bg-blue-500') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    
    notification.className = `${bgColor} text-white p-3 rounded-lg shadow-lg flex items-center justify-between max-w-md transition-all duration-500 ease-in-out opacity-0 transform translate-y-2`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${bgColor.includes('green') ? 'fa-check-circle' : bgColor.includes('red') ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
        <button class="ml-4 text-white hover:text-gray-200 focus:outline-none">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('opacity-0', 'translate-y-2');
        notification.classList.add('opacity-100', 'translate-y-0');
    }, 10);
    
    // Set up close button
    notification.querySelector('button').addEventListener('click', () => {
        notification.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Helper function to create stored procedure in Supabase
async function ensureStoredProcedures() {
    try {
        // First check if table exists
        const { data, error } = await supabase
            .from('ms_licenses')
            .select('id')
            .limit(1);
            
        if (error) {
            console.log('Table may not exist, attempting to create...');
            try {
                // Try to execute the RPC function to create the table
                const { error: rpcError } = await supabase.rpc('create_ms_licenses_table');
                
                if (rpcError) {
                    // If the RPC fails, we'll need to handle it manually
                    console.error('Failed to create table via RPC:', rpcError);
                    showNotification('Error al configurar la base de datos. Iniciando en modo demo.', 'bg-yellow-500');
                } else {
                    console.log('Table created successfully');
                    // Add sample data after creating the table
                    await addSampleData();
                }
            } catch (rpcError) {
                console.error('Exception creating table:', rpcError);
                showNotification('Error al configurar la base de datos. Iniciando en modo demo.', 'bg-yellow-500');
            }
        } else {
            console.log('Table already exists');
        }
    } catch (error) {
        console.error('Error setting up database:', error);
        showNotification('Error al configurar la base de datos. Iniciando en modo demo.', 'bg-yellow-500');
    }
}

// Initialize the application on page load
window.onload = async function() {
    try {
        await ensureStoredProcedures();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};
