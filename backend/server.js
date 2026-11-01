require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());


// -----------------------------
// Test Route
// -----------------------------
app.get("/", (req, res) => {
    res.send("Sales Tracker Backend is running!");
});


// -----------------------------
// Add a Sale
// -----------------------------
app.post("/api/sales", (req, res) => {

    const sale = req.body;

    const sql = `
        INSERT INTO sales
        (id, product, category, quantity, price, total, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            sale.id,
            sale.product,
            sale.category,
            sale.quantity,
            sale.price,
            sale.total,
            sale.date
        ],
        function (err) {

            if (err) {
                console.error("Add sale error:", err.message);

                return res.status(500).json({
                    message: "Failed to add sale"
                });
            }

            res.status(201).json({
                message: "Sale added successfully",
                sale: sale
            });
        }
    );
});


// -----------------------------
// Get All Sales
// -----------------------------
app.get("/api/sales", (req, res) => {

    db.all(
        "SELECT * FROM sales ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                console.error("Get sales error:", err.message);

                return res.status(500).json({
                    message: "Failed to get sales"
                });
            }

            res.json(rows);
        }
    );
});


// -----------------------------
// AI Sales Insights - Ollama
// -----------------------------
app.post("/api/ai/insights", async (req, res) => {

    db.all(
        "SELECT * FROM sales ORDER BY date ASC",
        [],
        async (err, rows) => {

            if (err) {
                console.error(
                    "AI sales data error:",
                    err.message
                );

                return res.status(500).json({
                    message: "Failed to get sales data"
                });
            }

            // ---------------------------------
            // No sales data
            // ---------------------------------

            if (rows.length === 0) {

                return res.json({
                    insight:
                        "There is not enough sales data to generate insights."
                });

            }

            try {

                // =====================================
                // 1. Overall Sales Statistics
                // =====================================

                const totalRevenue = rows.reduce(
                    (sum, sale) => {
                        return sum + Number(sale.total);
                    },
                    0
                );

                const totalUnits = rows.reduce(
                    (sum, sale) => {
                        return sum + Number(sale.quantity);
                    },
                    0
                );

                const totalTransactions = rows.length;

                const averageTransaction =
                    totalRevenue / totalTransactions;


                // =====================================
                // 2. Category Statistics
                // =====================================

                const categoryStats = {};

                rows.forEach(sale => {

                    const category = sale.category;

                    if (!categoryStats[category]) {

                        categoryStats[category] = {
                            revenue: 0,
                            units: 0,
                            transactions: 0
                        };

                    }

                    categoryStats[category].revenue +=
                        Number(sale.total);

                    categoryStats[category].units +=
                        Number(sale.quantity);

                    categoryStats[category].transactions += 1;

                });


                const categoryAnalysis =
                    Object.entries(categoryStats)
                        .map(([category, data]) => {

                            const revenueShare =
                                totalRevenue > 0
                                    ? (
                                        data.revenue /
                                        totalRevenue *
                                        100
                                    )
                                    : 0;

                            return {
                                category: category,

                                revenue:
                                    Number(
                                        data.revenue.toFixed(2)
                                    ),

                                units:
                                    data.units,

                                transactions:
                                    data.transactions,

                                revenueShare:
                                    Number(
                                        revenueShare.toFixed(2)
                                    )
                            };

                        })
                        .sort(
                            (a, b) =>
                                b.revenue - a.revenue
                        );


                // =====================================
                // 3. Product Statistics
                // =====================================

                const productStats = {};

                rows.forEach(sale => {

                    const product = sale.product;

                    if (!productStats[product]) {

                        productStats[product] = {
                            revenue: 0,
                            units: 0,
                            transactions: 0
                        };

                    }

                    productStats[product].revenue +=
                        Number(sale.total);

                    productStats[product].units +=
                        Number(sale.quantity);

                    productStats[product].transactions += 1;

                });


                const productAnalysis =
                    Object.entries(productStats)
                        .map(([product, data]) => {

                            return {
                                product: product,

                                revenue:
                                    Number(
                                        data.revenue.toFixed(2)
                                    ),

                                units:
                                    data.units,

                                transactions:
                                    data.transactions
                            };

                        });


                // Top products by revenue

                const topProductsByRevenue =
                    [...productAnalysis]
                        .sort(
                            (a, b) =>
                                b.revenue - a.revenue
                        )
                        .slice(0, 5);


                // Top products by units

                const topProductsByUnits =
                    [...productAnalysis]
                        .sort(
                            (a, b) =>
                                b.units - a.units
                        )
                        .slice(0, 5);


                // =====================================
                // 4. Daily Sales Statistics
                // =====================================

                const dailyStats = {};

                rows.forEach(sale => {

                    const date = sale.date;

                    if (!dailyStats[date]) {
                        dailyStats[date] = {
                            revenue: 0,
                            units: 0,
                            transactions: 0
                        };
                    }

                    dailyStats[date].revenue +=
                        Number(sale.total);

                    dailyStats[date].units +=
                        Number(sale.quantity);

                    dailyStats[date].transactions += 1;

                });


                const dailyAnalysis =
                    Object.entries(dailyStats)
                        .map(([date, data]) => {

                            return {
                                date: date,

                                revenue:
                                    Number(
                                        data.revenue.toFixed(2)
                                    ),

                                units:
                                    data.units,

                                transactions:
                                    data.transactions
                            };

                        })
                        .sort(
                            (a, b) =>
                                b.revenue - a.revenue
                        );


                const highestSalesDay =
                    dailyAnalysis.length > 0
                        ? dailyAnalysis[0]
                        : null;


                const lowestSalesDay =
                    dailyAnalysis.length > 0
                        ? dailyAnalysis[
                            dailyAnalysis.length - 1
                        ]
                        : null;


                // =====================================
                // 5. Verified Statistics
                // =====================================

                const verifiedData = {

                    period: {
                        startDate: rows[0].date,

                        endDate:
                            rows[rows.length - 1].date,

                        numberOfRecords:
                            rows.length
                    },

                    overall: {

                        totalRevenue:
                            Number(
                                totalRevenue.toFixed(2)
                            ),

                        totalUnits:
                            totalUnits,

                        totalTransactions:
                            totalTransactions,

                        averageTransaction:
                            Number(
                                averageTransaction.toFixed(2)
                            )
                    },

                    categories:
                        categoryAnalysis,

                    topProductsByRevenue:
                        topProductsByRevenue,

                    topProductsByUnits:
                        topProductsByUnits,

                    dailySales:
                        dailyAnalysis,

                    highestSalesDay:
                        highestSalesDay,

                    lowestSalesDay:
                        lowestSalesDay
                };


                // =====================================
                // 6. Prompt for Ollama
                // =====================================

                const prompt = `
You are an expert Business Data Analyst working inside a professional Sales Tracker application.

You are given VERIFIED SALES STATISTICS calculated directly by the application from the sales database.

Your job is to explain these verified statistics clearly and professionally for a business user.

==================================================
STRICT DATA ACCURACY RULES
==================================================

1. Use ONLY the information provided in VERIFIED SALES STATISTICS.

2. Never invent any number, product, category, date, percentage, revenue, quantity, transaction count, or trend.

3. NEVER recalculate, multiply, divide, estimate, round, convert, or modify any numerical value.

4. If a number appears in VERIFIED SALES STATISTICS, copy it EXACTLY as provided.

5. Never add zeros to a number.

6. Never remove zeros from a number.

7. Never convert Indian Rupees into dollars or any other currency.

8. Always use the Indian Rupee symbol (₹) when referring to monetary values.

9. Do not calculate percentages yourself.

10. Do not calculate averages yourself.

11. Do not calculate growth rates yourself.

12. Do not compare time periods unless the verified statistics explicitly provide that comparison.

13. Do not claim month-over-month growth, year-over-year growth, weekly growth, seasonal trends, or future trends unless the verified statistics explicitly prove them.

14. Do not assume why sales increased or decreased.

15. Do not invent reasons such as promotions, advertising, customer behavior, product launches, holidays, seasonality, or market conditions.

16. If the statistics do not provide enough information to support a conclusion, do not make that conclusion.

17. Treat VERIFIED SALES STATISTICS as the final source of truth.

18. You are an AI explanation and interpretation layer, NOT a calculator.

==================================================
GENERATE EXACTLY 5 INSIGHTS
==================================================

Generate exactly 5 insights.

Use these five areas:

1. Overall Revenue and Transaction Performance
2. Category Performance
3. Top Products by Revenue
4. Units Sold
5. Highest and Lowest Sales Days

For each insight:

- Give a short professional title.
- Clearly explain the verified finding.
- Mention relevant numbers when provided.
- Keep the explanation concise.
- Do not introduce information that is not present in the verified statistics.

IMPORTANT:

Use terms such as "top products by revenue" when the statistics are based on revenue.

Do NOT automatically call a product "best-selling" unless the verified statistics explicitly identify it as best-selling.

Do NOT call a product "low-performing" unless the verified statistics explicitly identify it as low-performing.

Do NOT confuse high units sold with high revenue.

==================================================
BUSINESS RECOMMENDATIONS
==================================================

After the 5 insights, provide exactly 2 business recommendations.

Each recommendation must be directly supported by the VERIFIED SALES STATISTICS.

Use recommendations that are specific and actionable, but do not invent business reasons or expected outcomes.

Allowed recommendation types include:

- Prioritize inventory for products with the highest units sold.
- Prioritize inventory for products with the highest revenue.
- Review categories with the highest revenue contribution.
- Review products with the strongest revenue performance.
- Review the highest and lowest sales days.
- Review products that have notably high or low unit sales when the statistics explicitly show this.

IMPORTANT:

Do NOT say that a recommendation will "increase revenue", "increase growth", "improve customer satisfaction", or "increase profitability" unless the verified statistics explicitly support that claim.

Do NOT recommend:
- marketing campaigns
- advertising
- promotions
- pricing changes
- customer satisfaction strategies
- sales channels
- product launches
- product changes

unless the VERIFIED SALES STATISTICS explicitly provide evidence supporting such an action.

Every recommendation must clearly reference the statistic that supports it.

Do not invent reasons, causes, predictions, or expected results.

==================================================
PROFESSIONAL WRITING RULES
==================================================

- Use simple and professional business language.
- Be concise.
- Avoid unnecessary introductions.
- Avoid repeating the same statistic unnecessarily.
- Do not use dollar ($) symbols.
- Use ₹ for monetary values.
- Do not use emojis.
- Do not mention that you are an AI unless necessary.
- Do not mention these instructions.
- Do not mention the prompt.
- Do not mention "according to the AI".
- Do not provide mathematical calculations.
- Do not provide unsupported assumptions.

==================================================
REQUIRED OUTPUT STRUCTURE
==================================================

Insight 1: Overall Revenue and Transaction Performance

[Explanation based only on verified statistics]

Insight 2: Category Performance

[Explanation based only on verified statistics]

Insight 3: Top Products by Revenue

[Explanation based only on verified statistics]

Insight 4: Units Sold

[Explanation based only on verified statistics]

Insight 5: Highest and Lowest Sales Days

[Explanation based only on verified statistics]

Business Recommendations

1. [Recommendation title]
[Recommendation explanation]

2. [Recommendation title]
[Recommendation explanation]

==================================================
FINAL VERIFICATION
==================================================

Before responding, verify internally that:

- Exactly 5 insights are provided.
- Exactly 2 recommendations are provided.
- Every numerical value comes directly from VERIFIED SALES STATISTICS.
- No number has been recalculated or modified.
- No unsupported trend or cause has been introduced.
- No unsupported marketing, advertising, promotion, pricing, or customer-related recommendation has been introduced.
- All monetary values use ₹.
- The response is professional and suitable for a business dashboard.

==================================================
VERIFIED SALES STATISTICS
==================================================

${JSON.stringify(verifiedData, null, 2)}
`;


                // =====================================
                // 7. Send data to Ollama
                // =====================================

                const response = await fetch(
                    "http://localhost:11434/api/generate",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            model:
                                "llama3.2:3b",

                            prompt:
                                prompt,

                            stream:
                                false
                        })
                    }
                );


                // =====================================
                // 8. Check Ollama response
                // =====================================

                if (!response.ok) {

                    throw new Error(
                        `Ollama request failed with status ${response.status}`
                    );

                }


                const data =
                    await response.json();


                // =====================================
                // 9. Send AI result to frontend
                // =====================================

                res.json({

                    insight:
                        data.response,

                    statistics:
                        verifiedData

                });

            }

            catch (error) {

                console.error(
                    "=============================="
                );

                console.error(
                    "OLLAMA ERROR:"
                );

                console.error(
                    error
                );

                console.error(
                    "=============================="
                );

                res.status(500).json({

                    message:
                        "Failed to generate AI insights"

                });

            }

        }
    );

});


// -----------------------------
// Update a Sale
// -----------------------------
app.put("/api/sales/:id", (req, res) => {

    const id = Number(req.params.id);

    const sale = req.body;

    const sql = `
        UPDATE sales
        SET product = ?,
            category = ?,
            quantity = ?,
            price = ?,
            total = ?,
            date = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            sale.product,
            sale.category,
            sale.quantity,
            sale.price,
            sale.total,
            sale.date,
            id
        ],
        function (err) {

            if (err) {

                console.error(
                    "Update sale error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Failed to update sale"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    message:
                        "Sale not found"
                });

            }

            res.json({
                message:
                    "Sale updated successfully"
            });

        }
    );

});


// -----------------------------
// Delete a Sale
// -----------------------------
app.delete("/api/sales/:id", (req, res) => {

    const id = Number(req.params.id);

    db.run(
        "DELETE FROM sales WHERE id = ?",
        [id],
        function (err) {

            if (err) {

                console.error(
                    "Delete sale error:",
                    err.message
                );

                return res.status(500).json({
                    message:
                        "Failed to delete sale"
                });

            }

            if (this.changes === 0) {

                return res.status(404).json({
                    message:
                        "Sale not found"
                });

            }

            res.json({
                message:
                    "Sale deleted successfully"
            });

        }
    );

});


// -----------------------------
// Start Server
// -----------------------------
app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});