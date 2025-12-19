// js/return_history.js
import { supabase } from "./supabase.js";
import { isLoggedIn } from "./auth.js";

// Global variables
let allReturns = [];
let filteredReturns = [];
let currentPage = 1;
const itemsPerPage = 20;

// DOM Elements
const totalReturnsEl = document.getElementById("totalReturns");
const goodPercentageEl = document.getElementById("goodPercentage");
const damagedCountEl = document.getElementById("damagedCount");
const missingCountEl = document.getElementById("missingCount");
const returnsTableBody = document.getElementById("returnsTableBody");
const emptyState = document.getElementById("emptyState");
const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");

// Filter Elements
const dateFromEl = document.getElementById("dateFrom");
const dateToEl = document.getElementById("dateTo");
const conditionFilterEl = document.getElementById("conditionFilter");
const searchInputEl = document.getElementById("searchInput");
const resetFiltersBtn = document.getElementById("resetFilters");
const exportCSVBtn = document.getElementById("exportCSV");

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    const logged = await isLoggedIn();
    if (!logged) {
        window.location.href = "index.html";
        return;
    }

    await loadReturnHistory();
    setupEventListeners();
    lucide.createIcons();
});

// Load all return history data
async function loadReturnHistory() {
    try {
        // Fetch all reports that are returns or missing
        const { data: reports, error } = await supabase
            .from("reports")
            .select(`
        *,
        rentals!inner(renter_name, rent_date, return_date)
      `)
            .in("type", ["returned", "missing", "sold"])
            .order("created_at", { ascending: false });

        if (error) throw error;

        allReturns = reports || [];
        filteredReturns = [...allReturns];

        calculateAnalytics();
        renderTable();

    } catch (err) {
        console.error("Error loading return history:", err);
        alert("Error loading return history: " + err.message);
    }
}

// Calculate and display analytics
function calculateAnalytics() {
    const total = filteredReturns.length;
    const good = filteredReturns.filter(r => r.return_condition === "good").length;
    const damaged = filteredReturns.filter(r => r.return_condition === "damaged").length;
    const missing = filteredReturns.filter(r => r.return_condition === "missing").length;

    totalReturnsEl.textContent = total;
    damagedCountEl.textContent = damaged;
    missingCountEl.textContent = missing;

    if (total > 0) {
        const goodPercent = ((good / total) * 100).toFixed(1);
        goodPercentageEl.textContent = `${goodPercent}%`;
    } else {
        goodPercentageEl.textContent = "0%";
    }
}

// Render table with pagination
function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageReturns = filteredReturns.slice(startIndex, endIndex);

    if (pageReturns.length === 0) {
        returnsTableBody.innerHTML = "";
        emptyState.style.display = "block";
        pagination.style.display = "none";
        return;
    }

    emptyState.style.display = "none";

    returnsTableBody.innerHTML = pageReturns.map(returnItem => {
        const date = new Date(returnItem.created_at).toLocaleDateString();
        const clientName = returnItem.rentals?.renter_name || "Unknown";
        const condition = returnItem.return_condition || "good";
        const conditionClass = `badge-${condition}`;
        const rowClass = `row-${condition}`;

        return `
      <tr class="${rowClass}">
        <td>${date}</td>
        <td><strong>${clientName}</strong></td>
        <td>${returnItem.item_name || "Unknown Item"}</td>
        <td>${returnItem.quantity || 0}</td>
        <td><span class="badge ${conditionClass}">${condition}</span></td>
        <td>${getNotes(returnItem)}</td>
      </tr>
    `;
    }).join("");

    updatePagination();
    lucide.createIcons();
}

// Get display notes
function getNotes(returnItem) {
    if (returnItem.return_condition === "damaged" && returnItem.damage_notes) {
        return `<span style="color: #FF9800; font-weight: 500;">${returnItem.damage_notes}</span>`;
    }
    return returnItem.notes || "-";
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

    if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
    }

    pagination.style.display = "flex";
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Apply filters
function applyFilters() {
    const dateFrom = dateFromEl.value;
    const dateTo = dateToEl.value;
    const condition = conditionFilterEl.value;
    const searchTerm = searchInputEl.value.toLowerCase();

    filteredReturns = allReturns.filter(returnItem => {
        // Date filter
        if (dateFrom) {
            const returnDate = new Date(returnItem.created_at).toISOString().split('T')[0];
            if (returnDate < dateFrom) return false;
        }
        if (dateTo) {
            const returnDate = new Date(returnItem.created_at).toISOString().split('T')[0];
            if (returnDate > dateTo) return false;
        }

        // Condition filter
        if (condition && returnItem.return_condition !== condition) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const clientName = (returnItem.rentals?.renter_name || "").toLowerCase();
            const itemName = (returnItem.item_name || "").toLowerCase();
            if (!clientName.includes(searchTerm) && !itemName.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
    calculateAnalytics();
    renderTable();
}

// Reset filters
function resetFilters() {
    dateFromEl.value = "";
    dateToEl.value = "";
    conditionFilterEl.value = "";
    searchInputEl.value = "";

    filteredReturns = [...allReturns];
    currentPage = 1;
    calculateAnalytics();
    renderTable();
}

// Export to CSV
function exportToCSV() {
    if (filteredReturns.length === 0) {
        alert("No data to export");
        return;
    }

    // CSV Header
    let csv = "Date,Client,Item,Quantity,Condition,Type,Notes,Damage Notes\n";

    // CSV Rows
    filteredReturns.forEach(returnItem => {
        const date = new Date(returnItem.created_at).toLocaleDateString();
        const client = (returnItem.rentals?.renter_name || "Unknown").replace(/,/g, ";");
        const item = (returnItem.item_name || "Unknown").replace(/,/g, ";");
        const quantity = returnItem.quantity || 0;
        const condition = returnItem.return_condition || "good";
        const type = returnItem.type || "returned";
        const notes = (returnItem.notes || "").replace(/,/g, ";").replace(/\n/g, " ");
        const damageNotes = (returnItem.damage_notes || "").replace(/,/g, ";").replace(/\n/g, " ");

        csv += `${date},${client},${item},${quantity},${condition},${type},"${notes}","${damageNotes}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `return-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Setup Event Listeners
function setupEventListeners() {
    // Filter changes
    dateFromEl?.addEventListener("change", applyFilters);
    dateToEl?.addEventListener("change", applyFilters);
    conditionFilterEl?.addEventListener("change", applyFilters);
    searchInputEl?.addEventListener("input", applyFilters);

    // Buttons
    resetFiltersBtn?.addEventListener("click", resetFilters);
    exportCSVBtn?.addEventListener("click", exportToCSV);

    // Pagination
    prevPageBtn?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });

    nextPageBtn?.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}
