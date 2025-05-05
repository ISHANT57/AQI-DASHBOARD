document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart
    let aqiChart;
    
    // Get DOM elements
    const graphType = document.getElementById('graphType');
    const yearSelect = document.getElementById('yearSelect');
    const yearLabel = document.getElementById('yearLabel');
    const country1 = document.getElementById('country1');
    const country2 = document.getElementById('country2');
    const country3 = document.getElementById('country3');
    const updateButton = document.getElementById('updateGraph');
    const sunToggle = document.getElementById('sun-toggle');
    
    // Add event listeners
    graphType.addEventListener('change', handleGraphTypeChange);
    updateButton.addEventListener('click', updateGraph);
    sunToggle.addEventListener('click', toggleTheme);
    
    // Initial setup
    fetchCountryData();
    
    // Toggle light/dark theme
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
    }
    
    // Handle graph type change
    function handleGraphTypeChange() {
        const showYear = graphType.value === 'bar' || graphType.value === 'bubble';
        yearLabel.style.display = showYear ? 'inline-block' : 'none';
        yearSelect.style.display = showYear ? 'inline-block' : 'none';
    }
    
    function fetchCountryData() {
        fetch('/api/country-graph-data')
            .then(response => response.json())
            .then(data => {
                populateCountryDropdowns(data);
                // Create initial graph
                updateGraph();
            })
            .catch(error => {
                console.error('Error fetching country data:', error);
            });
    }
    
    function populateCountryDropdowns(data) {
        // Sort countries alphabetically
        const sortedCountries = data.sort((a, b) => a.country.localeCompare(b.country));
        
        // Create country options
        const countryOptions = sortedCountries.map(country => {
            return `<option value="${country.country}">${country.country}</option>`;
        });
        
        // Set default countries
        country1.innerHTML = countryOptions.join('');
        country2.innerHTML = countryOptions.join('');
        country3.innerHTML = countryOptions.join('');
        
        // Set some default selections
        country1.value = 'India';
        country2.value = 'Bangladesh';
        country3.value = 'United States';
    }
    
    function updateGraph() {
        fetch('/api/country-graph-data')
            .then(response => response.json())
            .then(data => {
                const selectedCountries = [
                    country1.value,
                    country2.value,
                    country3.value
                ];
                
                const filteredData = data.filter(country => 
                    selectedCountries.includes(country.country)
                );
                
                const type = graphType.value;
                const selectedYear = yearSelect.value;
                
                let chartOptions;
                
                if (type === 'line') {
                    // Line chart for trends over years
                    chartOptions = {
                        type: 'line',
                        data: {
                            labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                            datasets: filteredData.map((country, index) => {
                                const colors = ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'];
                                return {
                                    label: country.country,
                                    data: country.years.reverse(), // Reverse to get chronological order
                                    fill: false,
                                    borderColor: colors[index % colors.length],
                                    tension: 0.1
                                };
                            })
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    title: {
                                        display: true,
                                        text: 'AQI Value'
                                    },
                                    beginAtZero: true
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Year'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'AQI Trends (2018-2024)'
                                }
                            }
                        }
                    };
                } else if (type === 'bar') {
                    // Bar chart for specific year comparison
                    const yearIndex = 2024 - parseInt(selectedYear);
                    chartOptions = {
                        type: 'bar',
                        data: {
                            labels: filteredData.map(country => country.country),
                            datasets: [{
                                label: `AQI Values (${selectedYear})`,
                                data: filteredData.map(country => country.years[yearIndex]),
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.7)',
                                    'rgba(54, 162, 235, 0.7)',
                                    'rgba(255, 206, 86, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',
                                    'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    title: {
                                        display: true,
                                        text: 'AQI Value'
                                    },
                                    beginAtZero: true
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Air Quality Index Comparison (${selectedYear})`
                                }
                            }
                        }
                    };
                } else if (type === 'bubble') {
                    // Bubble chart with population data
                    const yearIndex = 2024 - parseInt(selectedYear);
                    chartOptions = {
                        type: 'bubble',
                        data: {
                            datasets: filteredData.map((country, index) => {
                                const colors = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)'];
                                const borderColors = ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'];
                                
                                // Calculate bubble size based on population (scaled down)
                                const popScale = country.population ? Math.sqrt(country.population) / 500 : 10;
                                
                                return {
                                    label: country.country,
                                    data: [{
                                        x: index,
                                        y: country.years[yearIndex] || 0,
                                        r: popScale
                                    }],
                                    backgroundColor: colors[index % colors.length],
                                    borderColor: borderColors[index % borderColors.length]
                                };
                            })
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: {
                                    type: 'category',
                                    labels: filteredData.map(country => country.country)
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'AQI Value'
                                    },
                                    beginAtZero: true
                                }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const country = filteredData[context.dataIndex];
                                            return [
                                                `${country.country}`,
                                                `AQI: ${country.years[yearIndex] || 'No data'}`,
                                                `Population: ${country.population ? country.population.toLocaleString() : 'Unknown'}`
                                            ];
                                        }
                                    }
                                },
                                title: {
                                    display: true,
                                    text: `AQI and Population Comparison (${selectedYear})`
                                }
                            }
                        }
                    };
                }
                
                createChart(chartOptions);
            })
            .catch(error => {
                console.error('Error updating graph:', error);
            });
    }
    
    function createChart(options) {
        const ctx = document.getElementById('aqiChart').getContext('2d');
        
        // Destroy previous chart if it exists
        if (aqiChart) {
            aqiChart.destroy();
        }
        
        // Create new chart
        aqiChart = new Chart(ctx, options);
    }
});