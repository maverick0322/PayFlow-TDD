import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'payflow.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    # Tablas iniciales. Se irán expandiendo según desarrollemos los módulos.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS presupuesto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pmt REAL NOT NULL,
            ahorro_meta REAL NOT NULL,
            estado TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
