# Sales Tracker System

## 1. Project Overview

The Sales Tracker System is a full-stack web application designed to manage sales records and analyze business performance. It provides a dashboard, sales history, charts, reports, CSV export, and AI-assisted sales insights.

The project helps users organize sales data and understand revenue, product performance, and sales trends.

## 2. Project Objectives

- Manage sales transactions in one application.
- Track revenue, quantity sold, and transaction counts.
- Analyze sales by category and product.
- Generate reports for business analysis.
- Provide insights based on recorded sales statistics.

## 3. Key Features

### Dashboard
Displays key sales metrics and visual summaries.

### Sales Management
Allows users to add, edit, and delete sales records.

### Sales History
Supports searching sales records and filtering by category and date.

### Sales Analytics
Includes sales overview charts, category performance, and top-selling product analysis.

### Reports
Provides sales summaries, date-wise sales reports, and historical sales reports.

### CSV Export
Allows sales data to be exported for further analysis.

### AI Sales Insights
Displays insights and business recommendations using verified sales statistics.

### Database Persistence
Stores sales records in an SQLite database so records remain available after a backend restart.

## 4. Technologies Used

- HTML — page structure
- CSS — styling and responsive layout
- JavaScript — frontend interactions
- Node.js — backend runtime
- Express.js — backend API
- SQLite — database
- Ollama with Llama 3.2 3B — local AI integration for the configured AI functionality

## 5. Project Structure

```text
sales-tracker/
├── backend/
│   ├── database.js
│   ├── package.json
│   ├── sales.db
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── dashboard-logo.png
│   ├── sales-logo.png
│   └── reports-logo.png
└── README.md
```

## 6. Requirements

- Node.js and npm
- Visual Studio Code or another code editor
- A modern web browser
- Live Server extension for the frontend
- Ollama and the configured model if using local AI functionality

## 7. How to Run the Project

### Step 1: Open the Project

Open the sales-tracker folder in Visual Studio Code.

### Step 2: Install Backend Dependencies

Open the VS Code terminal and run:

```bash
cd backend
npm install
```

### Step 3: Start the Backend

Run:

```bash
node server.js
```

Keep this terminal open while using the application. The backend is configured to run at http://localhost:3000 in the current setup.

### Step 4: Start the Frontend

Open frontend/index.html and launch it with the Live Server extension. Open the URL shown by VS Code.

### Step 5: Enable AI Functionality

If using AI Sales Insights, start Ollama and make sure the configured Llama 3.2 3B model is available. The backend must be configured to connect to Ollama.

## 8. Business Value

The project can help users:

- Monitor sales and revenue.
- Identify products and categories that perform well.
- Review sales activity over time.
- Export records for further analysis.
- Use sales statistics to support business decisions.

## 9. Testing

The project has been tested for core functionality, including sales management, search and filters, CSV export, reports, AI insights, and persistence across a backend restart.

## 10. Future Enhancements

- User authentication and access control.
- More advanced sales comparisons.
- Sales forecasting.
- Cloud deployment.
- Additional interactive business analytics.

## 11. Author

Developed as a full-stack sales analytics project to practice web development, data management, reporting, and business analysis.
