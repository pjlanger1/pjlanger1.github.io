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
        popupAnchor: [30, -50]
    });

    let markers = {};
    let lastSelectedMarker = null;
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');

    fetch('https://raw.githubusercontent.com/pjlanger1/pjlanger1.github.io/6b81765ad8c9f9a14346688e531a5a6480420341/ref_data/bwref082024_2.json')
    .then(response => response.json())
    .then(data => {
        Object.values(data).forEach(location => {
            const marker = L.marker([location.lat, location.lon], {icon: customIcon, locationData: location})
                .addTo(map)
                .bindPopup(getPopupContent(location))
                .on('click', function() {
                    selectMarker(location.old_id);
                });
            markers[location.old_id] = marker;
        });
        setupSearch(Object.values(data), markers);
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
                <canvas id="chart-${location.old_id}" width="400" height="200"></canvas>
                <div id="popup-data-${location.old_id}"></div>
            </div>
        `;
    }

    function setupSearch(locations, markers) {
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
                searchBar.value = location.name;
                searchResults.style.display = 'none';
                selectMarker(location.old_id);
            };
            searchResults.appendChild(div);
        });
        searchResults.style.display = filteredLocations.length > 0 ? 'block' : 'none';
    }

    function selectMarker(old_id) {
        if (lastSelectedMarker) {
            markers[lastSelectedMarker].setIcon(customIcon);
        }
        const newSelectedMarker = markers[old_id];
        newSelectedMarker.setIcon(selectedIcon);
        map.setView(newSelectedMarker.getLatLng(), 16);
        newSelectedMarker.openPopup();
        lastSelectedMarker = old_id;
        updatePopupContent(newSelectedMarker.getPopup().getContent(), newSelectedMarker.options.locationData);
    }

    function updatePopupContent(content, location) {
        const ctx = document.getElementById(`chart-${location.old_id}`).getContext('2d');
        let chart = window.chartInstances = window.chartInstances || {};
    
        const statusInfo = document.querySelector(`.status-info[data-id="${location.old_id}"]`);
    
        // Function to update the chart and status based on toggle states
        function updateBasedOnToggles() {
            const powerToggle = document.querySelector(`.power-toggle[data-id="${location.old_id}"]`);
            const trendToggle = document.querySelector(`.trend-toggle[data-id="${location.old_id}"]`);
    
            const bikeType = powerToggle.checked ? "Electric" : "Classic";
            const rideType = trendToggle.checked ? "Start" : "End";
            statusInfo.textContent = `Bike: ${bikeType}, Ride: ${rideType}`;
    
            if (!chart[location.old_id]) {
                chart[location.old_id] = new Chart(ctx, {
                    type: 'bar',
                    data: getChartData(location, bikeType, rideType),
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            } else {
                const newChartData = getChartData(location, bikeType, rideType);
                const existingChart = chart[location.old_id];
                existingChart.data = newChartData;
                existingChart.update();
            }
        }
    
        // Initialize chart and status when popup opens
        updateBasedOnToggles();
    
        // Event listeners for toggle changes
        document.querySelectorAll(`.toggle-switch input[data-id="${location.old_id}"]`).forEach(input => {
            input.addEventListener('change', function() {
                const img = this.parentNode.querySelector('span img');
                const iconType = this.getAttribute('data-type');
                img.src = this.checked ? `images/${iconType}-on-icon.png` : `images/${iconType}-off-icon.png`;
                updateBasedOnToggles();  // Update everything based on new toggle states
            });
        });
    }

    function chartOptions(location) {
        const currentHour = new Date().getHours(); // Current hour
        return {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            mode: 'vertical',
                            scaleID: 'x-axis-0',
                            value: currentHour,
                            borderColor: 'red',
                            borderWidth: 3,
                            label: {
                                enabled: true,
                                content: 'Current Hour'
                            }
                        }
                    }
                }
            }
        };
    }

    function getChartData(location, bikeType, rideType) {
        // Log the location data for debugging
        console.log("Processing data for:", location.name, "with bike type:", bikeType, "and ride type:", rideType);
    
        // Check if the necessary data paths are present in the location data
        if (!location.data || !location.data[bikeType.toLowerCase() + '_bike'] || !location.data[bikeType.toLowerCase() + '_bike'][rideType.toLowerCase() + '_count']) {
            console.error("Required data is missing for", location.name, ":", bikeType, rideType);
            return null; // Return null or an appropriate default structure if data is missing
        }
    
        // Example labels for each hour of the day
        const labels = Array.from({ length: 24 }, (_, i) => `Hour ${i + 1}`);
        const currentHour = new Date().getHours(); // Zero-based index of the current hour
    
        // Access the data based on provided bikeType and rideType
        const dataPath = bikeType.toLowerCase() + '_bike';
        const countPath = rideType.toLowerCase() + '_count';
        const counts = location.data[dataPath][countPath];
    
        // Create an array with zeros and set the value at the current hour index to a higher number to simulate a line
        const hourIndicator = Array(24).fill(0);
        hourIndicator[currentHour] = Math.max(...counts) * 1.2; // Ensure the line is taller than the highest bar
    
        return {
            labels: labels,
            datasets: [
                {
                    label: `${bikeType} Bike ${rideType} Count`,
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Current Hour',
                    data: hourIndicator,
                    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red color for the current hour indicator
                    borderColor: 'rgba(255, 0, 0, 1)',
                    borderWidth: 2,
                    type: 'bar', // Render this dataset as a line
                    fill: false, // No fill under the line
                    pointRadius: 0 // No points on the line
                }
            ]
        };
    }



    // Hide search results when clicking outside the search bar or results
    document.addEventListener('click', function(event) {
        if (!searchBar.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
});
