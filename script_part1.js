// Supabase configuration
const SUPABASE_URL = 'https://tperggrkgjexpsibgmtb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXJnZ3JrZ2pleHBzaWJnbXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNTAxODYsImV4cCI6MjA2MDgyNjE4Nn0.7ackU8djT7cNvNzznjfHU52USlFulpkub6xnMUq8DyQ';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Initial empty data
let areas = [];
let calendarData = [];

// Default areas data
const defaultAreas = [
    { id: 1, name: "Calidad", color: "bg-blue-500", active: true },
    { id: 2, name: "Recursos Humanos", color: "bg-green-500", active: true },
    { id: 3, name: "TI", color: "bg-yellow-500", active: true },
    { id: 4, name: "Seguridad Patrimonial", color: "bg-purple-500", active: true },
    { id: 5, name: "Seguridad e Higiene", color: "bg-red-500", active: true },
    { id: 6, name: "Mantenimiento", color: "bg-pink-500", active: true },
    { id: 7, name: "Dirección", color: "bg-indigo-500", active: true }
];

// Load data from Supabase
async function loadData() {
    try {
        const { data, error } = await supabase
            .from("calendar")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;

        if (data) {
            areas = data.areas || defaultAreas;
            calendarData = data.calendar_data || [];
            console.log("Loaded data from Supabase");
        } else {
            console.log("No data found, initializing with defaults");
            areas = defaultAreas;
            calendarData = [];
            await saveData();
        }

        return true;
    } catch (error) {
        console.error("Error loading data:", error);
        return false;
    }
}
