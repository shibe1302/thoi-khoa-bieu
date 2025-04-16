# app.py
from flask import Flask, render_template, request, jsonify, g
import sqlite3
import os
import json

app = Flask(__name__, static_folder='.', static_url_path='')

# Database configuration
DATABASE = 'timetable.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

# Create sample data
def insert_sample_data():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM subjects")
        if cursor.fetchone()[0] == 0:
            sample_data = [
                (1, 'Math', 1, 2, 4, 'Dr. Smith', 'Room 101'),
                (2, 'Biology', 3, 1, 1, 'Mrs. Johnson', 'Lab 3'),
                (3, 'Math', 3, 7, 9, 'Dr. Smith', 'Room 101'),
                (4, 'Biology', 6, 3, 4, 'Mrs. Johnson', 'Lab 3')
            ]
            cursor.executemany(
                "INSERT INTO subjects (id, name, day, period_start, period_end, teacher, location) VALUES (?, ?, ?, ?, ?, ?, ?)",
                sample_data
            )
            db.commit()

# Routes
@app.route('/')
def index():
    return app.send_static_file('ui.html')

# API endpoints
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM subjects")
    subjects = []
    for row in cursor.fetchall():
        subject = {
            'id': row['id'],
            'name': row['name'],
            'day': row['day'],
            'periodStart': row['period_start'],
            'periodEnd': row['period_end'],
            'teacher': row['teacher'],
            'location': row['location']
        }
        subjects.append(subject)
    return jsonify(subjects)

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    # Get the next ID
    cursor.execute("SELECT MAX(id) FROM subjects")
    max_id = cursor.fetchone()[0]
    next_id = 1 if max_id is None else max_id + 1
    
    query = """
    INSERT INTO subjects (id, name, day, period_start, period_end, teacher, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        cursor.execute(query, (
            next_id,
            data['name'],
            data['day'],
            data['periodStart'],
            data['periodEnd'],
            data.get('teacher', ''),
            data.get('location', '')
        ))
        conn.commit()
        
        # Return the newly created subject
        return jsonify({
            'id': next_id,
            'name': data['name'],
            'day': data['day'],
            'periodStart': data['periodStart'],
            'periodEnd': data['periodEnd'],
            'teacher': data.get('teacher', ''),
            'location': data.get('location', '')
        })
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects/<int:subject_id>', methods=['PUT'])
def update_subject(subject_id):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
    UPDATE subjects
    SET name = ?, day = ?, period_start = ?, period_end = ?, teacher = ?, location = ?
    WHERE id = ?
    """
    
    try:
        cursor.execute(query, (
            data['name'],
            data['day'],
            data['periodStart'],
            data['periodEnd'],
            data.get('teacher', ''),
            data.get('location', ''),
            subject_id
        ))
        conn.commit()
        
        # Return the updated subject
        return jsonify({
            'id': subject_id,
            'name': data['name'],
            'day': data['day'],
            'periodStart': data['periodStart'],
            'periodEnd': data['periodEnd'],
            'teacher': data.get('teacher', ''),
            'location': data.get('location', '')
        })
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "DELETE FROM subjects WHERE id = ?"
    
    try:
        cursor.execute(query, (subject_id,))
        conn.commit()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check if database exists, if not create it and initialize
    if not os.path.exists(DATABASE):
        with app.app_context():
            init_db()
            insert_sample_data()
    
    app.run(debug=True)