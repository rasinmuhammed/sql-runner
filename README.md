# SQL Runner - Full-Stack Web Application

A modern SQL query execution platform with user authentication, real-time results, and an intuitive interface.

![SQL Runner](https://img.shields.io/badge/Next.js-16.0.0-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

## Table of Contents

- [Assignment Requirements](#assignment-requirements)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start with Docker](#-quick-start-with-docker)
- [Manual Setup](#-manual-setup)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Evaluation Criteria](#-evaluation-criteria-met)

## 📝 Assignment Requirements

This project fulfills all requirements from the **Full-Stack Development Assignment**:

### Core Requirements

**Frontend (Next.js/React):**
- ✅ Query Input Area with prominent text area and "Run Query" button
- ✅ Results Display Area with formatted tabular data, column headers, and rows
- ✅ Visual feedback for loading states and errors
- ✅ Available Tables Panel showing table list, schema, and sample data

**Backend (Python/FastAPI):**
- ✅ RESTful API endpoint for query execution (POST)
- ✅ Connection to SQLite database with sample data
- ✅ Query execution with structured JSON response
- ✅ Comprehensive error handling with informative messages
- ✅ API endpoint for table list retrieval
- ✅ API endpoint for table schema and sample rows

**Database Setup:**
- ✅ SQLite database with Customers, Orders, and Shippings tables
- ✅ Sample data matching assignment specifications
- ✅ Proper foreign key relationships

### Bonus Features

- ✅ **Authentication System**: JWT-based with bcrypt password hashing
- ✅ **Query History**: Persistent storage in database with search/filter capabilities
- ✅ **Dockerization**: Complete Docker setup with docker-compose.yml for easy deployment

###  Additional Enhancements

Beyond requirements, this implementation includes:
-  **Theme System**: Dark/light mode with smooth transitions
-  **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
-  **Advanced UI/UX**: Modern design with animations and micro-interactions
-  **Rich Table Info**: Primary keys, NOT NULL indicators, type color coding
-  **Query History Search**: Filter and search through past queries
-  **Copy to Clipboard**: Quick query copying from history

##  Features

### Core Features
- ✅ **SQL Query Execution**: Execute SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, and ALTER queries
- ✅ **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- ✅ **Database Explorer**: Interactive sidebar showing all tables with schema and sample data
- ✅ **Query History**: Persistent query history stored in database per user
- ✅ **Real-time Results**: Beautiful table display with column headers and formatted data
- ✅ **Error Handling**: Comprehensive error messages and validation
- ✅ **Responsive Design**: Mobile-first design that works on all screen sizes

### Bonus Features Implemented
-  **Dark/Light Theme**: Smooth theme switching with system preference detection
-  **User Registration**: Complete signup flow with validation
-  **Advanced Query History**: 
  - Search and filter capabilities
  - Success/error status tracking
  - Copy to clipboard functionality
  - Timestamp with relative time display
  - Persistent storage in database
-  **Full Dockerization**: Complete Docker setup with compose file

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.0.0 (React 19.2.0)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Language**: JavaScript

### Backend
- **Framework**: FastAPI
- **Database**: SQLite with sqlite3
- **Authentication**: JWT (python-jose) + bcrypt (passlib)
- **Validation**: Pydantic
- **Server**: Uvicorn

### DevOps
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 📦 Prerequisites

### For Docker Setup (Recommended)
- Docker 20.10 or higher
- Docker Compose 2.0 or higher

### For Manual Setup
- Node.js 20.x or higher
- Python 3.11 or higher
- npm or yarn
- pip

## 🐳 Quick Start with Docker

The easiest way to run the entire application:

```bash
# 1. Clone the repository
git clone <repository-url>
cd sql-runner

# 2. Start the application
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**That's it!** The application is now running with:
- ✅ Backend API on port 8000
- ✅ Frontend UI on port 3000
- ✅ Database initialized with sample data
- ✅ Default admin user created

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

### Docker Compose Commands

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build --force-recreate

# Remove all containers and volumes (fresh start)
docker-compose down -v
```

## 🔧 Manual Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database with sample data
python -m app.database

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
sql-runner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app and routes
│   │   ├── database.py          # Database operations
│   │   ├── auth.py              # Authentication logic
│   │   └── models.py            # Pydantic models
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── README.md                # Backend documentation
│   └── sql_runner.db           # SQLite database (created on init)
├── frontend/
│   ├── app/
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── login/              # Login page
│   │   ├── signup/             # Registration page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (redirects)
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── QueryEditor.js      # SQL query editor
│   │   ├── ResultsTable.js     # Query results display
│   │   ├── TablesSidebar.js    # Database tables explorer
│   │   ├── QueryHistory.js     # Query history panel
│   │   └── ThemeToggle.js      # Theme switcher
│   ├── contexts/
│   │   └── ThemeContext.js     # Theme management
│   ├── lib/
│   │   └── api.js              # API client
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md               # Frontend documentation
│   └── next.config.ts
├── docker-compose.yml          # Docker composition
├── .gitignore
└── README.md                   # This file
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user
```json
{
  "username": "john_doe",
  "password": "secure123",
  "full_name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "created_at": "2025-10-24T12:00:00",
    "is_active": true
  }
}
```

#### POST `/auth/login`
Authenticate and get access token
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "admin",
  "full_name": "Administrator"
}
```

#### GET `/auth/me`
Get current user information (requires authentication)

**Response:**
```json
{
  "user_id": 1,
  "username": "admin",
  "email": "admin@sqlrunner.com",
  "full_name": "Administrator",
  "created_at": "2025-10-24T10:00:00",
  "is_active": true
}
```

### Query Endpoints

#### POST `/query/execute`
Execute SQL query (requires authentication)
```json
{
  "query": "SELECT * FROM Customers WHERE age > 25;"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "customer_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "age": 31,
      "country": "USA"
    }
  ],
  "columns": ["customer_id", "first_name", "last_name", "age", "country"],
  "execution_time": 0.0023
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Database error: no such table: NonExistent",
  "execution_time": 0.0012
}
```

#### GET `/query/history`
Get user's query history (requires authentication)

**Response:**
```json
[
  {
    "query": "SELECT * FROM Customers;",
    "timestamp": "2025-10-24T12:30:00",
    "success": true,
    "error": null,
    "rows_affected": 5
  }
]
```

#### DELETE `/query/history`
Clear user's query history (requires authentication)

**Response:**
```json
{
  "message": "Query history cleared successfully"
}
```

### Table Endpoints

#### GET `/tables`
List all available tables (requires authentication)

**Response:**
```json
{
  "tables": ["Customers", "Orders", "Shippings"]
}
```

#### GET `/tables/{table_name}`
Get table schema and sample data (requires authentication)

**Response:**
```json
{
  "columns": [
    {
      "name": "customer_id",
      "type": "INTEGER",
      "notnull": false,
      "default_value": null,
      "primary_key": true
    },
    {
      "name": "first_name",
      "type": "VARCHAR(100)",
      "notnull": false,
      "default_value": null,
      "primary_key": false
    }
  ],
  "sample_data": [
    {
      "customer_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "age": 31,
      "country": "USA"
    }
  ]
}
```

### Health Check

#### GET `/health`
Check API health status

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T12:00:00",
  "version": "1.0.0"
}
```

**Full interactive API documentation**: `http://localhost:8000/docs`

## 📖 Usage Guide

### 1. **Login/Register**

- Open `http://localhost:3000`
- Use default credentials or create new account:
  - Username: `admin`
  - Password: `admin123`
- Or click "Create one here" to register

### 2. **Explore Database**

- Left sidebar shows all available tables
- Click on a table to view:
  - Column names and data types
  - Primary keys (yellow key icon)
  - NOT NULL constraints (orange badge)
  - Sample data (first 5 rows)
- Refresh button updates table list

### 3. **Write and Execute Queries**

Example queries:

```sql
-- Simple SELECT
SELECT * FROM Customers;

-- JOIN query
SELECT c.first_name, o.item, o.amount 
FROM Customers c
JOIN Orders o ON c.customer_id = o.customer_id;

-- WHERE clause
SELECT * FROM Customers WHERE age > 25;

-- CREATE TABLE
CREATE TABLE Products (
    product_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

-- INSERT data
INSERT INTO Products (name, price) 
VALUES ('Laptop', 999.99);

-- UPDATE data
UPDATE Products SET price = 899.99 WHERE name = 'Laptop';

-- DELETE data
DELETE FROM Orders WHERE amount < 300;

-- DROP TABLE
DROP TABLE IF EXISTS Products;
```

**Keyboard Shortcuts:**
- `Ctrl + Enter` / `Cmd + Enter`: Execute query
- `Tab`: Insert 2 spaces (indentation)

**Editor Features:**
- Drag bottom edge to resize
- Click maximize icon to expand
- Character counter in footer

### 4. **View Results**

- Results appear below query editor
- Desktop: Formatted table with columns
- Mobile: Card view for better readability
- Error messages shown with details
- Execution time displayed
- Success messages for DDL/DML operations
- NULL values properly indicated

### 5. **Query History**

- Click "History" button in header (or use sidebar on desktop)
- View all past queries with:
  - Timestamp (relative: "5 mins ago" and absolute: "2:30 PM")
  - Success/error status with icons
  - Error messages if query failed
  - Rows affected for successful queries
- **Search**: Type in search box to filter queries
- **Filter**: Show all/success/error only
- **Copy**: Click copy icon to copy query to clipboard
- **Clear**: Remove all history (with confirmation)
- History persists across sessions (stored in database)

### 6. **Theme Switching**

- Click moon/sun icon in header
- Switches between dark and light mode
- Preference saved to localStorage
- Smooth transitions between themes
- System preference detected on first visit

### 7. **Responsive Features**

**Desktop (≥1024px):**
- Tables sidebar visible on left
- History panel visible on right (click to toggle)
- Query editor in center with results below

**Tablet (768px-1023px):**
- Tables sidebar toggleable (overlay)
- History panel toggleable (overlay)
- One sidebar visible at a time

**Mobile (<768px):**
- Full-screen overlay sidebars
- Tap outside to close
- Optimized touch targets
- Card-based results view

##  Deployment

### Docker Deployment (Recommended)

1. **Production Environment Variables:**

Create `.env` file in root:
```env
# Backend
SECRET_KEY=your-super-secret-production-key-here-minimum-32-characters
DATABASE_PATH=/app/sql_runner.db

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

2. **Update docker-compose.yml for production:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_PATH=${DATABASE_PATH}
    volumes:
      - ./backend/sql_runner.db:/app/sql_runner.db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    restart: unless-stopped
```


## 🔧 Troubleshooting

### Docker Issues

**Problem**: Port already in use
```bash
# Solution 1: Stop services using ports
docker-compose down
lsof -i :3000  # macOS/Linux
lsof -i :8000

# Solution 2: Change ports in docker-compose.yml
```

**Problem**: Database not initializing
```bash
# Solution: Rebuild backend with fresh volume
docker-compose down -v
docker-compose up --build backend
```

**Problem**: Frontend can't connect to backend
```bash
# Check network
docker network ls
docker network inspect sql-runner-network

# Check backend logs
docker-compose logs backend

# Verify environment variable
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
```

**Problem**: Permission denied errors
```bash
# Solution: Fix file permissions
chmod -R 755 backend/
chmod -R 755 frontend/
```

### Manual Setup Issues

**Problem**: Module not found (Backend)
```bash
# Solution: Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

**Problem**: Module not found (Frontend)
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Database not created
```bash
# Solution: Run initialization script
cd backend
python -m app.database
```

**Problem**: Port conflicts
```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :8000
# macOS/Linux:
lsof -i :8000

# Kill the process
# Windows:
taskkill /PID <PID> /F
# macOS/Linux:
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

### Common Errors

**Error**: "JWT Token Expired"
- **Solution**: Log out and log back in
- **Cause**: Token expires after 8 hours

**Error**: "Query Syntax Error"
- **Solution**: Check SQL syntax
- **Note**: SQLite has some limitations (no RIGHT JOIN, etc.)

**Error**: "CORS Error"
- **Solution**: Check backend CORS middleware configuration
- **Verify**: Frontend URL in allowed origins

**Error**: "Network Error"
- **Solution**: Ensure backend is running
- **Check**: API_URL in .env.local matches backend address

**Error**: "Database Locked"
- **Solution**: Close other connections to database
- **Note**: SQLite doesn't support concurrent writes well

### Getting Help

1. **Check Logs:**
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Manual
# Backend logs in terminal
# Frontend logs in browser console (F12)
```

2. **Check API Health:**
```bash
curl http://localhost:8000/health
```

3. **View API Documentation:**
- Open `http://localhost:8000/docs`
- Test endpoints interactively

4. **Check Database:**
```bash
# Connect to SQLite database
sqlite3 backend/sql_runner.db

# List tables
.tables

# View table schema
.schema Customers

# Query data
SELECT * FROM users;

# Exit
.exit
```

**Ready to start?** 

Run `docker-compose up --build` and visit `http://localhost:3000`! 

**Need help?** Check the troubleshooting section or review the API documentation at `http://localhost:8000/docs`