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
        iconSize: [Math.round(25 * 0.7), Math.round(41 * 0.7)], // 30% smaller
        iconAnchor: [Math.round(12 * 0.7), Math.round(41 * 0.7)], // Adjust anchor points proportionally
        popupAnchor: [30, -60]
    });

    var selectedIcon = L.icon({
        iconUrl: 'images/marker-icon-selected.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [30, -60] 
    });

    let markers = {};
    let lastSelectedMarker = null;
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data);
            locations.forEach(location => {
                const marker = L.marker([location.lat, location.lon], {icon: customIcon})
                    .addTo(map)
                    .bindPopup(`<div class="popup-content"><h4>${location.name}</h4><p>More details here...</p></div>`)
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

    function setupSearch(locations, markers) {
        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            ).slice(0, 10); // Limit results to 10 items
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

    function updatePopupContent(location) {
        const popupContent = document.getElementById(`popup-content-${location.old_id}`);
        popupContent.innerHTML = `<h4>${location.name}</h4><pre>${JSON.stringify(location, null, 2)}</pre>`;
    }

    // Hide search results when clicking outside the search bar or results
    document.addEventListener('click', function(event) {
        if (!searchBar.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
});
