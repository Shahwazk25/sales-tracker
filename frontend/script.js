// =====================================================
// SALES TRACKER - SCRIPT.JS
// =====================================================

const API_URL = "http://localhost:3000/api/sales";

let sales = [];

const SALES_PER_PAGE = 30;
let salesHistoryCurrentPage = 1;
let dateWiseCurrentPage = 1;
let historicalSalesCurrentPage = 1;

let salesChart = null;
let categoryChart = null;


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadSales();

});


// =====================================================
// LOAD SALES
// =====================================================

async function loadSales() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load sales");
        }

        const data = await response.json();

        sales = data.map(sale => ({

            ...sale,

            id: Number(sale.id),

            quantity: Number(sale.quantity || 0),

            price: Number(sale.price || 0),

            total:
                Number(sale.total) ||
                (
                    Number(sale.quantity || 0) *
                    Number(sale.price || 0)
                )

        }));


        // Refresh all parts of application

        displaySales();

        updateDashboard();

        updateChart();

        updateCategoryChart();

        updateTopProducts();

        updateSalesSummary();

        updateDateWiseReport();

        populateHistoricalYears();
        
        updateHistoricalSalesReport();


    } catch (error) {

        console.error(
            "Error loading sales:",
            error
        );

    }

}


// =====================================================
// DISPLAY SALES
// =====================================================


function displaySales(data = sales) {
    const table = document.getElementById("salesTable");
    if (!table) return;

    table.innerHTML = "";

    // Keep the current page within the available range.
    const totalPages = Math.max(
        1,
        Math.ceil(data.length / SALES_PER_PAGE)
    );

    if (salesHistoryCurrentPage > totalPages) {
        salesHistoryCurrentPage = totalPages;
    }

    if (salesHistoryCurrentPage < 1) {
        salesHistoryCurrentPage = 1;
    }

    // Show the selected 30 records only.
    const sortedSales = [...data].reverse();
    const startIndex =
        (salesHistoryCurrentPage - 1) * SALES_PER_PAGE;

    const pageSales = sortedSales.slice(
        startIndex,
        startIndex + SALES_PER_PAGE
    );

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No sales found
                </td>
            </tr>
        `;

        updateSalesHistoryPagination(0, 1);
        return;
    }

    pageSales.forEach(sale => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(sale.date || "")}</td>
            <td>${escapeHTML(sale.product || "")}</td>
            <td>${escapeHTML(sale.category || "")}</td>
            <td>${sale.quantity}</td>
            <td>₹${Number(sale.price).toLocaleString("en-IN")}</td>
            <td>
                <strong>
                    ₹${Number(sale.total).toLocaleString("en-IN")}
                </strong>
            </td>
            <td>
                <button
                    class="edit-btn"
                    onclick="editSale(${sale.id})"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteSale(${sale.id})"
                >
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });

    updateSalesHistoryPagination(data.length, totalPages);
}

function updateSalesHistoryPagination(totalRecords, totalPages) {
    const table = document.getElementById("salesTable");
    if (!table) return;

    // Create the pagination area once, beneath the table.
    let pagination = document.getElementById("salesHistoryPagination");

    if (!pagination) {
        const tableContainer = table.closest(".table-container");
        if (!tableContainer) return;

        pagination = document.createElement("div");
        pagination.id = "salesHistoryPagination";

        pagination.style.display = "flex";
        pagination.style.justifyContent = "center";
        pagination.style.alignItems = "center";
        pagination.style.gap = "12px";
        pagination.style.flexWrap = "wrap";
        pagination.style.padding = "16px";
        pagination.style.marginTop = "8px";

        tableContainer.insertAdjacentElement("afterend", pagination);
    }

    const firstRecord =
        totalRecords === 0
            ? 0
            : (salesHistoryCurrentPage - 1) * SALES_PER_PAGE + 1;

    const lastRecord = Math.min(
        salesHistoryCurrentPage * SALES_PER_PAGE,
        totalRecords
    );

    pagination.innerHTML = `
        <button
            class="edit-btn"
            id="salesHistoryPrevious"
            ${salesHistoryCurrentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>
            Showing ${firstRecord}–${lastRecord} of ${totalRecords}
            &nbsp; | &nbsp;
            Page ${salesHistoryCurrentPage} of ${totalPages}
        </span>

        <button
            class="edit-btn"
            id="salesHistoryNext"
            ${salesHistoryCurrentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    document.getElementById("salesHistoryPrevious").onclick = () => {
        if (salesHistoryCurrentPage > 1) {
            salesHistoryCurrentPage--;
            displaySales(getCurrentlyFilteredSales());
        }
    };

    document.getElementById("salesHistoryNext").onclick = () => {
        if (salesHistoryCurrentPage < totalPages) {
            salesHistoryCurrentPage++;
            displaySales(getCurrentlyFilteredSales());
        }
    };
}

function getCurrentlyFilteredSales() {
    const search = (
        document.getElementById("search")?.value || ""
    ).trim().toLowerCase();

    const category =
        document.getElementById("categoryFilter")?.value || "";

    const fromDate =
        document.getElementById("fromDate")?.value || "";

    const toDate =
        document.getElementById("toDate")?.value || "";

    return sales.filter(sale => {
        const product = (sale.product || "").toLowerCase();
        const saleDate = sale.date || "";

        return (
            product.includes(search) &&
            (!category || sale.category === category) &&
            (!fromDate || saleDate >= fromDate) &&
            (!toDate || saleDate <= toDate)
        );
    });
}



// =====================================================
// ADD SALE
// =====================================================

async function addSale(event) {

    event.preventDefault();


    const product =
        document
            .getElementById("product")
            .value
            .trim();


    const category =
        document
            .getElementById("category")
            .value;


    const quantity =
        Number(
            document
                .getElementById("quantity")
                .value
        );


    const price =
        Number(
            document
                .getElementById("price")
                .value
        );


    const date =
        document
            .getElementById("saleDate")
            .value;


    if (
    !product ||
    !category ||
    !date ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(price) ||
    price < 0
) {

    alert(
        "Please enter valid sale details.\n\n" +
        "• Product name is required\n" +
        "• Category is required\n" +
        "• Date is required\n" +
        "• Quantity must be a positive whole number\n" +
        "• Price cannot be negative"
    );

    return;

}


    const total =
        quantity * price;


    const sale = {

        product,
        category,
        quantity,
        price,
        total,
        date

    };


    try {

        const response =
            await fetch(
                API_URL,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(sale)

                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to add sale"
            );

        }


        alert(
            "Sale added successfully!"
        );


        document
            .querySelector("#saleForm form")
            .reset();


        closeSaleForm();


        await loadSales();


    } catch (error) {

        console.error(
            "Error adding sale:",
            error
        );


        alert(
            "Could not add sale."
        );

    }

}


// =====================================================
// EDIT SALE
// =====================================================

async function editSale(id) {

    const sale =
        sales.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!sale) {

        alert("Sale not found.");

        return;

    }


    const product =
        prompt(
            "Product Name:",
            sale.product
        );


    if (product === null) return;


    const category =
        prompt(
            "Category:",
            sale.category
        );


    if (category === null) return;


    const quantity =
        prompt(
            "Quantity:",
            sale.quantity
        );


    if (quantity === null) return;


    const price =
        prompt(
            "Unit Price:",
            sale.price
        );


    if (price === null) return;


    const date =
        prompt(
            "Sale Date (YYYY-MM-DD):",
            sale.date
        );


    if (date === null) return;


    const newQuantity =
        Number(quantity);


    const newPrice =
        Number(price);


    if (
        !product.trim() ||
        !category.trim() ||
        newQuantity <= 0 ||
        newPrice < 0 ||
        !date
    ) {

        alert(
            "Invalid information."
        );

        return;

    }


    const updatedSale = {

        product:
            product.trim(),

        category:
            category.trim(),

        quantity:
            newQuantity,

        price:
            newPrice,

        total:
            newQuantity * newPrice,

        date

    };


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            updatedSale
                        )

                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to update sale"
            );

        }


        alert(
            "Sale updated successfully!"
        );


        await loadSales();


    } catch (error) {

        console.error(
            "Error updating sale:",
            error
        );


        alert(
            "Could not update sale."
        );

    }

}


// =====================================================
// DELETE SALE
// =====================================================

async function deleteSale(id) {

    const sale =
        sales.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!sale) {

        alert("Sale not found.");

        return;

    }


    const confirmed =
        confirm(
            `Delete "${sale.product}" sale?`
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete sale"
            );

        }


        alert(
            "Sale deleted successfully!"
        );


        await loadSales();


    } catch (error) {

        console.error(
            "Error deleting sale:",
            error
        );


        alert(
            "Could not delete sale."
        );

    }

}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

    const todaySales =
        document.getElementById(
            "todaySales"
        );


    const weekSales =
        document.getElementById(
            "weekSales"
        );


    const monthSales =
        document.getElementById(
            "monthSales"
        );


    const totalSalesElement =
        document.getElementById(
            "totalSales"
    );


    const today =
        new Date();


    const todayString =
        formatDate(today);


    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    // Total sales from all records
    const totalSales =
        sales.reduce(
            (sum, sale) =>
                sum + Number(sale.total || 0),
            0
        );


    sales.forEach(sale => {

        const saleDate =
            parseDate(sale.date);


        const total =
            Number(sale.total) || 0;


        if (!saleDate) return;


        if (
            formatDate(saleDate) ===
            todayString
        ) {

            todayTotal += total;

        }


        if (
            isWithinLastDays(
                saleDate,
                7
            )
        ) {

            weekTotal += total;

        }


        if (
            saleDate.getMonth() ===
                today.getMonth() &&
            saleDate.getFullYear() ===
                today.getFullYear()
        ) {

            monthTotal += total;

        }

    });


    if (todaySales) {

        todaySales.textContent =
            `₹${todayTotal.toLocaleString(
                "en-IN"
            )}`;

    }


    if (weekSales) {

        weekSales.textContent =
            `₹${weekTotal.toLocaleString(
                "en-IN"
            )}`;

    }


    if (monthSales) {

        monthSales.textContent =
            `₹${monthTotal.toLocaleString(
                "en-IN"
            )}`;

    }


    if (totalSalesElement) {

        totalSalesElement.textContent =
            `₹${totalSales.toLocaleString("en-IN")}`;

    }

}


// =====================================================
// SALES OVERVIEW CHART
// =====================================================

function updateChart() {

    const canvas =
        document.getElementById(
            "salesChart"
        );


    if (!canvas) return;


    const filter =
        document
            .getElementById(
                "chartFilter"
            )?.value ||
        "week";


    const days =
        filter === "month"
            ? 30
            : 7;


    const labels = [];
    const values = [];


    for (
        let i = days - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date();


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            date.getDate() - i
        );


        const dateString =
            formatDate(date);


        labels.push(
            formatChartDate(date)
        );


        const total =
            sales
                .filter(
                    sale =>
                        formatDate(
                            parseDate(
                                sale.date
                            )
                        ) ===
                        dateString
                )
                .reduce(
                    (
                        sum,
                        sale
                    ) =>
                        sum +
                        Number(
                            sale.total || 0
                        ),
                    0
                );


        values.push(total);

    }


    if (salesChart) {

        salesChart.destroy();

    }


    salesChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Sales",

                            data:
                                values,

                            borderWidth:
                                3,

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


// =====================================================
// SALES BY CATEGORY
// =====================================================

function updateCategoryChart() {

    const canvas =
        document.getElementById(
            "categoryChart"
        );


    if (!canvas) return;


    const categoryTotals = {};


    sales.forEach(sale => {

        const category =
            sale.category ||
            "Other";


        const total =
            Number(
                sale.total
            ) || 0;


        if (
            !categoryTotals[category]
        ) {

            categoryTotals[category] = 0;

        }


        categoryTotals[category] +=
            total;

    });


    const labels =
        Object.keys(
            categoryTotals
        );


    const values =
        Object.values(
            categoryTotals
        );


    if (categoryChart) {

        categoryChart.destroy();

    }


    categoryChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Sales Revenue",

                            data:
                                values,

                            borderWidth:
                                1

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


// =====================================================
// TOP-SELLING PRODUCTS
// =====================================================

function updateTopProducts(
    data = sales
) {

    const table =
        document.getElementById(
            "topProductsTable"
        );


    if (!table) return;


    table.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="text-align:center;"
                >
                    No sales data available
                </td>

            </tr>

        `;

        return;

    }


    const products = {};


    data.forEach(sale => {

        const product =
            (
                sale.product ||
                "Unknown"
            ).trim();


        const quantity =
            Number(
                sale.quantity
            ) || 0;


        const revenue =
            Number(
                sale.total
            ) ||
            (
                quantity *
                Number(
                    sale.price || 0
                )
            );


        if (
            !products[product]
        ) {

            products[product] = {

                product,

                unitsSold: 0,

                revenue: 0

            };

        }


        products[product].unitsSold +=
            quantity;


        products[product].revenue +=
            revenue;

    });


    const rankedProducts =
        Object.values(products)
            .sort(
                (a, b) =>
                    b.unitsSold -
                    a.unitsSold ||
                    b.revenue -
                    a.revenue
            )
            .slice(0, 10);


    rankedProducts.forEach(
        (
            product,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${index + 1}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        product.product
                    )}
                </td>

                <td>
                    ${product.unitsSold.toLocaleString(
                        "en-IN"
                    )}
                </td>

                <td>
                    <strong>
                        ₹${product.revenue.toLocaleString(
                            "en-IN"
                        )}
                    </strong>
                </td>

            `;


            table.appendChild(row);

        }
    );

}


// =====================================================
// SALES SUMMARY
// =====================================================

function updateSalesSummary() {

    const totalRevenueElement =
        document.getElementById(
            "reportTotalRevenue"
        );


    const totalUnitsElement =
        document.getElementById(
            "reportTotalUnits"
        );


    const averageSaleElement =
        document.getElementById(
            "reportAverageSale"
        );


    const bestProductElement =
        document.getElementById(
            "reportBestProduct"
        );


    if (
        !sales ||
        sales.length === 0
    ) {

        if (totalRevenueElement)
            totalRevenueElement.textContent =
                "₹0";


        if (totalUnitsElement)
            totalUnitsElement.textContent =
                "0";


        if (averageSaleElement)
            averageSaleElement.textContent =
                "₹0";


        if (bestProductElement)
            bestProductElement.textContent =
                "-";


        return;

    }


    const totalRevenue =
        sales.reduce(
            (
                sum,
                sale
            ) => {

                const total =
                    Number(
                        sale.total
                    ) ||
                    (
                        Number(
                            sale.quantity || 0
                        ) *
                        Number(
                            sale.price || 0
                        )
                    );


                return sum + total;

            },
            0
        );


    const totalUnits =
        sales.reduce(
            (
                sum,
                sale
            ) =>
                sum +
                Number(
                    sale.quantity || 0
                ),
            0
        );


    const averageSale =
        totalRevenue /
        sales.length;


    const productUnits = {};


    sales.forEach(sale => {

        const product =
            (
                sale.product ||
                "Unknown"
            ).trim();


        const quantity =
            Number(
                sale.quantity || 0
            );


        if (
            !productUnits[product]
        ) {

            productUnits[product] = 0;

        }


        productUnits[product] +=
            quantity;

    });


    let bestProduct = "-";
    let highestUnits = 0;


    Object.entries(
        productUnits
    ).forEach(
        (
            [product, units]
        ) => {

            if (
                units >
                highestUnits
            ) {

                highestUnits =
                    units;

                bestProduct =
                    product;

            }

        }
    );


    if (totalRevenueElement) {

        totalRevenueElement.textContent =
            `₹${totalRevenue.toLocaleString(
                "en-IN"
            )}`;

    }


    if (totalUnitsElement) {

        totalUnitsElement.textContent =
            totalUnits.toLocaleString(
                "en-IN"
            );

    }


    if (averageSaleElement) {

        averageSaleElement.textContent =
            `₹${averageSale.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            )}`;

    }


    if (bestProductElement) {

        bestProductElement.textContent =
            bestProduct;

    }

}


// =====================================================
// DATE-WISE SALES REPORT
// =====================================================


function updateDateWiseReport() {
    const table = document.getElementById("dateWiseSalesTable");
    if (!table) return;

    table.innerHTML = "";

    // Create the pagination area beneath the report table.
    let pagination = document.getElementById("dateWisePagination");

    if (!pagination) {
        const tableContainer = table.closest(".table-container");
        if (!tableContainer) return;

        pagination = document.createElement("div");
        pagination.id = "dateWisePagination";
        pagination.style.display = "flex";
        pagination.style.justifyContent = "center";
        pagination.style.alignItems = "center";
        pagination.style.gap = "12px";
        pagination.style.flexWrap = "wrap";
        pagination.style.padding = "16px";
        pagination.style.marginTop = "8px";

        tableContainer.insertAdjacentElement("afterend", pagination);
    }

    if (!sales || sales.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No sales data available
                </td>
            </tr>
        `;

        pagination.innerHTML = "";
        dateWiseCurrentPage = 1;
        return;
    }

    // Group all sales by date.
    const dateData = {};

    sales.forEach(sale => {
        const date = sale.date || "Unknown";
        const quantity = Number(sale.quantity || 0);

        const revenue =
            Number(sale.total) ||
            quantity * Number(sale.price || 0);

        if (!dateData[date]) {
            dateData[date] = {
                transactions: 0,
                units: 0,
                revenue: 0
            };
        }

        dateData[date].transactions += 1;
        dateData[date].units += quantity;
        dateData[date].revenue += revenue;
    });

    // Sort dates newest first.
    const sortedDates = Object.keys(dateData).sort(
        (a, b) => b.localeCompare(a)
    );

    // Calculate pagination.
    const totalRecords = sortedDates.length;
    const totalPages = Math.max(
        1,
        Math.ceil(totalRecords / SALES_PER_PAGE)
    );

    if (dateWiseCurrentPage > totalPages) {
        dateWiseCurrentPage = totalPages;
    }

    if (dateWiseCurrentPage < 1) {
        dateWiseCurrentPage = 1;
    }

    const startIndex =
        (dateWiseCurrentPage - 1) * SALES_PER_PAGE;

    const pageDates = sortedDates.slice(
        startIndex,
        startIndex + SALES_PER_PAGE
    );

    // Display only the dates for the current page.
    pageDates.forEach(date => {
        const data = dateData[date];
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${escapeHTML(date)}</strong>
            </td>
            <td>${data.transactions.toLocaleString("en-IN")}</td>
            <td>${data.units.toLocaleString("en-IN")}</td>
            <td>
                <strong>
                    ₹${data.revenue.toLocaleString("en-IN")}
                </strong>
            </td>
        `;

        table.appendChild(row);
    });

    // Update the pagination controls.
    const firstRecord = startIndex + 1;
    const lastRecord = Math.min(
        startIndex + SALES_PER_PAGE,
        totalRecords
    );

    pagination.innerHTML = `
        <button
            class="edit-btn"
            id="dateWisePrevious"
            ${dateWiseCurrentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>
            Showing ${firstRecord}–${lastRecord} of ${totalRecords}
            &nbsp; | &nbsp;
            Page ${dateWiseCurrentPage} of ${totalPages}
        </span>

        <button
            class="edit-btn"
            id="dateWiseNext"
            ${dateWiseCurrentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    document.getElementById("dateWisePrevious").onclick = () => {
        if (dateWiseCurrentPage > 1) {
            dateWiseCurrentPage--;
            updateDateWiseReport();
        }
    };

    document.getElementById("dateWiseNext").onclick = () => {
        if (dateWiseCurrentPage < totalPages) {
            dateWiseCurrentPage++;
            updateDateWiseReport();
        }
    };
}



// =====================================================
// SEARCH + FILTER
// =====================================================

function filterSales() {

    const search =
        (
            document
                .getElementById(
                    "search"
                )?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const category =
        document
            .getElementById(
                "categoryFilter"
            )?.value ||
        "";


    const fromDate =
        document
            .getElementById(
                "fromDate"
            )?.value ||
        "";


    const toDate =
        document
            .getElementById(
                "toDate"
            )?.value ||
        "";


    const filteredSales =
        sales.filter(
            sale => {

                const product =
                    (
                        sale.product ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    product.includes(
                        search
                    );


                const matchesCategory =
                    !category ||
                    sale.category ===
                        category;


                const saleDate =
                    sale.date || "";


                const matchesFrom =
                    !fromDate ||
                    saleDate >=
                        fromDate;


                const matchesTo =
                    !toDate ||
                    saleDate <=
                        toDate;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesFrom &&
                    matchesTo
                );

            }
        );


    salesHistoryCurrentPage = 1;
    displaySales(filteredSales);

}


// =====================================================
// CLEAR FILTERS
// =====================================================

function clearFilters() {

    const search =
        document.getElementById(
            "search"
        );


    const category =
        document.getElementById(
            "categoryFilter"
        );


    const fromDate =
        document.getElementById(
            "fromDate"
        );


    const toDate =
        document.getElementById(
            "toDate"
        );


    if (search)
        search.value = "";


    if (category)
        category.value = "";


    if (fromDate)
        fromDate.value = "";


    if (toDate)
        toDate.value = "";

    salesHistoryCurrentPage = 1;
    displaySales();

}


// =====================================================
// OLD SEARCH FUNCTION
// =====================================================

function searchSales() {

    filterSales();

}


// =====================================================
// OPEN SALE FORM
// =====================================================

function openSaleForm() {

    const form =
        document.getElementById(
            "saleForm"
        );


    if (!form) return;


    form.classList.remove(
        "hidden"
    );


    // Automatically set today's current date
    const saleDate =
        document.getElementById(
            "saleDate"
        );

    if (saleDate) {

        const today = new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        saleDate.value =
            `${year}-${month}-${day}`;
    }


    setTimeout(
        () => {

            form.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        100
    );

}


// =====================================================
// CLOSE SALE FORM
// =====================================================

function closeSaleForm() {

    const form =
        document.getElementById(
            "saleForm"
        );


    if (!form) return;


    form.classList.add(
        "hidden"
    );

}


// =====================================================
// NAVIGATION
// =====================================================

function scrollToSection(
    sectionId
) {

    const section =
        document.getElementById(
            sectionId
        );


    if (!section) return;


    section.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


// =====================================================
// DATE PARSER
// =====================================================

function parseDate(
    dateString
) {

    if (!dateString) {

        return null;

    }


    const parts =
        String(
            dateString
        ).split("-");


    if (
        parts.length === 3
    ) {

        const year =
            Number(
                parts[0]
            );


        const month =
            Number(
                parts[1]
            ) - 1;


        const day =
            Number(
                parts[2]
            );


        const date =
            new Date(
                year,
                month,
                day
            );


        date.setHours(
            0,
            0,
            0,
            0
        );


        return date;

    }


    const date =
        new Date(
            dateString
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    date
) {

    if (!date) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}`;

}


// =====================================================
// CHART DATE
// =====================================================

function formatChartDate(
    date
) {

    return date.toLocaleDateString(
        "en-IN",
        {

            day: "numeric",

            month: "short"

        }
    );

}


// =====================================================
// LAST N DAYS
// =====================================================

function isWithinLastDays(
    date,
    days
) {

    if (!date) {

        return false;

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const start =
        new Date(
            today
        );


    start.setDate(
        start.getDate() -
        (days - 1)
    );


    return (
        date >= start &&
        date <= today
    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// HISTORICAL SALES REPORT - YEAR & MONTH FILTER
// =====================================================

function createHistoricalSalesReport() {

    // Do not create it more than once
    if (document.getElementById("historicalSalesReport")) {
        return;
    }

    // Find Sales History section
    const salesSection = document.getElementById("sales");

    if (!salesSection) {
        return;
    }

    // Create the complete historical report
    const reportSection = document.createElement("section");

    reportSection.id = "historicalSalesReport";

    reportSection.className = "sales-box";

    reportSection.style.marginBottom = "30px";

    reportSection.innerHTML = `

        <div class="section-title">

            <h2>
                Historical Sales Report
            </h2>

        </div>


        <!-- Filters -->

        <div
            style="
                display:flex;
                gap:12px;
                flex-wrap:wrap;
                margin-bottom:25px;
            "
        >

            <!-- Year -->

            <select
                id="historicalYear"
                onchange="historicalSalesCurrentPage = 1; updateHistoricalSalesReport()"
                style="
                    padding:12px;
                    border:1px solid #d1d5db;
                    border-radius:8px;
                    min-width:150px;
                    background:white;
                "
            >

                <option value="">
                    All Years
                </option>

            </select>


            <!-- Month -->

            <select
                id="historicalMonth"
                onchange="historicalSalesCurrentPage = 1; updateHistoricalSalesReport()"
                style="
                    padding:12px;
                    border:1px solid #d1d5db;
                    border-radius:8px;
                    min-width:170px;
                    background:white;
                "
            >

                <option value="">
                    All Months
                </option>

                <option value="1">
                    January
                </option>

                <option value="2">
                    February
                </option>

                <option value="3">
                    March
                </option>

                <option value="4">
                    April
                </option>

                <option value="5">
                    May
                </option>

                <option value="6">
                    June
                </option>

                <option value="7">
                    July
                </option>

                <option value="8">
                    August
                </option>

                <option value="9">
                    September
                </option>

                <option value="10">
                    October
                </option>

                <option value="11">
                    November
                </option>

                <option value="12">
                    December
                </option>

            </select>


            <!-- Clear -->

            <button
                type="button"
                onclick="clearHistoricalSalesFilter()"
                style="
                    padding:12px 18px;
                    border:none;
                    border-radius:8px;
                    background:#e5e7eb;
                    cursor:pointer;
                    font-size:14px;
                "
            >
                Clear
            </button>

        </div>


        <!-- Summary -->

        <div
            style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(180px,1fr));
                gap:15px;
                margin-bottom:25px;
            "
        >

            <div
                style="
                    background:#f8fafc;
                    padding:18px;
                    border-radius:10px;
                "
            >

                <div
                    style="
                        color:#64748b;
                        font-size:14px;
                        margin-bottom:6px;
                    "
                >
                    Total Revenue
                </div>

                <strong
                    id="historicalRevenue"
                    style="font-size:22px;"
                >
                    ₹0
                </strong>

            </div>


            <div
                style="
                    background:#f8fafc;
                    padding:18px;
                    border-radius:10px;
                "
            >

                <div
                    style="
                        color:#64748b;
                        font-size:14px;
                        margin-bottom:6px;
                    "
                >
                    Units Sold
                </div>

                <strong
                    id="historicalUnits"
                    style="font-size:22px;"
                >
                    0
                </strong>

            </div>


            <div
                style="
                    background:#f8fafc;
                    padding:18px;
                    border-radius:10px;
                "
            >

                <div
                    style="
                        color:#64748b;
                        font-size:14px;
                        margin-bottom:6px;
                    "
                >
                    Transactions
                </div>

                <strong
                    id="historicalTransactions"
                    style="font-size:22px;"
                >
                    0
                </strong>

            </div>


            <div
                style="
                    background:#f8fafc;
                    padding:18px;
                    border-radius:10px;
                "
            >

                <div
                    style="
                        color:#64748b;
                        font-size:14px;
                        margin-bottom:6px;
                    "
                >
                    Average Sale
                </div>

                <strong
                    id="historicalAverage"
                    style="font-size:22px;"
                >
                    ₹0
                </strong>

            </div>

        </div>


        <!-- Selected Period -->

        <h3
            id="historicalPeriodTitle"
            style="
                margin-bottom:15px;
            "
        >
            All Sales
        </h3>


        <!-- Historical Table -->

        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Product
                        </th>

                        <th>
                            Category
                        </th>

                        <th>
                            Quantity
                        </th>

                        <th>
                            Unit Price
                        </th>

                        <th>
                            Total
                        </th>

                    </tr>

                </thead>


                <tbody id="historicalSalesTable">

                </tbody>

            </table>

        </div>

    `;


    // Insert before Sales History
    salesSection.parentNode.insertBefore(
        reportSection,
        salesSection
    );


    // Populate year dropdown
    populateHistoricalYears();


    // Display initial data
    updateHistoricalSalesReport();
}


// =====================================================
// POPULATE AVAILABLE YEARS
// =====================================================

function populateHistoricalYears() {

    const yearSelect =
        document.getElementById(
            "historicalYear"
        );

    if (!yearSelect) {
        return;
    }


    // Remember current selection
    const currentValue =
        yearSelect.value;


    // Keep "All Years"
    yearSelect.innerHTML = `
        <option value="">
            All Years
        </option>
    `;


    // Get unique years from sales
    const years = [
        ...new Set(

            sales

                .map(sale => {

                    if (!sale.date) {
                        return null;
                    }

                    const parts =
                        String(
                            sale.date
                        ).split("-");

                    if (
                        parts.length !== 3
                    ) {
                        return null;
                    }

                    return Number(
                        parts[0]
                    );

                })

                .filter(year =>
                    Number.isFinite(year)
                )

        )
    ];


    // Newest year first
    years.sort(
        (a, b) => b - a
    );


    years.forEach(year => {

        const option =
            document.createElement(
                "option"
            );

        option.value = year;

        option.textContent = year;

        yearSelect.appendChild(
            option
        );

    });


    // Restore previous selection
    if (
        years.includes(
            Number(currentValue)
        )
    ) {

        yearSelect.value =
            currentValue;

    }

}


// =====================================================
// UPDATE HISTORICAL REPORT
// =====================================================


function updateHistoricalSalesReport() {
    const yearSelect = document.getElementById("historicalYear");
    const monthSelect = document.getElementById("historicalMonth");
    const table = document.getElementById("historicalSalesTable");

    const revenueElement = document.getElementById("historicalRevenue");
    const unitsElement = document.getElementById("historicalUnits");
    const transactionsElement = document.getElementById("historicalTransactions");
    const averageElement = document.getElementById("historicalAverage");
    const titleElement = document.getElementById("historicalPeriodTitle");

    if (!yearSelect || !monthSelect || !table) {
        return;
    }

    const selectedYear = yearSelect.value;
    const selectedMonth = monthSelect.value;

    // Filter sales according to the selected year and month.
    const filteredSales = sales.filter(sale => {
        if (!sale.date) return false;

        const parts = String(sale.date).split("-");
        if (parts.length !== 3) return false;

        const year = Number(parts[0]);
        const month = Number(parts[1]);

        if (selectedYear && year !== Number(selectedYear)) {
            return false;
        }

        if (selectedMonth && month !== Number(selectedMonth)) {
            return false;
        }

        return true;
    });

    // Calculate summary statistics for all filtered records.
    let totalRevenue = 0;
    let totalUnits = 0;
    const totalTransactions = filteredSales.length;

    filteredSales.forEach(sale => {
        const quantity = Number(sale.quantity) || 0;
        const revenue = Number(sale.total) ||
            quantity * (Number(sale.price) || 0);

        totalUnits += quantity;
        totalRevenue += revenue;
    });

    const averageSale = totalTransactions > 0
        ? totalRevenue / totalTransactions
        : 0;

    if (revenueElement) {
        revenueElement.textContent =
            `₹${totalRevenue.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`;
    }

    if (unitsElement) {
        unitsElement.textContent =
            totalUnits.toLocaleString("en-IN");
    }

    if (transactionsElement) {
        transactionsElement.textContent =
            totalTransactions.toLocaleString("en-IN");
    }

    if (averageElement) {
        averageElement.textContent =
            `₹${averageSale.toLocaleString("en-IN", {
                maximumFractionDigits: 2
            })}`;
    }

    // Set the report title.
    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    let periodTitle = "All Sales";

    if (selectedYear && selectedMonth) {
        periodTitle =
            `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}`;
    } else if (selectedYear) {
        periodTitle = `All Sales - ${selectedYear}`;
    } else if (selectedMonth) {
        periodTitle =
            `All ${monthNames[Number(selectedMonth) - 1]} Sales`;
    }

    if (titleElement) {
        titleElement.textContent = periodTitle;
    }

    // Clear the table before displaying the current page.
    table.innerHTML = "";

    // Handle empty results.
    if (filteredSales.length === 0) {
        historicalSalesCurrentPage = 1;

        table.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:25px;">
                    No sales found for the selected period.
                </td>
            </tr>
        `;

        const pagination = document.getElementById(
            "historicalSalesPagination"
        );

        if (pagination) {
            pagination.innerHTML = "";
        }

        return;
    }

    // Sort newest sales first.
    const sortedSales = [...filteredSales].sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
    );

    // Pagination: 30 sales records per page.
    const totalPages = Math.max(
        1,
        Math.ceil(sortedSales.length / SALES_PER_PAGE)
    );

    // Keep the current page valid without resetting it on every render.
    if (historicalSalesCurrentPage > totalPages) {
        historicalSalesCurrentPage = totalPages;
    }

    if (historicalSalesCurrentPage < 1) {
        historicalSalesCurrentPage = 1;
    }

    const startIndex =
        (historicalSalesCurrentPage - 1) * SALES_PER_PAGE;

    const pageSales = sortedSales.slice(
        startIndex,
        startIndex + SALES_PER_PAGE
    );

    // Display only the records belonging to the current page.
    pageSales.forEach(sale => {
        const row = document.createElement("tr");

        const quantity = Number(sale.quantity) || 0;
        const price = Number(sale.price) || 0;
        const total = Number(sale.total) || quantity * price;

        row.innerHTML = `
            <td>${escapeHTML(sale.date || "")}</td>
            <td>${escapeHTML(sale.product || "")}</td>
            <td>${escapeHTML(sale.category || "")}</td>
            <td>${quantity.toLocaleString("en-IN")}</td>
            <td>₹${price.toLocaleString("en-IN")}</td>
            <td><strong>₹${total.toLocaleString("en-IN")}</strong></td>
        `;

        table.appendChild(row);
    });

    // Create or reuse the pagination container.
    let pagination = document.getElementById(
        "historicalSalesPagination"
    );

    if (!pagination) {
        const tableContainer = table.closest(".table-container");

        if (tableContainer) {
            pagination = document.createElement("div");
            pagination.id = "historicalSalesPagination";
            pagination.style.display = "flex";
            pagination.style.justifyContent = "center";
            pagination.style.alignItems = "center";
            pagination.style.gap = "12px";
            pagination.style.flexWrap = "wrap";
            pagination.style.padding = "16px";
            pagination.style.marginTop = "8px";

            tableContainer.insertAdjacentElement(
                "afterend",
                pagination
            );
        }
    }

    if (!pagination) return;

    const firstRecord = startIndex + 1;
    const lastRecord = Math.min(
        startIndex + SALES_PER_PAGE,
        sortedSales.length
    );

    pagination.innerHTML = `
        <button
            class="edit-btn"
            id="historicalSalesPrevious"
            ${historicalSalesCurrentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>

        <span>
            Showing ${firstRecord}–${lastRecord} of ${sortedSales.length}
            &nbsp; | &nbsp;
            Page ${historicalSalesCurrentPage} of ${totalPages}
        </span>

        <button
            class="edit-btn"
            id="historicalSalesNext"
            ${historicalSalesCurrentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    // Attach exactly one handler to each button after rendering.
    const previousButton = document.getElementById(
        "historicalSalesPrevious"
    );

    const nextButton = document.getElementById(
        "historicalSalesNext"
    );

    previousButton.onclick = () => {
        if (historicalSalesCurrentPage > 1) {
            historicalSalesCurrentPage--;
            updateHistoricalSalesReport();
        }
    };

    nextButton.onclick = () => {
        if (historicalSalesCurrentPage < totalPages) {
            historicalSalesCurrentPage++;
            updateHistoricalSalesReport();
        }
    };
}


// Clear Historical Sales Report filters.
function clearHistoricalSalesFilter() {
    const yearSelect = document.getElementById("historicalYear");
    const monthSelect = document.getElementById("historicalMonth");

    if (yearSelect) {
        yearSelect.value = "";
    }

    if (monthSelect) {
        monthSelect.value = "";
    }

    historicalSalesCurrentPage = 1;
    updateHistoricalSalesReport();
}



// =====================================================
// CLEAR HISTORICAL FILTER
// =====================================================




// =====================================================
// INITIALIZE HISTORICAL REPORT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createHistoricalSalesReport();

    }
);







// =====================================================
// KPI CARD DATE RANGE TOOLTIPS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const today = new Date();

    // Format date like: 03 Oct 2026
    function formatTooltipDate(date) {
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // Today's date
    const todayText =
        formatTooltipDate(today);


    // Find Monday of the current week
    const weekStart =
        new Date(today);

    const day =
        weekStart.getDay();

    const difference =
        day === 0 ? 6 : day - 1;

    weekStart.setDate(
        weekStart.getDate() - difference
    );


    // First day of current month
    const monthStart =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    // Dashboard cards
    const todayCard =
        document
            .getElementById("todaySales")
            ?.closest(".card");

    const weekCard =
        document
            .getElementById("weekSales")
            ?.closest(".card");

    const monthCard =
        document
            .getElementById("monthSales")
            ?.closest(".card");

    const totalCard =
        document
            .getElementById("totalSales")
            ?.closest(".card");


    // Add hover information
    if (todayCard) {
        todayCard.title =
            `Today's Sales: ${todayText}`;
    }


    if (weekCard) {
        weekCard.title =
            `This Week: ${formatTooltipDate(weekStart)} - ${todayText}`;
    }


    if (monthCard) {
        monthCard.title =
            `This Month: ${formatTooltipDate(monthStart)} - ${todayText}`;
    }


    if (totalCard) {
        totalCard.title =
            "Total Sales: All available sales records";
    }

});



// =====================================
// AI Sales Insights
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const generateButton =
        document.getElementById("generateAIInsights");

    const resultBox =
        document.getElementById("aiInsightsResult");

    if (!generateButton || !resultBox) {
        return;
    }

    generateButton.addEventListener("click", async () => {

        generateButton.disabled = true;
        generateButton.textContent = "Analyzing...";

        resultBox.innerHTML = `
            <p class="ai-placeholder">
                🤖 AI is analyzing your sales data...
            </p>
        `;

        try {

            const response = await fetch(
                "http://localhost:3000/api/ai/insights",
                {
                    method: "POST"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to generate AI insights"
                );
            }

            resultBox.innerHTML = `
                <div class="ai-insight-text">
                    ${formatAIInsights(generateVerifiedInsights(data.statistics))}
                </div>
            `;
        } catch (error) {

            console.error(
                "AI Insights Error:",
                error
            );

            resultBox.innerHTML = `
                <p class="ai-error">
                    ❌ Unable to generate AI insights.
                    Please make sure the backend and Ollama are running.
                </p>
            `;

        } finally {

            generateButton.disabled = false;
            generateButton.textContent =
                "Generate AI Insights";

        }

    });

});


// Format AI response
function formatAIInsights(text) {

    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
}



function generateVerifiedInsights(stats) {
    if (!stats || !stats.overall) {
        throw new Error("Verified sales statistics are missing.");
    }

    const money = value =>
        `₹${Number(value).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const number = value =>
        Number(value).toLocaleString("en-IN");

    const date = value => {
        if (!value) return "N/A";

        const parts = String(value).split("-");
        if (parts.length !== 3) return value;

        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const overall = stats.overall;
    const categories = stats.categories || [];
    const revenueProducts = stats.topProductsByRevenue || [];
    const unitProducts = stats.topProductsByUnits || [];
    const highest = stats.highestSalesDay;
    const lowest = stats.lowestSalesDay;

    const topCategory = categories[0];
    const topRevenueProduct = revenueProducts[0];
    const topUnitProduct = unitProducts[0];

    const insights = [
        `**Insight 1: Overall Revenue and Transaction Performance**\n\nTotal revenue is ${money(overall.totalRevenue)}, across ${number(overall.totalTransactions)} transactions and ${number(overall.totalUnits)} units sold. The average transaction value is ${money(overall.averageTransaction)}.`,

        `**Insight 2: Category Performance**\n\n${
            topCategory
                ? `${topCategory.category} has the highest category revenue at ${money(topCategory.revenue)}, contributing ${Number(topCategory.revenueShare).toFixed(2)}% of total revenue.`
                : "No category statistics are available."
        }`,

        `**Insight 3: Top Products by Revenue**\n\n${
            topRevenueProduct
                ? `${topRevenueProduct.product} ranks highest by revenue at ${money(topRevenueProduct.revenue)}, with ${number(topRevenueProduct.units)} units sold.`
                : "No product revenue statistics are available."
        }`,

        `**Insight 4: Units Sold**\n\n${
            topUnitProduct
                ? `${topUnitProduct.product} has the highest unit sales, with ${number(topUnitProduct.units)} units sold and revenue of ${money(topUnitProduct.revenue)}.`
                : `Total units sold: ${number(overall.totalUnits)}.`
        }`,

        `**Insight 5: Highest and Lowest Sales Days**\n\n${
            highest
                ? `Highest: ${date(highest.date)}, with revenue of ${money(highest.revenue)}.`
                : "Highest-sales-day data is unavailable."
        }\n\n${
            lowest
                ? `Lowest: ${date(lowest.date)}, with revenue of ${money(lowest.revenue)}.`
                : "Lowest-sales-day data is unavailable."
        }`
    ];

    const recommendations = [
        topUnitProduct
            ? `**1. Review inventory priorities**\n\nReview inventory for ${topUnitProduct.product}, which recorded the highest unit sales (${number(topUnitProduct.units)} units).`
            : "**1. Review inventory priorities**\n\nReview product unit-sales data before making inventory decisions.",

        topCategory
            ? `**2. Review category performance**\n\nReview ${topCategory.category}, the category with the highest revenue (${money(topCategory.revenue)}).`
            : "**2. Review category performance**\n\nReview category revenue data before making category-level decisions."
    ];

    return [
        ...insights,
        "**Business Recommendations**",
        ...recommendations
    ].join("\n\n");
}




// =====================================================
// EXPORT FILTERED SALES TO CSV
// =====================================================

function exportSalesCSV() {

    if (sales.length === 0) {
        alert("No sales data available to export.");
        return;
    }

    const search =
        (
            document.getElementById("search")?.value || ""
        )
            .trim()
            .toLowerCase();

    const category =
        document.getElementById("categoryFilter")?.value || "";

    const fromDate =
        document.getElementById("fromDate")?.value || "";

    const toDate =
        document.getElementById("toDate")?.value || "";

    const filteredSales = sales.filter(sale => {

        const product =
            (sale.product || "").toLowerCase();

        const matchesSearch =
            product.includes(search);

        const matchesCategory =
            !category ||
            sale.category === category;

        const saleDate =
            sale.date || "";

        const matchesFrom =
            !fromDate ||
            saleDate >= fromDate;

        const matchesTo =
            !toDate ||
            saleDate <= toDate;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesFrom &&
            matchesTo
        );
    });

    if (filteredSales.length === 0) {
        alert("No sales found for the selected filters.");
        return;
    }

    const headers = [
        "Date",
        "Product",
        "Category",
        "Quantity",
        "Unit Price",
        "Total"
    ];

    const rows = filteredSales.map(sale => [
        sale.date,
        sale.product,
        sale.category,
        sale.quantity,
        sale.price,
        sale.total
    ]);

    const csvContent = [
        headers,
        ...rows
    ]
        .map(row =>
            row.map(value =>
                `"${String(value ?? "").replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "Sales_Tracker_Filtered_Report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}





document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".sidebar nav a");
    const reportsSection = document.getElementById("reports");
    const salesSection = document.getElementById("sales");

    function updateActiveNav() {
        let activeId = "dashboard";

        const nearBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 10;

        if (nearBottom) {
            activeId = "sales";
        } else if (
            salesSection &&
            salesSection.getBoundingClientRect().top <= 150
        ) {
            activeId = "sales";
        } else if (
            reportsSection &&
            reportsSection.getBoundingClientRect().top <= 150
        ) {
            activeId = "reports";
        }

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${activeId}`
            );
        });
    }

    window.addEventListener("scroll", updateActiveNav, {
        passive: true
    });

    window.addEventListener("resize", updateActiveNav);

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            setTimeout(updateActiveNav, 100);
        });
    });

    updateActiveNav();
});
