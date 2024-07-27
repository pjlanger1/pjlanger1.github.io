document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([40.730610, -73.935242], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
        maxZoom: 19,
        subdomains: 'abcd',
        minZoom: 0
    }).addTo(map);

    var customIcon = L.icon({
        iconUrl: 'images/marker-icon.png',
        iconSize: [Math.round(25 * 0.7), Math.round(41 * 0.7)],
        iconAnchor: [Math.round(12 * 0.7), Math.round(41 * 0.7)],
        popupAnchor: [30, -60]
    });

    var selectedIcon = L.icon({
        iconUrl: 'images/marker-icon-selected.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [30, -200]
    });

    let markers = {};
    let currentlySelectedMarker = null;
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
    .then(response => response.json())
    .then(data => {
        Object.values(data).forEach(location => {
            const marker = L.marker([location.lat, location.lon], {icon: customIcon})
                .addTo(map)
                .bindPopup(getPopupContent(location))
                .on('click', function() {
                    if (currentlySelectedMarker) {
                        currentlySelectedMarker.setIcon(customIcon);
                    }
                    this.setIcon(selectedIcon);
                    currentlySelectedMarker = this;
                });
            markers[location.old_id] = marker;
        });
        setupSearch(Object.values(data), markers, map);
    })
    .catch(error => console.error('Error loading JSON data:', error));

    function getPopupContent(location) {
        return `
            <div class="popup-content">
                <h4>${location.name}</h4>
                <span class="status-info" data-id="${location.old_id}">Bike: Classic, Ride: End</span>
                <div class="popup-controls">
                    <label class="toggle-switch">
                        <input type="checkbox" class="power-toggle" data-id="${location.old_id}" data-type="thunderbolt">
                        <span class="slider round"><img src="images/thunderbolt-off-icon.png" alt="Power"></span>
                    </label>
                    <label class="toggle-switch">
                        <input type="checkbox" class="trend-toggle" data-id="${location.old_id}" data-type="arrow-up">
                        <span class="slider round"><img src="images/arrow_up_off_icon.png" alt="Trend"></span>
                    </label>
                </div>
                <div id="popup-data-${location.old_id}"></div>
            </div>
        `;
    }

    function setupSearch(locations, markers, map) {
        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            );
            displaySearchResults(filteredLocations, markers, map);
        });
    }

    function displaySearchResults(filteredLocations, markers, map) {
        searchResults.innerHTML = '';
        filteredLocations.forEach(location => {
            const div = document.createElement('div');
            div.textContent = location.name;
            div.className = 'search-result-item';
            div.onclick = function() {
                searchBar.value = location.name; // Fill the search bar with the selected location name
                searchResults.style.display = 'none'; // Hide results
                const selectedMarker = markers[location.old_id];
                if (currentlySelectedMarker) {
                    currentlySelectedMarker.setIcon(customIcon); // Reset previous marker
                }
                selectedMarker.setIcon(selectedIcon);
                map.setView(selectedMarker.getLatLng(), 16); // Zoom and center the map on the marker
                selectedMarker.openPopup(); // Open the popup
                currentlySelectedMarker = selectedMarker; // Update the currently selected marker
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
    }
});
