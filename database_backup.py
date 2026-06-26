import sqlite3
import os

DB_PATH = 'aqi_dashboard.db'

def get_db_connection():
    """Establishes a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schemas for favorites and search history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create favorites table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            country TEXT NOT NULL,
            region TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(latitude, longitude)
        )
    ''')
    
    # Create search history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def add_favorite(city_name, latitude, longitude, country, region):
    """Adds a location to the favorites list. Ignores if it already exists."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO favorites (city_name, latitude, longitude, country, region)
            VALUES (?, ?, ?, ?, ?)
        ''', (city_name, float(latitude), float(longitude), country, region))
        conn.commit()
        success = cursor.rowcount > 0
    except sqlite3.Error:
        success = False
    finally:
        conn.close()
    return success

def get_favorites():
    """Retrieves all favorite locations ordered by addition date (newest first)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM favorites ORDER BY added_at DESC')
    rows = cursor.fetchall()
    favorites = [dict(row) for row in rows]
    conn.close()
    return favorites

def delete_favorite(favorite_id):
    """Deletes a location from favorites by its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM favorites WHERE id = ?', (int(favorite_id),))
        conn.commit()
        success = cursor.rowcount > 0
    except sqlite3.Error:
        success = False
    finally:
        conn.close()
    return success

def add_search_query(query):
    """Adds a search query to history and prunes history to keep only the latest 10 items."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO search_history (query) VALUES (?)', (query,))
        # Prune old searches (keep latest 10)
        cursor.execute('''
            DELETE FROM search_history 
            WHERE id NOT IN (
                SELECT id FROM search_history 
                ORDER BY timestamp DESC LIMIT 10
            )
        ''')
        conn.commit()
    except sqlite3.Error:
        pass
    finally:
        conn.close()

def get_recent_searches():
    """Retrieves the list of the 10 most recent search queries."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT query FROM search_history ORDER BY timestamp DESC LIMIT 10')
    rows = cursor.fetchall()
    searches = [row['query'] for row in rows]
    conn.close()
    return searches
