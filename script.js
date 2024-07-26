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
        Object.values(data).forEach(location => {
            const initialStatus = "Bike: Classic, Ride: End"; // Initial status
            const popupContent = `
                <div class="popup-content">
                    <h4>${location.name}</h4><span class="status-info">${initialStatus}</span>
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
        setupSearch(Object.values(data), markers);
    })
    .catch(error => console.error('Error loading JSON data:', error));

    /**function updatePopupContent(location) {
        const statusInfo = document.querySelector(`.status-info[data-id="${location.old_id}"]`);
        document.querySelectorAll(`.toggle-switch input[data-id="${location.old_id}"]`).forEach(input => {
            input.addEventListener('change', function() {
                const iconType = this.getAttribute('data-type');
                const isChecked = this.checked;
                const img = this.parentNode.querySelector('span img');
                img.src = isChecked ? `images/${iconType}-on-icon.png` : `images/${iconType}-off-icon.png`;
                // Dynamically update the status based on the toggle state
                if (iconType === 'thunderbolt') {
                    const bikeType = isChecked ? "Electric" : "Classic";
                    statusInfo.textContent = `Bike: ${bikeType}, ${rideType}`;
                } else if (iconType === 'arrow-up') {
                    const rideType = isChecked ? "Start" : "End";
                    statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
                }
            });
        });
    } **/
    function updatePopupContent(location) {
        let bikeType = "Classic"; // Default value
        let rideType = "End";     // Default value
    
        const statusInfo = document.querySelector(`.status-info[data-id="${location.old_id}"]`);
        // Set initial status info text
        statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
    
        document.querySelectorAll(`.toggle-switch input[data-id="${location.old_id}"]`).forEach(input => {
            input.addEventListener('change', function() {
                const iconType = this.getAttribute('data-type');
                const isChecked = this.checked;
                const img = this.parentNode.querySelector('span img');
    
                // Update image based on toggle state
                img.src = isChecked ? `images/${iconType}-on-icon.png` : `images/${iconType}-off-icon.png`;
    
                // Update the bikeType or rideType based on the toggle type and state
                if (iconType === 'thunderbolt') {
                    bikeType = isChecked ? "Electric" : "Classic";
                } else if (iconType === 'arrow-up') {
                    rideType = isChecked ? "Start" : "End";
                }
    
                // Update the display text with current bikeType and rideType
                statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
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
                    lastSelectedMarker = selectedMarker;
                }
                searchBar.value = location.name;
                searchResults.style.display = 'none';
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
    }
});
