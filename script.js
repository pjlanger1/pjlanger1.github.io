document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([40.730610, -73.935242], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
        maxZoom: 19,
        subdomains: 'abcd',
        minZoom: 0
    }).addTo(map);

    // Define a custom icon
    var customIcon = L.icon({
        iconUrl: 'images/marker-icon.png',
        iconSize: [25, 41], // Size of the icon
        iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
        popupAnchor: [1, -34] // Point from which the popup should open relative to the iconAnchor
    });

    let locations = [];

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            locations = Object.values(data);
            setupSearch(locations);
            updateMapMarkers(locations, map); // Initially plot all markers
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
            updateMapMarkers(filteredLocations, map);
        });

        function displaySearchResults(filteredLocations) {
            searchResults.innerHTML = '';
            filteredLocations.forEach(location => {
                const div = document.createElement('div');
                div.textContent = location.name;
                div.className = 'search-result-item';
                div.onclick = function() {
                    map.setView([location.lat, location.lon], 16);
                    map.openPopup(location.name, [location.lat, location.lon]);
                    searchBar.value = location.name; // Fill the search bar with the selected location name
                    searchResults.innerHTML = ''; // Clear search results after selection
                };
                searchResults.appendChild(div);
            });
            searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
        }
    }

    function updateMapMarkers(locations, map) {
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer); // Remove existing markers
            }
        });
        locations.forEach(location => {
            L.marker([location.lat, location.lon], {icon: customIcon}).addTo(map) // Use custom icon
                .bindPopup(location.name);
        });
    }
});
