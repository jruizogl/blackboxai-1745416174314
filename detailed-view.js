// Obtener configuración desde config.js
const SUPABASE_URL = window.appConfig?.supabaseUrl || 'https://yoggndevscherwfxmijg.supabase.co';
const SUPABASE_KEY = window.appConfig?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI';
const DEMO_MODE_KEY = window.appConfig?.demoModeKey || 'ms_licenses_extended_demo';
const APP_VERSION = window.appConfig?.version || '1.0.0';

// Log para debug
console.log('Cargando Vista Detallada de Licencias Microsoft v' + APP_VERSION);
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

// Filtros
const statusFilter = document.getElementById('statusFilter');
const areaFilter = document.getElementById('areaFilter');
const locationFilter = document.getElementById('locationFilter');
const warehouseFilter = document.getElementById('warehouseFilter');
const positionFilter = document.getElementById('positionFilter');
const clearFiltersBtn = document.getElementById('clearFilters');

// Store data
let licenses = [];
let areas = [];
let locations = [];
let warehouses = [];
let positions = [];

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Set up event listeners
    document.getElementById('addLicenseButton').addEventListener('click', openAddModal);
    document.getElementById('syncButton').addEventListener('click', fetchAllData);
    licenseForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', filterLicenses);
    
    // Configurar filtros
    statusFilter.addEventListener('change', filterLicenses);
    areaFilter.addEventListener('change', filterLicenses);
    locationFilter.addEventListener('change', filterLicenses);
    warehouseFilter.addEventListener('change', filterLicenses);
    positionFilter.addEventListener('change', filterLicenses);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Configurar cambio en ubicación para filtrar bodegas
    document.getElementById('location').addEventListener('change', updateWarehouseOptions);

    // Fetch initial data
    await fetchAllData();
    
    // Set up real-time subscription
    setupRealtimeSubscription();
});

// Fetch all data including catalogs
async function fetchAllData() {
    showNotification('Cargando datos...', 'bg-blue-500');
    
    try {
        if (demoMode) {
            await fetchDemoData();
        } else {
            await Promise.all([
                fetchAreas(),
                fetchLocations(),
                fetchWarehouses(),
                fetchPositions(),
                fetchLicenses()
            ]);
        }
        
        // Update UI with fetched data
        populateFilters();
        populateFormSelects();
        renderLicenses();
        
        showNotification('Datos cargados correctamente', 'bg-green-500');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error al cargar datos', 'bg-red-500');
        
        // Switch to demo mode if there's an error
        if (!demoMode) {
            demoMode = true;
            showNotification('Cambiando a modo demo', 'bg-yellow-500');
            await fetchDemoData();
            populateFilters();
            populateFormSelects();
            renderLicenses();
        }
    }
}

// Load demo data if Supabase is not available
async function fetchDemoData() {
    console.log('Fetching demo data...');
    
    // Check if demo data exists
    if (!localStorage.getItem(DEMO_MODE_KEY)) {
        generateDemoData();
    }
    
    const demoData = JSON.parse(localStorage.getItem(DEMO_MODE_KEY) || '{}');
    
    areas = demoData.areas || [];
    locations = demoData.locations || [];
    warehouses = demoData.warehouses || [];
    positions = demoData.positions || [];
    licenses = demoData.licenses || [];
    
    return true;
}

// Generate demo data with required relationships
function generateDemoData() {
    // Generate areas
    const demoAreas = [
        { id: crypto.randomUUID(), name: 'Ventas' },
        { id: crypto.randomUUID(), name: 'Operaciones' },
        { id: crypto.randomUUID(), name: 'TI' },
        { id: crypto.randomUUID(), name: 'Marketing' },
        { id: crypto.randomUUID(), name: 'Recursos Humanos' },
        { id: crypto.randomUUID(), name: 'Finanzas' }
    ];
    
    // Generate locations
    const demoLocations = [
        { id: crypto.randomUUID(), name: 'Ciudad de México' },
        { id: crypto.randomUUID(), name: 'Monterrey' },
        { id: crypto.randomUUID(), name: 'Guadalajara' },
        { id: crypto.randomUUID(), name: 'Querétaro' }
    ];
    
    // Generate positions
    const demoPositions = [
        { id: crypto.randomUUID(), name: 'Gerente' },
        { id: crypto.randomUUID(), name: 'Director' },
        { id: crypto.randomUUID(), name: 'Analista' },
        { id: crypto.randomUUID(), name: 'Coordinador' },
        { id: crypto.randomUUID(), name: 'Desarrollador' }
    ];
    
    // Generate warehouses (related to locations)
    const demoWarehouses = [
        { 
            id: crypto.randomUUID(), 
            name: 'Bodega Central CDMX', 
            location_id: demoLocations[0].id 
        },
        { 
            id: crypto.randomUUID(), 
            name: 'Bodega Norte MTY', 
            location_id: demoLocations[1].id 
        },
        { 
            id: crypto.randomUUID(), 
            name: 'Bodega Sur GDL', 
            location_id: demoLocations[2].id 
        },
        { 
            id: crypto.randomUUID(), 
            name: 'Almacén QRO', 
            location_id: demoLocations[3].id 
        }
    ];
    
    // Generate demo licenses with relationships
    const demoLicenses = [
        {
            id: crypto.randomUUID(),
            license_type: 'Office 365 Business Standard',
            username: 'jperez',
            full_name: 'Juan Pérez',
            email: 'jperez@empresa.com',
            position_id: demoPositions[0].id,
            area_id: demoAreas[0].id,
            location_id: demoLocations[0].id,
            warehouse_id: demoWarehouses[0].id,
            account: 'Corporativa',
            assignee: 'Departamento de Ventas',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().split('T')[0],
            monthly_cost: 12.50,
            status: 'Activa',
            notes: 'Licencia para departamento de ventas',
            created_at: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            license_type: 'Microsoft 365 E3',
            username: 'agomez',
            full_name: 'Ana Gómez',
            email: 'agomez@empresa.com',
            position_id: demoPositions[1].id,
            area_id: demoAreas[1].id,
            location_id: demoLocations[1].id,
            warehouse_id: demoWarehouses[1].id,
            account: 'Ejecutiva',
            assignee: 'Dirección General',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString().split('T')[0],
            monthly_cost: 32.00,
            status: 'Activa',
            notes: 'Gerencia de operaciones',
            created_at: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            license_type: 'Office 365 Business Basic',
            username: 'crodriguez',
            full_name: 'Carlos Rodríguez',
            email: 'crodriguez@empresa.com',
            position_id: demoPositions[2].id,
            area_id: demoAreas[2].id,
            location_id: demoLocations[2].id,
            warehouse_id: demoWarehouses[2].id,
            account: 'Soporte',
            assignee: 'Departamento de TI',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 10)).toISOString().split('T')[0],
            monthly_cost: 6.00,
            status: 'Activa',
            notes: 'Departamento de soporte',
            created_at: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            license_type: 'Office 365 Business Premium',
            username: 'mgarcia',
            full_name: 'María García',
            email: 'mgarcia@empresa.com',
            position_id: demoPositions[3].id,
            area_id: demoAreas[3].id,
            location_id: demoLocations[3].id,
            warehouse_id: demoWarehouses[3].id,
            account: 'Marketing',
            assignee: 'Equipo Creativo',
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 7)).toISOString().split('T')[0],
            monthly_cost: 22.00,
            status: 'Inactiva',
            notes: 'Departamento de marketing',
            created_at: new Date().toISOString()
        },
        {
            id: crypto.randomUUID(),
            license_type: 'Microsoft 365 E5',
            username: null,
            full_name: null,
            email: null,
            position_id: null,
            area_id: null,
            location_id: null,
            warehouse_id: null,
            account: 'Reserva',
            assignee: null,
            renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            monthly_cost: 57.00,
            status: 'Pendiente',
            notes: 'Licencia disponible para asignación',
            created_at: new Date().toISOString()
        }
    ];
    
    // Save to localStorage
    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify({
        areas: demoAreas,
        locations: demoLocations,
        warehouses: demoWarehouses,
        positions: demoPositions,
        licenses: demoLicenses
    }));
    
    return {
        areas: demoAreas,
        locations: demoLocations,
        warehouses: demoWarehouses,
        positions: demoPositions,
        licenses: demoLicenses
    };
}

// Fetch licenses from Supabase
async function fetchLicenses() {
    try {
        const { data, error } = await supabase
            .from('ms_licenses')
            .select(`
                *,
                position:position_id(id, name),
                area:area_id(id, name),
                location:location_id(id, name),
                warehouse:warehouse_id(id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        licenses = data || [];
        return licenses;
    } catch (error) {
        console.error('Error fetching licenses:', error);
        throw error;
    }
}

// Fetch areas from Supabase
async function fetchAreas() {
    try {
        const { data, error } = await supabase
            .from('ms_areas')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        areas = data || [];
        return areas;
    } catch (error) {
        console.error('Error fetching areas:', error);
        throw error;
    }
}

// Fetch locations from Supabase
async function fetchLocations() {
    try {
        const { data, error } = await supabase
            .from('ms_locations')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        locations = data || [];
        return locations;
    } catch (error) {
        console.error('Error fetching locations:', error);
        throw error;
    }
}

// Fetch warehouses from Supabase
async function fetchWarehouses() {
    try {
        const { data, error } = await supabase
            .from('ms_warehouses')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        warehouses = data || [];
        return warehouses;
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        throw error;
    }
}

// Fetch positions from Supabase
async function fetchPositions() {
    try {
        const { data, error } = await supabase
            .from('ms_positions')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        positions = data || [];
        return positions;
    } catch (error) {
        console.error('Error fetching positions:', error);
        throw error;
    }
}

// Set up real-time subscription
function setupRealtimeSubscription() {
    if (demoMode) {
        // For demo mode, use localStorage events to simulate real-time
        window.addEventListener('storage', (e) => {
            if (e.key === DEMO_MODE_KEY) {
                fetchDemoData();
                renderLicenses();
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
        // Subscribe to licenses changes
        const licenseSubscription = supabase
            .channel('ms_licenses_changes')
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_licenses'
            }, async () => {
                await fetchLicenses();
                renderLicenses();
                showNotification('Licencias actualizadas', 'bg-blue-500');
            })
            .subscribe();
            
        // Subscribe to catalog changes
        const catalogsSubscription = supabase
            .channel('catalogs_changes')
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_areas'
            }, async () => {
                await fetchAreas();
                populateFilters();
                populateFormSelects();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_locations'
            }, async () => {
                await fetchLocations();
                populateFilters();
                populateFormSelects();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_warehouses'
            }, async () => {
                await fetchWarehouses();
                populateFilters();
                populateFormSelects();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_positions'
            }, async () => {
                await fetchPositions();
                populateFilters();
                populateFormSelects();
            })
            .subscribe();
            
        console.log('Supabase real-time subscriptions active');
    } catch (error) {
        console.error('Failed to setup real-time subscription:', error);
    }
}

// Populate filter dropdowns with catalog data
function populateFilters() {
    // Limpiar selecciones actuales
    areaFilter.innerHTML = '<option value="">Todas</option>';
    locationFilter.innerHTML = '<option value="">Todas</option>';
    warehouseFilter.innerHTML = '<option value="">Todas</option>';
    positionFilter.innerHTML = '<option value="">Todos</option>';
    
    // Áreas
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.name;
        areaFilter.appendChild(option);
    });
    
    // Ubicaciones
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        locationFilter.appendChild(option);
    });
    
    // Bodegas
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.id;
        option.textContent = warehouse.name;
        warehouseFilter.appendChild(option);
    });
    
    // Puestos
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position.id;
        option.textContent = position.name;
        positionFilter.appendChild(option);
    });
}

// Populate form select elements with catalog data
function populateFormSelects() {
    const areaSelect = document.getElementById('area');
    const locationSelect = document.getElementById('location');
    const warehouseSelect = document.getElementById('warehouse');
    const positionSelect = document.getElementById('position');
    
    // Limpiar selecciones actuales
    areaSelect.innerHTML = '<option value="">Seleccionar área</option>';
    locationSelect.innerHTML = '<option value="">Seleccionar ubicación</option>';
    warehouseSelect.innerHTML = '<option value="">Seleccionar bodega</option>';
    positionSelect.innerHTML = '<option value="">Seleccionar puesto</option>';
    
    // Áreas
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.name;
        areaSelect.appendChild(option);
    });
    
    // Ubicaciones
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        locationSelect.appendChild(option);
    });
    
    // Bodegas
    warehouses.forEach(warehouse => {
        const option = document.createElement('option');
        option.value = warehouse.id;
        option.textContent = warehouse.name;
        warehouseSelect.appendChild(option);
    });
    
    // Puestos
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position.id;
        option.textContent = position.name;
        positionSelect.appendChild(option);
    });
}

// Update warehouse options based on selected location
function updateWarehouseOptions() {
    const locationSelect = document.getElementById('location');
    const warehouseSelect = document.getElementById('warehouse');
    const selectedLocationId = locationSelect.value;
    
    // Limpiar selección actual
    warehouseSelect.innerHTML = '<option value="">Seleccionar bodega</option>';
    
    if (!selectedLocationId) {
        // Si no hay ubicación seleccionada, mostrar todas las bodegas
        warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseSelect.appendChild(option);
        });
    } else {
        // Filtrar bodegas por ubicación
        const filteredWarehouses = warehouses.filter(wh => wh.location_id === selectedLocationId);
        
        filteredWarehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = warehouse.name;
            warehouseSelect.appendChild(option);
        });
    }
}

// Clear all filters
function clearFilters() {
    statusFilter.value = '';
    areaFilter.value = '';
    locationFilter.value = '';
    warehouseFilter.value = '';
    positionFilter.value = '';
    searchInput.value = '';
    
    renderLicenses();
}

// Filter licenses based on search input and dropdowns
function filterLicenses() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusVal = statusFilter.value;
    const areaVal = areaFilter.value;
    const locationVal = locationFilter.value;
    const warehouseVal = warehouseFilter.value;
    const positionVal = positionFilter.value;
    
    let filtered = [...licenses];
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(license => 
            (license.username && license.username.toLowerCase().includes(searchTerm)) ||
            (license.full_name && license.full_name.toLowerCase().includes(searchTerm)) ||
            (license.email && license.email.toLowerCase().includes(searchTerm)) ||
            (license.license_type && license.license_type.toLowerCase().includes(searchTerm)) ||
            (license.account && license.account.toLowerCase().includes(searchTerm)) ||
            (license.assignee && license.assignee.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply dropdown filters
    if (statusVal) {
        filtered = filtered.filter(license => license.status === statusVal);
    }
    
    if (areaVal) {
        filtered = filtered.filter(license => license.area_id === areaVal);
    }
    
    if (locationVal) {
        filtered = filtered.filter(license => license.location_id === locationVal);
    }
    
    if (warehouseVal) {
        filtered = filtered.filter(license => license.warehouse_id === warehouseVal);
    }
    
    if (positionVal) {
        filtered = filtered.filter(license => license.position_id === positionVal);
    }
    
    renderLicenses(filtered);
}

// Render licenses table
function renderLicenses(filteredLicenses = null) {
    const dataToRender = filteredLicenses || licenses;
    
    licenseTableBody.innerHTML = '';
    
    if (dataToRender.length === 0) {
        licenseTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron licencias. Agrega una nueva licencia para comenzar.
                </td>
            </tr>
        `;
        return;
    }
    
    dataToRender.forEach(license => {
        const row = document.createElement('tr');
        row.className = 'license-row hover:bg-gray-50';
        
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
        
        // Get related values from catalog (Supabase joins or demo relationships)
        let areaName = '-';
        let locationName = '-';
        let warehouseName = '-';
        let positionName = '-';
        
        if (demoMode) {
            // En modo demo, busca los nombres en los arreglos
            if (license.area_id) {
                const area = areas.find(a => a.id === license.area_id);
                areaName = area ? area.name : '-';
            }
            
            if (license.location_id) {
                const location = locations.find(l => l.id === license.location_id);
                locationName = location ? location.name : '-';
            }
            
            if (license.warehouse_id) {
                const warehouse = warehouses.find(w => w.id === license.warehouse_id);
                warehouseName = warehouse ? warehouse.name : '-';
            }
            
            if (license.position_id) {
                const position = positions.find(p => p.id === license.position_id);
                positionName = position ? position.name : '-';
            }
        } else {
            // En modo Supabase, usa los joins
            areaName = license.area ? license.area.name : '-';
            locationName = license.location ? license.location.name : '-';
            warehouseName = license.warehouse ? license.warehouse.name : '-';
            positionName = license.position ? license.position.name : '-';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${license.license_type}</div>
                <div class="text-xs text-gray-500">${license.id.substring(0, 8)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${license.username || '-'}</div>
                <div class="text-xs text-gray-500">${license.email || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${license.full_name || '-'}</div>
                <div class="text-xs text-gray-500">${positionName}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${license.account || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${areaName}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${locationName}</div>
                <div class="text-xs text-gray-500">${warehouseName}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${renewalDate}</div>
                <div class="text-xs text-gray-500">$${parseFloat(license.monthly_cost).toFixed(2)}/mes</div>
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
    document.getElementById('fullName').value = license.full_name || '';
    document.getElementById('email').value = license.email || '';
    document.getElementById('account').value = license.account || '';
    document.getElementById('assignee').value = license.assignee || '';
    document.getElementById('position').value = license.position_id || '';
    document.getElementById('area').value = license.area_id || '';
    document.getElementById('location').value = license.location_id || '';
    
    // Update warehouse options based on location and set value
    updateWarehouseOptions();
    document.getElementById('warehouse').value = license.warehouse_id || '';
    
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
    document.getElementById('deleteId').value = id;
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
        username: document.getElementById('username').value || null,
        full_name: document.getElementById('fullName').value || null,
        email: document.getElementById('email').value || null,
        position_id: document.getElementById('position').value || null,
        area_id: document.getElementById('area').value || null,
        location_id: document.getElementById('location').value || null,
        warehouse_id: document.getElementById('warehouse').value || null,
        account: document.getElementById('account').value || null,
        assignee: document.getElementById('assignee').value || null,
        renewal_date: document.getElementById('renewalDate').value || null,
        monthly_cost: parseFloat(document.getElementById('monthlyCost').value) || 0,
        status: document.getElementById('licenseStatus').value,
        notes: document.getElementById('notes').value || null
    };
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            const demoData = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
            
            if (licenseId) {
                // Update existing license
                const licenseIndex = demoData.licenses.findIndex(l => l.id === licenseId);
                
                if (licenseIndex !== -1) {
                    demoData.licenses[licenseIndex] = {
                        ...demoData.licenses[licenseIndex],
                        ...licenseData,
                        updated_at: new Date().toISOString()
                    };
                    
                    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
                    licenses = demoData.licenses;
                    showNotification('Licencia actualizada correctamente', 'bg-green-500');
                }
            } else {
                // Add new license
                const newLicense = {
                    id: crypto.randomUUID(),
                    ...licenseData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                demoData.licenses.push(newLicense);
                localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
                licenses = demoData.licenses;
                showNotification('Licencia añadida correctamente', 'bg-green-500');
            }
            
            renderLicenses();
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
        renderLicenses();
        
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
    const id = document.getElementById('deleteId').value;
    
    if (!id) {
        closeDeleteModal();
        return;
    }
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            const demoData = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
            demoData.licenses = demoData.licenses.filter(l => l.id !== id);
            localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
            licenses = demoData.licenses;
            showNotification('Licencia eliminada correctamente', 'bg-green-500');
            renderLicenses();
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
        renderLicenses();
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
