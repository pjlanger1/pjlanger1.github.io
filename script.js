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
    let lastSelectedMarker = null;
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
                    if (lastSelectedMarker) {
                        lastSelectedMarker.setIcon(customIcon);
                    }
                    marker.setIcon(selectedIcon);
                    lastSelectedMarker = marker;
                    updatePopupContent(location);
                });
            markers[location.old_id] = marker;
        });
        setupSearch(Object.values(data), markers);
    })
    .catch(error => console.error('Error loading JSON data:', error));

    function getPopupContent(location) {
        return `
            <div class="popup-content" data-id="${location.old_id}">
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
                searchBar.value = ''; // Clear search bar on selection
                searchResults.style.display = 'none'; // Hide search results
                const selectedMarker = markers[location.old_id];
                if (selectedMarker) {
                    map.setView([selectedMarker.getLatLng()], 16); // Zoom in
                    selectedMarker.openPopup(); // Open the popup
                }
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
    }

    function updatePopupContent(location) {
        const statusInfo = document.querySelector(`.status-info[data-id="${location.old_id}"]`);
        document.querySelectorAll(`.toggle-switch input[data-id="${location.old_id}"]`).forEach(input => {
            input.addEventListener('change', function() {
                const iconType = this.getAttribute('data-type');
                const isChecked = this.checked;
                const img = this.parentNode.querySelector('span img');
                img.src = isChecked ? `images/${iconType}-on-icon.png` : `images/${iconType}-off-icon.png`;
                const bikeType = document.querySelector(`.power-toggle[data-id="${location.old_id}"]`).checked ? "Electric" : "Classic";
                const rideType = document.querySelector(`.trend-toggle[data-id="${location.old_id}"]`).checked ? "Start" : "End";
                statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
            });
        });
    }

    map.on('popupopen', function(e) {
        attachToggleListeners(e.popup._source.options.locationId);
    });

    function attachToggleListeners(id) {
        document.querySelectorAll(`.toggle-switch input[data-id="${id}"]`).forEach(input => {
            input.removeEventListener('change', handleToggleChange);
            input.addEventListener('change', handleToggleChange);
        });
    }

    function handleToggleChange() {
        const iconType = this.getAttribute('data-type');
        const isChecked = this.checked;
        const img = this.parentNode.querySelector('span img');
        img.src = isChecked ? `images/${iconType}-on-icon.png` : `images/${iconType}-off-icon.png`;

        const locationId = this.getAttribute('data-id');
        const statusInfo = document.querySelector(`.popup-content[data-id="${locationId}"] .status-info`);
        const bikeType = document.querySelector(`.power-toggle[data-id="${locationId}"]`).checked ? "Electric" : "Classic";
        const rideType = document.querySelector(`.trend-toggle[data-id="${locationId}"]`).checked ? "Start" : "End";
        statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
    }
});
