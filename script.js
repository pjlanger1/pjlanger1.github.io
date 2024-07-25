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
        })
        .catch(error => console.error('Error loading JSON data:', error));
});
