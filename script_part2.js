// Save data to Supabase
async function saveData() {
    try {
        const { error } = await supabase
            .from("calendar")
            .insert({
                calendar_data: calendarData,
                areas: areas,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        showSaveNotification("Cambios guardados");
        return true;
    } catch (error) {
        console.error("Error saving data:", error);
        showSaveNotification("Error al guardar cambios", true);
        return false;
    }
}

// Subscribe to real-time changes
const subscription = supabase
    .channel("calendar_changes")
    .on("postgres_changes", { 
        event: "INSERT",
        schema: "public",
        table: "calendar"
    }, async (payload) => {
        console.log("New data available:", payload);
        await loadData();
        renderCalendar();
        renderAreaLegend();
        showSaveNotification("Calendario actualizado");
    })
    .subscribe();

// Initialize calendar data
async function initializeCalendarData() {
    console.log("Initializing calendar data...");
    
    try {
        const dataLoaded = await loadData();
        if (!dataLoaded) {
            console.log("Failed to load data, initializing with defaults");
            areas = defaultAreas;
            calendarData = months.map((month, index) => {
                const activeAreas = areas.filter(a => a.active);
                const defaultArea = activeAreas[index % activeAreas.length];
                const firstWorkday = findFirstWorkday(2025, index);
                
                return {
                    month: month,
                    visits: [{
                        date: firstWorkday,
                        areas: [{
                            id: defaultArea.id,
                            name: defaultArea.name,
                            color: defaultArea.color
                        }]
                    }]
                };
            });
            await saveData();
        }

        console.log("Calendar data:", calendarData);
        renderCalendar();
        renderAreaLegend();
    } catch (error) {
        console.error("Error initializing calendar:", error);
        showSaveNotification("Error al inicializar el calendario", true);
    }
}
