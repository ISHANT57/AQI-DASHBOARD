document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    init();
});

let globalData = [];
let currentPage = 1;
let rowsPerPage = 50;
let filteredData = [];

async function init() {
    try {
        globalData = await fetchCountriesData();
        filteredData = [...globalData];
        renderTable(filteredData, currentPage, rowsPerPage);
        renderPagination(filteredData.length, currentPage, rowsPerPage);
    } catch (error) {
        console.error('Error initializing trends page:', error);
    }
}

async function fetchCountriesData() {
    try {
        const response = await fetch('/api/country-trends');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching country data:', error);
        return [];
    }
}

function getAQIClass(value) {
    if (!value) return 'no-data';
    if (value <= 50) return 'good';
    if (value <= 100) return 'moderate';
    if (value <= 150) return 'unhealthy-sensitive';
    if (value <= 200) return 'unhealthy';
    if (value <= 300) return 'very-unhealthy';
    return 'hazardous';
}

function formatNumber(num) {
    if (!num && num !== 0) return '-';
    return num.toLocaleString();
}

function renderTable(data, page, rowsPerPage) {
    const tableBody = document.getElementById('countryTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    
    paginatedData.forEach((country, index) => {
        const row = document.createElement('tr');
        
        // Add rank column
        const rankCell = document.createElement('td');
        rankCell.textContent = startIndex + index + 1;
        row.appendChild(rankCell);
        
        // Add country column
        const countryCell = document.createElement('td');
        countryCell.textContent = country.country;
        countryCell.className = 'country-cell';
        row.appendChild(countryCell);
        
        // Add year columns (2024 to 2018)
        for (let i = 0; i < 7; i++) {
            const yearCell = document.createElement('td');
            const value = country.years[i];
            
            if (value) {
                yearCell.textContent = value.toFixed(1);
                yearCell.className = getAQIClass(value);
            } else {
                yearCell.textContent = '-';
                yearCell.className = 'no-data';
            }
            
            row.appendChild(yearCell);
        }
        
        // Add population column
        const popCell = document.createElement('td');
        popCell.textContent = formatNumber(country.population);
        row.appendChild(popCell);
        
        tableBody.appendChild(row);
    });
}

function renderPagination(totalItems, currentPage, rowsPerPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    // Create previous button
    if (totalPages > 1) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '« Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => changePage(currentPage - 1));
        pagination.appendChild(prevButton);
    }
    
    // Create page buttons
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'pagination-btn active' : 'pagination-btn';
        pageButton.addEventListener('click', () => changePage(i));
        pagination.appendChild(pageButton);
    }
    
    // Create next button
    if (totalPages > 1) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next »';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => changePage(currentPage + 1));
        pagination.appendChild(nextButton);
    }
}

function changePage(newPage) {
    currentPage = newPage;
    renderTable(filteredData, currentPage, rowsPerPage);
    renderPagination(filteredData.length, currentPage, rowsPerPage);
    
    // Scroll to top of table
    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

function filterData(data, searchTerm) {
    if (!searchTerm) return data;
    
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter(country => 
        country.country.toLowerCase().includes(lowerTerm)
    );
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filteredData = filterData(globalData, this.value);
            currentPage = 1; // Reset to first page when searching
            renderTable(filteredData, currentPage, rowsPerPage);
            renderPagination(filteredData.length, currentPage, rowsPerPage);
        });
    }
    
    // Rows per page selection
    const rowsSelect = document.getElementById('rowsPerPage');
    if (rowsSelect) {
        rowsSelect.addEventListener('change', function() {
            rowsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page when changing rows per page
            renderTable(filteredData, currentPage, rowsPerPage);
            renderPagination(filteredData.length, currentPage, rowsPerPage);
        });
    }
}