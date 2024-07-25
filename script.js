document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([40.730610, -73.935242], 12); // Example coordinates (centered over NYC)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let locations = [];

    // Fetching location data for the search bar
    fetch('https://github.com/pjlanger1/pjlanger1.github.io/blob/c1663b28bab1c2201485af8c7d8c507c8637d50d/ref_data/bwref082024.json')
        .then(response => response.json())
        .then(data => {
            locations = Object.values(data);
            setupSearch(locations);
        })
        .catch(error => console.error('Error loading JSON data:', error));

    function setupSearch(locations) {
        const searchBar = document.getElementById('search-bar');
        searchBar.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const filteredLocations = locations.filter(location => 
                location.name.toLowerCase().includes(value)
            );
            updateMapMarkers(filteredLocations, map);
        });

        document.getElementById('locate-btn').addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
                    const nearest = findNearestLocation(userLocation, locations);
                    map.setView([nearest.lat, nearest.lon], 16);
                    L.marker([nearest.lat, nearest.lon]).addTo(map)
                        .bindPopup(nearest.name).openPopup();
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }

    function updateMapMarkers(locations, map) {
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        locations.forEach(location => {
            L.marker([location.lat, location.lon]).addTo(map)
                .bindPopup(location.name);
        });
    }

    function findNearestLocation(userLocation, locations) {
        return locations.reduce((prev, curr) => {
            let prevDistance = getDistance(userLocation, prev);
            let currDistance = getDistance(userLocation, curr);
            return (prevDistance < currDistance) ? prev : curr;
        });
    }

    function getDistance(point1, point2) {
        // Using the Haversine formula to calculate distances more accurately over the earth's surface
        const R = 6371; // Earth's radius in kilometers
        const dLat = degreesToRadians(point2.lat - point1.lat);
        const dLon = degreesToRadians(point2.lon - point1.lon);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(degreesToRadians(point1.lat)) * Math.cos(degreesToRadians(point2.lat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    }

    function degreesToRadians(degrees) {
        return degrees * (Math.PI/180);
    }
});
