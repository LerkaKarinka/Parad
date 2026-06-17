from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Разрешаем запросы с фронтенда

# Путь к базе данных (можно переопределить через переменную окружения)
DB_PATH = os.environ.get('DB_PATH', '/app/data/parad.db')

# ========== Функции для работы с БД ==========

def get_db_connection():
    """Создаёт соединение с SQLite базой данных"""
    # Убеждаемся, что директория для БД существует
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Чтобы результаты были как словари
    return conn

def init_db():
    """Создаёт таблицы, если их нет"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Таблица для записей номинаций
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS nomination_entries (
            id TEXT PRIMARY KEY,
            nomination_id TEXT NOT NULL,
            photo TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица для сценариев
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            fileName TEXT,
            fileData TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ База данных SQLite готова")

# ========== Маршруты для HTML страниц ==========

@app.route('/')
def index():
    """Главная страница"""
    if os.path.exists('index.html'):
        return send_from_directory('.', 'index.html')
    return "index.html не найден", 404

@app.route('/<path:filename>')
def serve_static(filename):
    """Отдаём все статические файлы (HTML, CSS, JS)"""
    # Защита от доступа к системным файлам
    if '..' in filename or filename.startswith('/'):
        return "Invalid path", 400
    
    # Проверяем, существует ли файл
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    else:
        return f"Файл {filename} не найден", 404

# ========== API для записей номинаций ==========

@app.route('/api/entries/<nomination_id>', methods=['GET'])
def get_entries(nomination_id):
    """Получить все записи для конкретной номинации"""
    conn = get_db_connection()
    entries = conn.execute(
        'SELECT * FROM nomination_entries WHERE nomination_id = ? ORDER BY created_at DESC',
        (nomination_id,)
    ).fetchall()
    conn.close()
    
    # Преобразуем Row в обычный dict
    result = [dict(entry) for entry in entries]
    return jsonify(result)

@app.route('/parad/api/entries', methods=['POST'])
def save_entry():
    """Сохранить или обновить запись"""
    data = request.json
    entry_id = data.get('id')
    nomination_id = data.get('nominationId')
    photo = data.get('photo')
    description = data.get('description')
    
    conn = get_db_connection()
    conn.execute('''
        INSERT OR REPLACE INTO nomination_entries (id, nomination_id, photo, description)
        VALUES (?, ?, ?, ?)
    ''', (entry_id, nomination_id, photo, description))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'id': entry_id})

@app.route('/parad/api/entries/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    """Удалить запись по ID"""
    conn = get_db_connection()
    conn.execute('DELETE FROM nomination_entries WHERE id = ?', (entry_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ========== API для сценариев ==========

@app.route('/parad/api/scenarios', methods=['GET'])
def get_scenarios():
    """Получить все сценарии"""
    conn = get_db_connection()
    scenarios = conn.execute(
        'SELECT * FROM scenarios ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    
    # Преобразуем timestamp в строку для JSON
    result = []
    for scenario in scenarios:
        scenario_dict = dict(scenario)
        if scenario_dict.get('created_at'):
            scenario_dict['created_at'] = scenario_dict['created_at']
        result.append(scenario_dict)
    
    return jsonify(result)

@app.route('/parad/api/scenarios', methods=['POST'])
def save_scenario():
    """Сохранить новый сценарий"""
    data = request.json
    scenario_id = data.get('id')
    name = data.get('name')
    file_name = data.get('fileName')
    file_data = data.get('fileData')
    created_at = data.get('createdAt', datetime.now().strftime('%Y-%m-%d'))
    
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO scenarios (id, name, fileName, fileData, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (scenario_id, name, file_name, file_data, created_at))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'id': scenario_id})

@app.route('/parad/api/scenarios/<scenario_id>', methods=['DELETE'])
def delete_scenario(scenario_id):
    """Удалить сценарий по ID"""
    conn = get_db_connection()
    conn.execute('DELETE FROM scenarios WHERE id = ?', (scenario_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ========== Запуск сервера ==========

if __name__ == '__main__':
    # Проверяем, есть ли все нужные HTML файлы
    required_files = ['index.html', 'admin-panel.html', 'login.html']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("\n⚠️ ВНИМАНИЕ: Отсутствуют следующие файлы:")
        for f in missing_files:
            print(f"   - {f}")
        print("\nУбедитесь, что все HTML файлы находятся в той же папке, что и app.py\n")
    
    init_db()  # Инициализируем БД при запуске
    
    # Получаем IP адрес для вывода
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("\n" + "="*50)
    print("🚀 Сервер запущен!")
    print(f"📍 Локальный доступ: http://192.168.3.78:5001/")
    print("="*50 + "\n")
    
    app.run(debug=True, port=5001, host='0.0.0.0')
