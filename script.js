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

    const foof = 0;

    var selectedIcon = L.icon({
        iconUrl: 'images/marker-icon-selected.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    let markers = {};

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data);
            locations.forEach(location => {
                const marker = L.marker([location.lat, location.lon], {icon: customIcon})
                    .addTo(map)
                    .bindPopup(location.name);
                markers[location.old_id] = marker;
            });
            setupSearch(locations);
        })
        .catch(error => console.error('Error loading JSON data:', error));

    function setupSearch(locations) {
        const searchBar = document.getElementById('search-bar');
        const searchResults = document.getElementById('search-results');

        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            ).slice(0, 10); // Limit results to 10 items
            displaySearchResults(filteredLocations);
        });

        function displaySearchResults(filteredLocations) {
            searchResults.innerHTML = '';
            filteredLocations.forEach(location => {
                const div = document.createElement('div');
                div.textContent = location.name;
                div.className = 'search-result-item';
                div.onclick = function() {
                    Object.values(markers).forEach(marker => marker.setIcon(customIcon)); // Reset all markers
                    markers[location.old_id].setIcon(selectedIcon); // Highlight the selected marker
                    map.setView([location.lat, location.lon], 13); // Zoom to about 2 miles
                    markers[location.old_id].openPopup();
                    searchBar.value = location.name; // Fill the search bar with the selected location name
                    searchResults.innerHTML = ''; // Clear search results after selection
                    searchResults.style.display = 'none'; // Hide results
                };
                searchResults.appendChild(div);
            });
            searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
        }
    }
});
