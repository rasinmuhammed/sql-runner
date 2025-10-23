import sqlite3
from typing import List, Dict, Any, Union, Optional
import os
import re
from datetime import datetime

# Database configuration
DATABASE_PATH = os.getenv('DATABASE_PATH', 'sql_runner.db')


def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def close_db_connection(conn):
    """Close database connection"""
    if conn:
        conn.close()


def execute_query(query: str) -> Union[List[Dict[str, Any]], Dict[str, str]]:
    """
    Execute an SQL query and return results
    
    Args:
        query: SQL query string
        
    Returns:
        List of dictionaries for SELECT queries
        Dictionary with success message for DDL/DML queries
        Dictionary with error message if query fails
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Remove any trailing semicolons and whitespace
        query = query.strip().rstrip(';')
        query_upper = query.strip().upper()
        
        cursor.execute(query)
        
        # Check if it's a SELECT query
        if query_upper.startswith('SELECT'):
            results = cursor.fetchall()
            return [dict(row) for row in results]
        
        # For CREATE TABLE queries
        elif query_upper.startswith('CREATE TABLE'):
            conn.commit()
            # Extract table name
            match = re.search(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)', query_upper)
            table_name = match.group(1) if match else "table"
            return [{
                "message": f"Table '{table_name}' created successfully!",
                "type": "create_table",
                "affected_rows": 0
            }]
        
        # For CREATE INDEX queries
        elif query_upper.startswith('CREATE INDEX') or query_upper.startswith('CREATE UNIQUE INDEX'):
            conn.commit()
            return [{
                "message": "Index created successfully!",
                "type": "create_index",
                "affected_rows": 0
            }]
        
        # For DROP TABLE queries
        elif query_upper.startswith('DROP TABLE'):
            conn.commit()
            match = re.search(r'DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([^\s;]+)', query_upper)
            table_name = match.group(1) if match else "table"
            return [{
                "message": f"Table '{table_name}' dropped successfully!",
                "type": "drop_table",
                "affected_rows": 0
            }]
        
        # For ALTER TABLE queries
        elif query_upper.startswith('ALTER TABLE'):
            conn.commit()
            return [{
                "message": "Table altered successfully!",
                "type": "alter_table",
                "affected_rows": 0
            }]
        
        # For INSERT queries
        elif query_upper.startswith('INSERT'):
            conn.commit()
            affected_rows = cursor.rowcount
            return [{
                "message": f"Successfully inserted {affected_rows} row(s)!",
                "type": "insert",
                "affected_rows": affected_rows
            }]
        
        # For UPDATE queries
        elif query_upper.startswith('UPDATE'):
            conn.commit()
            affected_rows = cursor.rowcount
            return [{
                "message": f"Successfully updated {affected_rows} row(s)!",
                "type": "update",
                "affected_rows": affected_rows
            }]
        
        # For DELETE queries
        elif query_upper.startswith('DELETE'):
            conn.commit()
            affected_rows = cursor.rowcount
            return [{
                "message": f"Successfully deleted {affected_rows} row(s)!",
                "type": "delete",
                "affected_rows": affected_rows
            }]
        
        # For other queries
        else:
            conn.commit()
            affected_rows = cursor.rowcount
            return [{
                "message": f"Query executed successfully. {affected_rows} row(s) affected.",
                "type": "other",
                "affected_rows": affected_rows
            }]
            
    except sqlite3.Error as e:
        return {"error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        close_db_connection(conn)


def get_table_names() -> List[str]:
    """
    Get list of all tables in the database
    
    Returns:
        List of table names (excluding users table)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'users' ORDER BY name;"
        )
        tables = [row[0] for row in cursor.fetchall()]
        return tables
    except sqlite3.Error as e:
        return []
    finally:
        close_db_connection(conn)


def get_table_info(table_name: str) -> Dict[str, Any]:
    """
    Get schema and sample data for a specific table
    
    Args:
        table_name: Name of the table
        
    Returns:
        Dictionary containing columns and sample_data
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Validate table name exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
            (table_name,)
        )
        if not cursor.fetchone():
            return {"error": f"Table '{table_name}' not found"}
        
        # Get column information
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = [
            {
                "name": row[1],
                "type": row[2],
                "notnull": bool(row[3]),
                "default_value": row[4],
                "primary_key": bool(row[5])
            }
            for row in cursor.fetchall()
        ]
        
        # Get sample data (first 5 rows)
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
        sample_data = [dict(row) for row in cursor.fetchall()]
        
        return {
            "columns": columns,
            "sample_data": sample_data
        }
        
    except sqlite3.Error as e:
        return {"error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        close_db_connection(conn)


# User Management Functions

def create_user(username: str, email: str, full_name: str, hashed_password: str) -> Optional[Dict[str, Any]]:
    """
    Create a new user in the database
    
    Args:
        username: Unique username
        email: User's email address
        full_name: User's full name
        hashed_password: Hashed password
        
    Returns:
        Dictionary containing user data if successful, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (username, email, full_name, hashed_password, created_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (username, email, full_name, hashed_password, datetime.utcnow().isoformat(), True))
        
        conn.commit()
        
        user_id = cursor.lastrowid
        
        return {
            "user_id": user_id,
            "username": username,
            "email": email,
            "full_name": full_name,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
        
    except sqlite3.Error as e:
        print(f"Error creating user: {str(e)}")
        return None
    finally:
        close_db_connection(conn)


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """
    Get user by username
    
    Args:
        username: Username to search for
        
    Returns:
        Dictionary containing user data if found, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
        
    except sqlite3.Error as e:
        print(f"Error fetching user: {str(e)}")
        return None
    finally:
        close_db_connection(conn)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get user by email
    
    Args:
        email: Email to search for
        
    Returns:
        Dictionary containing user data if found, None otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
        
    except sqlite3.Error as e:
        print(f"Error fetching user: {str(e)}")
        return None
    finally:
        close_db_connection(conn)


def initialize_database():
    """
    Initialize the database with sample tables and data
    This should be run once to set up the database
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100),
                full_name VARCHAR(100) NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1
            );
        """)
        
        # Check if default admin user exists
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        if cursor.fetchone()[0] == 0:
            # Import password hashing
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            # Create default admin user
            hashed_password = pwd_context.hash("admin123")
            cursor.execute("""
                INSERT INTO users (username, email, full_name, hashed_password, created_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ("admin", "admin@sqlrunner.com", "Administrator", hashed_password, datetime.utcnow().isoformat(), True))
        
        # Create Customers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Customers (
                customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                age INTEGER,
                country VARCHAR(100)
            );
        """)
        
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM Customers")
        if cursor.fetchone()[0] == 0:
            # Insert sample customers
            cursor.execute("""
                INSERT INTO Customers (first_name, last_name, age, country) VALUES
                ('John', 'Doe', 31, 'USA'),
                ('Robert', 'Luna', 22, 'USA'),
                ('David', 'Robinson', 22, 'UK'),
                ('John', 'Reinhardt', 25, 'UK'),
                ('Betty', 'Doe', 28, 'UAE');
            """)
        
        # Create Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Orders (
                order_id INTEGER PRIMARY KEY AUTOINCREMENT,
                item VARCHAR(100),
                amount INTEGER,
                customer_id INTEGER,
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            );
        """)
        
        cursor.execute("SELECT COUNT(*) FROM Orders")
        if cursor.fetchone()[0] == 0:
            # Insert sample orders
            cursor.execute("""
                INSERT INTO Orders (item, amount, customer_id) VALUES
                ('Keyboard', 400, 4),
                ('Mouse', 300, 4),
                ('Monitor', 12000, 3),
                ('Keyboard', 400, 1),
                ('Mousepad', 250, 2);
            """)
        
        # Create Shippings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS Shippings (
                shipping_id INTEGER PRIMARY KEY AUTOINCREMENT,
                status VARCHAR(100),
                customer INTEGER
            );
        """)
        
        cursor.execute("SELECT COUNT(*) FROM Shippings")
        if cursor.fetchone()[0] == 0:
            # Insert sample shippings
            cursor.execute("""
                INSERT INTO Shippings (status, customer) VALUES
                ('Pending', 2),
                ('Pending', 4),
                ('Delivered', 3),
                ('Pending', 5),
                ('Delivered', 1);
            """)
        
        conn.commit()
        print("Database initialized successfully!")
        print("Default admin user created - Username: admin, Password: admin123")
        
    except sqlite3.Error as e:
        print(f"Error initializing database: {str(e)}")
        conn.rollback()
    finally:
        close_db_connection(conn)


if __name__ == "__main__":
    # Run this to initialize the database
    initialize_database()