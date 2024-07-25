document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([40.730610, -73.935242], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
        maxZoom: 19,
        subdomains: 'abcd',
        minZoom: 0
    }).addTo(map);

    // Define custom icons
    var customIcon = L.icon({
        iconUrl: 'images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    var selectedIcon = L.icon({
        iconUrl: 'images/marker-icon-selected.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    let markers = {};
    let lastSelectedMarker = null;  // Track the last selected marker

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data);
            locations.forEach(location => {
                const marker = L.marker([location.lat, location.lon], {icon: customIcon})
                    .addTo(map)
                    .bindPopup(location.name)
                    .on('click', function() {
                        if (lastSelectedMarker) {
                            lastSelectedMarker.setIcon(customIcon); // Reset the last selected marker
                        }
                        marker.setIcon(selectedIcon); // Set this marker to selected
                        lastSelectedMarker = marker; // Update the last selected marker
                    });
                markers[location.old_id] = marker;
            });
            setupSearch(locations, markers);
        })
        .catch(error => console.error('Error loading JSON data:', error));

    function setupSearch(locations, markers) {
        const searchBar = document.getElementById('search-bar');
        const searchResults = document.getElementById('search-results');

        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            ).slice(0, 10); // Limit results to 10 items
            displaySearchResults(filteredLocations, markers, map);
        });
    }

    function displaySearchResults(filteredLocations, markers, map) {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';
        filteredLocations.forEach(location => {
            const div = document.createElement('div');
            div.textContent = location.name;
            div.className = 'search-result-item';
            div.onclick = function() {
                if (lastSelectedMarker) {
                    lastSelectedMarker.setIcon(customIcon); // Reset the last selected marker
                }
                const selectedMarker = markers[location.old_id];
                if (selectedMarker) {
                    selectedMarker.setIcon(selectedIcon);
                    map.setView([location.lat, location.lon], 17);
                    selectedMarker.openPopup();
                    lastSelectedMarker = selectedMarker; // Update the last selected marker
                }
                searchBar.value = location.name; // Fill the search bar with the selected location name
                searchResults.innerHTML = ''; // Clear search results after selection
                searchResults.style.display = 'none'; // Hide results
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
    }
});
