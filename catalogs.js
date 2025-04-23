// Obtener configuración desde config.js
const SUPABASE_URL = window.appConfig?.supabaseUrl || 'https://yoggndevscherwfxmijg.supabase.co';
const SUPABASE_KEY = window.appConfig?.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2duZGV2c2NoZXJ3ZnhtaWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjIyNjIsImV4cCI6MjA2MDgzODI2Mn0.JZ-FD37pDx-yCaqqQENkXElQOFUi61F5FT61795nToI';
const DEMO_MODE_KEY = window.appConfig?.demoModeKey || 'ms_licenses_extended_demo';
const APP_VERSION = window.appConfig?.version || '1.0.0';

// Log para debug
console.log('Cargando Catálogos v' + APP_VERSION);
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
const areasList = document.getElementById('areasList');
const locationsList = document.getElementById('locationsList');
const warehousesList = document.getElementById('warehousesList');
const positionsList = document.getElementById('positionsList');

const areasCount = document.getElementById('areasCount');
const locationsCount = document.getElementById('locationsCount');
const warehousesCount = document.getElementById('warehousesCount');
const positionsCount = document.getElementById('positionsCount');

const catalogModal = document.getElementById('catalogModal');
const catalogForm = document.getElementById('catalogForm');
const modalTitle = document.getElementById('modalTitle');
const catalogId = document.getElementById('catalogId');
const catalogType = document.getElementById('catalogType');
const catalogName = document.getElementById('catalogName');
const locationSelectContainer = document.getElementById('locationSelectContainer');
const warehouseLocation = document.getElementById('warehouseLocation');

const deleteModal = document.getElementById('deleteModal');
const deleteId = document.getElementById('deleteId');
const deleteType = document.getElementById('deleteType');
const deleteConfirmText = document.getElementById('deleteConfirmText');
const deleteWarning = document.getElementById('deleteWarning');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Store data
let areas = [];
let locations = [];
let warehouses = [];
let positions = [];
let licenses = []; // For relationship checking

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Set up event listeners
    document.getElementById('syncButton').addEventListener('click', fetchAllData);
    catalogForm.addEventListener('submit', handleFormSubmit);
    
    // Fetch initial data
    await fetchAllData();
    
    // Set up real-time subscription
    setupRealtimeSubscription();
});

// Fetch all catalog data
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
        renderCatalogs();
        
        showNotification('Catálogos cargados correctamente', 'bg-green-500');
    } catch (error) {
        console.error('Error loading catalogs:', error);
        showNotification('Error al cargar catálogos', 'bg-red-500');
        
        // Switch to demo mode if there's an error
        if (!demoMode) {
            demoMode = true;
            showNotification('Cambiando a modo demo', 'bg-yellow-500');
            await fetchDemoData();
            renderCatalogs();
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
            .select('*, location:location_id(name)')
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

// Fetch licenses to check relationships
async function fetchLicenses() {
    try {
        const { data, error } = await supabase
            .from('ms_licenses')
            .select('id, area_id, location_id, warehouse_id, position_id');

        if (error) throw error;

        licenses = data || [];
        return licenses;
    } catch (error) {
        console.error('Error fetching licenses for relationship check:', error);
        throw error;
    }
}

// Set up real-time subscription
function setupRealtimeSubscription() {
    if (demoMode) {
        // For demo mode, use localStorage events to simulate real-time
        window.addEventListener('storage', (e) => {
            if (e.key === DEMO_MODE_KEY) {
                fetchDemoData().then(() => renderCatalogs());
                showNotification('Catálogos actualizados desde otro dispositivo', 'bg-blue-500');
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
        
        console.log('Demo mode real-time subscription setup');
        return;
    }
    
    // For Supabase mode, use actual real-time subscription
    try {
        // Subscribe to catalog changes
        const catalogsSubscription = supabase
            .channel('catalogs_changes')
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_areas'
            }, async () => {
                await fetchAreas();
                renderAreas();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_locations'
            }, async () => {
                await fetchLocations();
                renderLocations();
                populateLocationSelect();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_warehouses'
            }, async () => {
                await fetchWarehouses();
                renderWarehouses();
            })
            .on('postgres_changes', { 
                event: '*',
                schema: 'public',
                table: 'ms_positions'
            }, async () => {
                await fetchPositions();
                renderPositions();
            })
            .subscribe();
            
        console.log('Supabase real-time subscription active');
    } catch (error) {
        console.error('Failed to setup real-time subscription:', error);
    }
}

// Render all catalogs
function renderCatalogs() {
    renderAreas();
    renderLocations();
    renderWarehouses();
    renderPositions();
    populateLocationSelect();
}

// Render areas list
function renderAreas() {
    areasList.innerHTML = '';
    
    if (areas.length === 0) {
        areasList.innerHTML = '<li class="text-gray-500 text-center">No hay áreas definidas</li>';
    } else {
        areas.forEach(area => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 border rounded';
            li.innerHTML = `
                <span>${area.name}</span>
                <div>
                    <button onclick="openEditModal('area', '${area.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('area', '${area.id}', '${area.name}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            areasList.appendChild(li);
        });
    }
    
    areasCount.textContent = areas.length;
}

// Render locations list
function renderLocations() {
    locationsList.innerHTML = '';
    
    if (locations.length === 0) {
        locationsList.innerHTML = '<li class="text-gray-500 text-center">No hay ubicaciones definidas</li>';
    } else {
        locations.forEach(location => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 border rounded';
            li.innerHTML = `
                <span>${location.name}</span>
                <div>
                    <button onclick="openEditModal('location', '${location.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('location', '${location.id}', '${location.name}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            locationsList.appendChild(li);
        });
    }
    
    locationsCount.textContent = locations.length;
}

// Render warehouses list
function renderWarehouses() {
    warehousesList.innerHTML = '';
    
    if (warehouses.length === 0) {
        warehousesList.innerHTML = '<li class="text-gray-500 text-center">No hay bodegas definidas</li>';
    } else {
        warehouses.forEach(warehouse => {
            // Get location name
            let locationName = '-';
            if (demoMode) {
                const location = locations.find(l => l.id === warehouse.location_id);
                locationName = location ? location.name : '-';
            } else {
                locationName = warehouse.location ? warehouse.location.name : '-';
            }
            
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 border rounded';
            li.innerHTML = `
                <div>
                    <div>${warehouse.name}</div>
                    <div class="text-xs text-gray-500">Ubicación: ${locationName}</div>
                </div>
                <div>
                    <button onclick="openEditModal('warehouse', '${warehouse.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('warehouse', '${warehouse.id}', '${warehouse.name}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            warehousesList.appendChild(li);
        });
    }
    
    warehousesCount.textContent = warehouses.length;
}

// Render positions list
function renderPositions() {
    positionsList.innerHTML = '';
    
    if (positions.length === 0) {
        positionsList.innerHTML = '<li class="text-gray-500 text-center">No hay puestos definidos</li>';
    } else {
        positions.forEach(position => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 border rounded';
            li.innerHTML = `
                <span>${position.name}</span>
                <div>
                    <button onclick="openEditModal('position', '${position.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('position', '${position.id}', '${position.name}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            positionsList.appendChild(li);
        });
    }
    
    positionsCount.textContent = positions.length;
}

// Populate location select for warehouse form
function populateLocationSelect() {
    warehouseLocation.innerHTML = '<option value="">Seleccionar ubicación</option>';
    
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = location.name;
        warehouseLocation.appendChild(option);
    });
}

// Open add catalog modal
function openAddModal(type) {
    catalogType.value = type;
    catalogId.value = '';
    catalogName.value = '';
    
    // Reset and setup form for specific type
    setupModalForType(type);
    
    modalTitle.textContent = `Añadir ${getTypeLabel(type)}`;
    
    // Show modal
    catalogModal.classList.remove('hidden');
    catalogModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Open edit catalog modal
function openEditModal(type, id) {
    let item;
    
    switch (type) {
        case 'area':
            item = areas.find(a => a.id === id);
            break;
        case 'location':
            item = locations.find(l => l.id === id);
            break;
        case 'warehouse':
            item = warehouses.find(w => w.id === id);
            break;
        case 'position':
            item = positions.find(p => p.id === id);
            break;
    }
    
    if (!item) return;
    
    catalogType.value = type;
    catalogId.value = id;
    catalogName.value = item.name;
    
    // Setup form for specific type
    setupModalForType(type);
    
    // For warehouses, set the location
    if (type === 'warehouse') {
        warehouseLocation.value = item.location_id || '';
    }
    
    modalTitle.textContent = `Editar ${getTypeLabel(type)}`;
    
    // Show modal
    catalogModal.classList.remove('hidden');
    catalogModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Setup modal for specific catalog type
function setupModalForType(type) {
    // Show/hide location select for warehouses
    if (type === 'warehouse') {
        locationSelectContainer.classList.remove('hidden');
    } else {
        locationSelectContainer.classList.add('hidden');
    }
}

// Get label for catalog type
function getTypeLabel(type) {
    switch (type) {
        case 'area': return 'Área';
        case 'location': return 'Ubicación';
        case 'warehouse': return 'Bodega';
        case 'position': return 'Puesto';
        default: return 'Elemento';
    }
}

// Close catalog modal
function closeCatalogModal() {
    catalogModal.classList.remove('flex');
    catalogModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Handle catalog form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = catalogType.value;
    const id = catalogId.value;
    const name = catalogName.value.trim();
    
    if (!name) {
        showNotification('El nombre no puede estar vacío', 'bg-red-500');
        return;
    }
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            const demoData = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
            
            if (id) {
                // Update existing item
                switch (type) {
                    case 'area':
                        const areaIndex = demoData.areas.findIndex(a => a.id === id);
                        if (areaIndex !== -1) {
                            demoData.areas[areaIndex].name = name;
                        }
                        break;
                    case 'location':
                        const locationIndex = demoData.locations.findIndex(l => l.id === id);
                        if (locationIndex !== -1) {
                            demoData.locations[locationIndex].name = name;
                        }
                        break;
                    case 'warehouse':
                        const warehouseIndex = demoData.warehouses.findIndex(w => w.id === id);
                        if (warehouseIndex !== -1) {
                            demoData.warehouses[warehouseIndex].name = name;
                            demoData.warehouses[warehouseIndex].location_id = warehouseLocation.value || null;
                        }
                        break;
                    case 'position':
                        const positionIndex = demoData.positions.findIndex(p => p.id === id);
                        if (positionIndex !== -1) {
                            demoData.positions[positionIndex].name = name;
                        }
                        break;
                }
                
                localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
                showNotification(`${getTypeLabel(type)} actualizado correctamente`, 'bg-green-500');
            } else {
                // Add new item
                const newId = crypto.randomUUID();
                
                switch (type) {
                    case 'area':
                        demoData.areas.push({ id: newId, name: name });
                        break;
                    case 'location':
                        demoData.locations.push({ id: newId, name: name });
                        break;
                    case 'warehouse':
                        demoData.warehouses.push({ 
                            id: newId, 
                            name: name, 
                            location_id: warehouseLocation.value || null 
                        });
                        break;
                    case 'position':
                        demoData.positions.push({ id: newId, name: name });
                        break;
                }
                
                localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
                showNotification(`${getTypeLabel(type)} añadido correctamente`, 'bg-green-500');
            }
            
            // Update local data
            await fetchDemoData();
            renderCatalogs();
            
            // Close modal
            closeCatalogModal();
            return;
        }
        
        // Supabase mode
        let table;
        let data;
        
        switch (type) {
            case 'area':
                table = 'ms_areas';
                data = { name };
                break;
            case 'location':
                table = 'ms_locations';
                data = { name };
                break;
            case 'warehouse':
                table = 'ms_warehouses';
                data = { 
                    name,
                    location_id: warehouseLocation.value || null
                };
                break;
            case 'position':
                table = 'ms_positions';
                data = { name };
                break;
            default:
                throw new Error('Invalid catalog type');
        }
        
        if (id) {
            // Update existing item
            const { error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id);
                
            if (error) throw error;
            showNotification(`${getTypeLabel(type)} actualizado correctamente`, 'bg-green-500');
        } else {
            // Add new item
            const { error } = await supabase
                .from(table)
                .insert(data);
                
            if (error) throw error;
            showNotification(`${getTypeLabel(type)} añadido correctamente`, 'bg-green-500');
        }
        
        // Refresh data based on type
        switch (type) {
            case 'area':
                await fetchAreas();
                renderAreas();
                break;
            case 'location':
                await fetchLocations();
                renderLocations();
                populateLocationSelect();
                break;
            case 'warehouse':
                await fetchWarehouses();
                renderWarehouses();
                break;
            case 'position':
                await fetchPositions();
                renderPositions();
                break;
        }
        
        // Close modal
        closeCatalogModal();
    } catch (error) {
        console.error('Error saving catalog item:', error);
        
        // If we're not in demo mode but had an error, try to switch to demo mode
        if (!demoMode) {
            demoMode = true;
            showNotification('Error de conexión. Cambiando a modo demo.', 'bg-yellow-500');
            handleFormSubmit(e); // Retry with demo mode
        } else {
            showNotification('Error al guardar el elemento', 'bg-red-500');
        }
    }
}

// Open delete confirmation modal
function openDeleteModal(type, id, name) {
    deleteType.value = type;
    deleteId.value = id;
    
    // Check if the item is in use by licenses
    const isInUse = checkItemInUse(type, id);
    
    if (isInUse) {
        // Show warning and disable delete button
        deleteWarning.classList.remove('hidden');
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        // Hide warning and enable delete button
        deleteWarning.classList.add('hidden');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    
    deleteConfirmText.textContent = `¿Estás seguro de que deseas eliminar ${getTypeLabel(type).toLowerCase()} "${name}"? Esta acción no se puede deshacer.`;
    
    // Show modal
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    document.body.classList.add('modal-open');
}

// Check if item is in use by any license
function checkItemInUse(type, id) {
    if (!licenses.length) return false;
    
    switch (type) {
        case 'area':
            return licenses.some(license => license.area_id === id);
        case 'location':
            return licenses.some(license => license.location_id === id);
        case 'warehouse':
            return licenses.some(license => license.warehouse_id === id);
        case 'position':
            return licenses.some(license => license.position_id === id);
        default:
            return false;
    }
}

// Close delete modal
function closeDeleteModal() {
    deleteModal.classList.remove('flex');
    deleteModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Confirm and execute delete
async function confirmDelete() {
    const type = deleteType.value;
    const id = deleteId.value;
    
    if (!id || confirmDeleteBtn.disabled) {
        closeDeleteModal();
        return;
    }
    
    try {
        if (demoMode) {
            // Demo mode - use localStorage
            const demoData = JSON.parse(localStorage.getItem(DEMO_MODE_KEY));
            
            switch (type) {
                case 'area':
                    demoData.areas = demoData.areas.filter(a => a.id !== id);
                    break;
                case 'location':
                    demoData.locations = demoData.locations.filter(l => l.id !== id);
                    
                    // Also clean up warehouses that reference this location
                    demoData.warehouses = demoData.warehouses.filter(w => w.location_id !== id);
                    break;
                case 'warehouse':
                    demoData.warehouses = demoData.warehouses.filter(w => w.id !== id);
                    break;
                case 'position':
                    demoData.positions = demoData.positions.filter(p => p.id !== id);
                    break;
            }
            
            localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(demoData));
            showNotification(`${getTypeLabel(type)} eliminado correctamente`, 'bg-green-500');
            
            // Update local data
            await fetchDemoData();
            renderCatalogs();
            
            // Close modal
            closeDeleteModal();
            return;
        }
        
        // Supabase mode
        let table;
        
        switch (type) {
            case 'area':
                table = 'ms_areas';
                break;
            case 'location':
                table = 'ms_locations';
                break;
            case 'warehouse':
                table = 'ms_warehouses';
                break;
            case 'position':
                table = 'ms_positions';
                break;
            default:
                throw new Error('Invalid catalog type');
        }
        
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        showNotification(`${getTypeLabel(type)} eliminado correctamente`, 'bg-green-500');
        
        // Refresh data based on type
        switch (type) {
            case 'area':
                await fetchAreas();
                renderAreas();
                break;
            case 'location':
                await fetchLocations();
                renderLocations();
                populateLocationSelect();
                
                // Also refresh warehouses as they might be affected
                await fetchWarehouses();
                renderWarehouses();
                break;
            case 'warehouse':
                await fetchWarehouses();
                renderWarehouses();
                break;
            case 'position':
                await fetchPositions();
                renderPositions();
                break;
        }
    } catch (error) {
        console.error('Error deleting catalog item:', error);
        
        // If we're not in demo mode but had an error, try to switch to demo mode
        if (!demoMode) {
            demoMode = true;
            showNotification('Error de conexión. Cambiando a modo demo.', 'bg-yellow-500');
            confirmDelete(); // Retry with demo mode
        } else {
            showNotification('Error al eliminar el elemento', 'bg-red-500');
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
