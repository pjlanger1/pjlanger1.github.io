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
    let lastSelectedMarker = null;
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(location => {
                const popupContent = `
                    <div class="popup-content">
                        <h4>${location.name}</h4>
                        <div class="popup-controls">
                            <label class="toggle-switch">
                                <input type="checkbox" class="power-toggle" data-id="${location.id}">
                                <span class="slider round"><img src="images/thunderbolt-off-icon.png" alt="Power" class="icon-power" data-id="${location.id}"></span>
                            </label>
                            <label class="toggle-switch">
                                <input type="checkbox" class="trend-toggle" data-id="${location.id}">
                                <span class="slider round"><img src="images/arrow-up-off-icon.png" alt="Trend" class="icon-trend" data-id="${location.id}"></span>
                            </label>
                        </div>
                        <div id="popup-data-${location.id}"></div>
                    </div>
                `;
                const marker = L.marker([location.lat, location.lon], {icon: customIcon})
                    .addTo(map)
                    .bindPopup(popupContent)
                    .on('click', function() {
                        if (lastSelectedMarker) {
                            lastSelectedMarker.setIcon(customIcon);
                        }
                        marker.setIcon(selectedIcon);
                        lastSelectedMarker = marker;
                        updatePopupContent(location);
                    });
                markers[location.old_id] = marker;
            });
            setupSearch(locations, markers);
        })
        .catch(error => console.error('Error loading JSON data:', error));

    function updatePopupContent(location) {
        document.querySelectorAll('.power-toggle[data-id="' + location.id + '"], .trend-toggle[data-id="' + location.id + '"]').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const icon = document.querySelector(`.${this.className.split(' ')[0]}[data-id="${location.id}"] img`);
                const isPower = this.classList.contains('power-toggle');
                icon.src = this.checked ? `images/${isPower ? 'thunderbolt-on-icon.png' : 'arrow-up-on-icon.png'}` : `images/${isPower ? 'thunderbolt-off-icon.png' : 'arrow-up-off-icon.png'}`;
            });
        });
    }

    function setupSearch(locations, markers) {
        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            ).slice(0, 10);
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
                if (lastSelectedMarker) {
                    lastSelectedMarker.setIcon(customIcon);
                }
                const selectedMarker = markers[location.old_id];
                if (selectedMarker) {
                    selectedMarker.setIcon(selectedIcon);
                    map.setView([location.lat, location.lon], 16);
                    selectedMarker.openPopup();
                    lastSelectedMarker = selectedMarker; // Update the last selected marker
                }
                searchBar.value = location.name;
                searchResults.style.display = 'none'; // Hide results
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none'; // Show or hide results
    }
});
