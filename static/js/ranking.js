document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    init();
});

async function init() {
    try {
        const data = await fetchRankingData();
        renderMostPollutedList(data);
        renderLeastPollutedList(data);
        createRankingChart(data, 'top10');
    } catch (error) {
        console.error('Error initializing ranking page:', error);
    }
}

async function fetchRankingData() {
    try {
        const response = await fetch('/api/ranking-data');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching ranking data:', error);
        return [];
    }
}

function getAQIClass(value) {
    if (value <= 50) return 'good';
    if (value <= 100) return 'moderate';
    if (value <= 150) return 'unhealthy-sensitive';
    if (value <= 200) return 'unhealthy';
    if (value <= 300) return 'very-unhealthy';
    return 'hazardous';
}

function getAQIColor(value) {
    if (value <= 50) return '#00e400';
    if (value <= 100) return '#ffff00';
    if (value <= 150) return '#ff7e00';
    if (value <= 200) return '#ff0000';
    if (value <= 300) return '#99004c';
    return '#7e0023';
}

function renderMostPollutedList(data) {
    const mostPollutedList = document.getElementById('most-polluted-list');
    if (!mostPollutedList) return;
    
    mostPollutedList.innerHTML = '';
    
    // Sort by AQI in descending order (most polluted first)
    const sortedData = [...data].sort((a, b) => b.aqi - a.aqi);
    
    // Get top 10
    const topTen = sortedData.slice(0, 10);
    
    topTen.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = `ranking-item ${getAQIClass(item.aqi)}`;
        
        listItem.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="country-name">${item.country}</span>
            <span class="aqi-value" style="color: ${getAQIColor(item.aqi)}">${item.aqi.toFixed(1)}</span>
        `;
        
        mostPollutedList.appendChild(listItem);
    });
}

function renderLeastPollutedList(data) {
    const leastPollutedList = document.getElementById('least-polluted-list');
    if (!leastPollutedList) return;
    
    leastPollutedList.innerHTML = '';
    
    // Sort by AQI in ascending order (least polluted first)
    const sortedData = [...data].sort((a, b) => a.aqi - b.aqi);
    
    // Get top 10 least polluted
    const leastTen = sortedData.slice(0, 10);
    
    leastTen.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = `ranking-item ${getAQIClass(item.aqi)}`;
        
        listItem.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="country-name">${item.country}</span>
            <span class="aqi-value" style="color: ${getAQIColor(item.aqi)}">${item.aqi.toFixed(1)}</span>
        `;
        
        leastPollutedList.appendChild(listItem);
    });
}

function createRankingChart(data, view) {
    const ctx = document.getElementById('ranking-chart').getContext('2d');
    let chartData;
    let title;
    
    if (view === 'top10') {
        // Top 10 most polluted
        const topTen = [...data].sort((a, b) => b.aqi - a.aqi).slice(0, 10);
        chartData = {
            labels: topTen.map(item => item.country),
            values: topTen.map(item => item.aqi),
            colors: topTen.map(item => getAQIColor(item.aqi))
        };
        title = 'Top 10 Most Polluted Countries (2024)';
    } else if (view === 'bottom10') {
        // Top 10 least polluted
        const bottomTen = [...data].sort((a, b) => a.aqi - b.aqi).slice(0, 10);
        chartData = {
            labels: bottomTen.map(item => item.country),
            values: bottomTen.map(item => item.aqi),
            colors: bottomTen.map(item => getAQIColor(item.aqi))
        };
        title = 'Top 10 Least Polluted Countries (2024)';
    } else if (view === 'compare') {
        // Compare major countries (top 15 by population with AQI data)
        const majorCountries = [...data]
            .filter(item => item.population > 50000000)
            .sort((a, b) => b.population - a.population)
            .slice(0, 15);
        
        chartData = {
            labels: majorCountries.map(item => item.country),
            values: majorCountries.map(item => item.aqi),
            colors: majorCountries.map(item => getAQIColor(item.aqi))
        };
        title = 'AQI Comparison of Major Countries (2024)';
    }
    
    // Destroy previous chart if it exists
    if (window.rankingChart) {
        window.rankingChart.destroy();
    }
    
    // Create chart
    window.rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'AQI Value',
                data: chartData.values,
                backgroundColor: chartData.colors,
                borderColor: chartData.colors.map(color => color === '#ffff00' ? '#999900' : color), // Darker border for yellow
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'AQI Value'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `AQI: ${context.raw.toFixed(1)}`;
                        }
                    }
                }
            }
        }
    });
}

function switchView(view) {
    // Update active button
    document.querySelectorAll('.view-options button').forEach(button => {
        if (button.getAttribute('data-view') === view) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update chart
    fetchRankingData().then(data => {
        createRankingChart(data, view);
    });
}

function setupEventListeners() {
    // Set up view switching
    const viewButtons = document.querySelectorAll('.view-options button');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });
}