document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map centered on New York City
    var map = L.map('map').setView([40.730610, -73.935242], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Fetching location data for the search bar and map plotting
    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            const locations = Object.values(data);
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
        }
    }

    function updateMapMarkers(locations, map) {
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer); // Remove existing markers
            }
        });
        locations.forEach(location => {
            L.marker([location.lat, location.lon]).addTo(map)
                .bindPopup(location.name);
        });
    }

    document.getElementById('locate-btn').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
                const nearest = findNearestLocation(userLocation, locations);
                map.setView([nearest.lat, nearest.lon], 16);
                L.marker([nearest.lat, nearest.lon]).addTo(map)
                    .bindPopup(nearest.name).openPopup();
            }, function(error) {
                alert('Error obtaining location: ' + error.message);
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    });

    function findNearestLocation(userLocation, locations) {
        return locations.reduce((prev, curr) => {
            let prevDistance = getDistance(userLocation, prev);
            let currDistance = getDistance(userLocation, curr);
            return (prevDistance < currDistance) ? prev : curr;
        });
    }

    function getDistance(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = degreesToRadians(point2.lat - point1.lat);
        const dLon = degreesToRadians(point2.lon - point1.lon);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(degreesToRadians(point1.lat)) * Math.cos(degreesToRadians(point2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a
