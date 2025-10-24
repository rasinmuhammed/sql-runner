# SQL Runner Backend

FastAPI-based backend for SQL query execution with authentication.

## Features

- **RESTful API** with FastAPI
- **JWT Authentication** with bcrypt password hashing
- **SQLite Database** with sample data
- **Query History** tracking per user
- **Comprehensive Error Handling**
- **Auto-generated API Documentation** (Swagger/OpenAPI)

## Tech Stack

- Python 3.11
- FastAPI
- SQLite3
- JWT (python-jose)
- Bcrypt (passlib)
- Uvicorn (ASGI server)

## Setup

### Prerequisites
- Python 3.11 or higher
- pip

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Initialize database:
```bash
python -m app.database
```

This will create `sql_runner.db` with:
- Sample tables (Customers, Orders, Shippings)
- Users table for authentication
- Query history table
- Default admin user (username: `admin`, password: `admin123`)

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Query Execution
- `POST /query/execute` - Execute SQL query
- `GET /query/history` - Get query history
- `DELETE /query/history` - Clear query history

### Tables
- `GET /tables` - List all tables
- `GET /tables/{table_name}` - Get table schema and sample data

### Health
- `GET /health` - Health check endpoint

## Environment Variables

Create a `.env` file (optional):

```env
SECRET_KEY=your-secret-key-change-in-production-123456789
DATABASE_PATH=sql_runner.db
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100) NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1
);
```

### Query History Table
```sql
CREATE TABLE query_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error TEXT,
    rows_affected INTEGER,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
);
```

### Sample Data Tables
- **Customers**: customer_id, first_name, last_name, age, country
- **Orders**: order_id, item, amount, customer_id
- **Shippings**: shipping_id, status, customer

## Security

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: HS256 algorithm, 8-hour expiration
- **CORS**: Configured for frontend origins
- **Input Validation**: Pydantic models

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Test the API using curl:

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Execute query (with token)
curl -X POST http://localhost:8000/query/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"SELECT * FROM Customers;"}'
```

## Development

The backend uses:
- **Hot reload**: Enabled with `--reload` flag
- **Logging**: Configured for INFO level
- **CORS**: Allows frontend on ports 3000


## Troubleshooting

**Issue**: `ModuleNotFoundError`
- **Solution**: Make sure virtual environment is activated and dependencies installed

**Issue**: Database not found
- **Solution**: Run `python -m app.database` to initialize

**Issue**: Port 8000 already in use
- **Solution**: Change port or kill process using `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)
