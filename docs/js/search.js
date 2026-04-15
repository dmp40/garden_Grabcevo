/**
 * Plant Catalog - Search and Filter functionality
 */

let fuse = null;
let zoneFilter = '';
let conditionsFilter = '';

/**
 * Initialize Fuse.js search index
 */
function initSearch() {
    if (!plants || plants.length === 0) {
        console.error('Plants data not loaded');
        return;
    }

    // Create Fuse index for fuzzy search
    fuse = new Fuse(plants, {
        keys: ['name_ru', 'name_lat', 'family', 'notes'],
        threshold: 0.4, // More lenient matching
        includeScore: true,
    });

    // Attach event listeners
    const searchInput = document.getElementById('search');
    const zoneFilter_el = document.getElementById('zone-filter');
    const conditionsFilter_el = document.getElementById('conditions-filter');

    if (searchInput) searchInput.addEventListener('input', onSearchInput);
    if (zoneFilter_el) zoneFilter_el.addEventListener('change', onFilterChange);
    if (conditionsFilter_el) conditionsFilter_el.addEventListener('change', onFilterChange);

    console.log('Search initialized with Fuse.js, ' + plants.length + ' plants indexed');
}

/**
 * Handle search input
 */
function onSearchInput(event) {
    const query = event.target.value.trim();
    updateResults();
}

/**
 * Handle filter changes
 */
function onFilterChange(event) {
    zoneFilter = document.getElementById('zone-filter').value;
    conditionsFilter = document.getElementById('conditions-filter').value;
    updateResults();
}

/**
 * Update search results based on current filters and search query
 */
function updateResults() {
    const query = document.getElementById('search').value.trim();
    let results = plants;

    // Apply search
    if (query) {
        const searchResults = fuse.search(query);
        results = searchResults.map(result => result.item);
    }

    // Apply zone filter
    if (zoneFilter) {
        results = results.filter(plant =>
            plant.zone && plant.zone.includes(zoneFilter)
        );
    }

    // Apply conditions filter
    if (conditionsFilter) {
        results = results.filter(plant =>
            plant.conditions && plant.conditions.includes(conditionsFilter)
        );
    }

    // Update UI
    filteredPlants = results;
    renderCatalog(results);
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    document.getElementById('search').value = '';
    document.getElementById('zone-filter').value = '';
    document.getElementById('conditions-filter').value = '';
    zoneFilter = '';
    conditionsFilter = '';
    filteredPlants = [...plants];
    renderCatalog();
}
