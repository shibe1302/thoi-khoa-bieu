import sqlite3

# Connect to database (creates it if it doesn't exist)
conn = sqlite3.connect('timetable.db')
cursor = conn.cursor()

# Create the subjects table
cursor.execute('''
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    day INTEGER NOT NULL,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,
    teacher TEXT,
    location TEXT
)
''')

# Commit changes and close connection
conn.commit()
conn.close()