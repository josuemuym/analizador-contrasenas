import mysql.connector
from flask import Flask, request, jsonify, render_template, session
from zxcvbn import zxcvbn
from flask_cors import CORS
import bcrypt
import secrets
import os

app = Flask(__name__, static_folder='../static', template_folder='../templates')
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

DB_HOST = os.getenv('MYSQLHOST', 'localhost')
DB_USER = os.getenv('MYSQLUSER', 'root')
DB_PASSWORD = os.getenv('MYSQLPASSWORD', 'Josue15/06Muy')
DB_NAME = os.getenv('MYSQLDATABASE', 'analizador_passwords')
DB_PORT = os.getenv('MYSQLPORT', '3306')

def get_db():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=int(DB_PORT)
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/check-session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if user_id:
        return jsonify({
            "logged_in": True,
            "nombre": session.get('nombre'),
            "correo": session.get('correo')
        })
    return jsonify({"logged_in": False})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    correo = data.get('correo', '').strip()
    contrasena = data.get('contrasena', '')

    if not nombre or not correo or not contrasena:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    hashed_pw = bcrypt.hashpw(contrasena.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("INSERT INTO usuarios (nombre, correo, contrasena) VALUES (%s, %s, %s)",
                       (nombre, correo, hashed_pw))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"mensaje": "Usuario registrado correctamente"}), 201
    except mysql.connector.IntegrityError:
        return jsonify({"error": "El correo ya está registrado"}), 409
    except Exception as e:
        return jsonify({"error": f"Error al registrar: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    correo = data.get('correo', '').strip()
    contrasena = data.get('contrasena', '')

    if not correo or not contrasena:
        return jsonify({"error": "Correo y contraseña son obligatorios"}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE correo = %s", (correo,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    hashed_pw = user['contrasena']
    if type(hashed_pw) == str:
        hashed_pw = hashed_pw.encode('utf-8')

    if bcrypt.checkpw(contrasena.encode('utf-8'), hashed_pw):
        session['user_id'] = user['id']
        session['nombre'] = user['nombre']
        session['correo'] = user['correo']
        
        return jsonify({
            "mensaje": "Inicio de sesión exitoso",
            "nombre": user['nombre']
        }), 200
    else:
        return jsonify({"error": "Contraseña incorrecta"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"mensaje": "Sesión cerrada correctamente"}), 200

def seconds_to_spanish(seconds):
    try:
        s = float(seconds)
    except:
        return "Menos de un segundo"
    
    if s < 1:
        return "Menos de un segundo"
    
    if s < 60:
        sec = int(round(s))
        if sec == 1:
            return "1 segundo"
        return f"{sec} segundos"
    
    minutes = s / 60
    if minutes < 60:
        m = int(round(minutes))
        if m == 1:
            return "1 minuto"
        return f"{m} minutos"
    
    hours = minutes / 60
    if hours < 24:
        h = int(round(hours))
        if h == 1:
            return "1 hora"
        return f"{h} horas"
    
    days = hours / 24
    if days < 365:
        d = int(round(days))
        if d == 1:
            return "1 día"
        return f"{d} días"
    
    years = days / 365
    if years < 100:
        y = int(round(years))
        if y == 1:
            return "1 año"
        return f"{y} años"
    
    centuries = int(round(years / 100))
    if centuries == 1:
        return "1 siglo"
    return f"{centuries} siglos"

@app.route('/analyze', methods=['POST'])
def analyze_password():
    data = request.get_json()
    if not data:
        data = {}
    
    password = data.get('password', '')

    if not password:
        return jsonify({
            'score': 0,
            'strength': 'Muy Débil',
            'crack_time_online_es': 'Menos de un segundo',
            'crack_time_offline_slow_es': 'Menos de un segundo',
            'crack_time_offline_fast_es': 'Menos de un segundo',
            'guesses': 0,
            'attempts_per_second': 10000000
        })

    results = zxcvbn(password)
    score = results.get('score', 0)
    guesses = results.get('guesses', 0)
    crack_times_seconds = results.get('crack_times_seconds', {})

    secs_online = crack_times_seconds.get('online_no_throttling_10_per_second', 0)
    secs_off_slow = crack_times_seconds.get('offline_slow_hashing_1e4_per_second', 0)
    secs_off_fast = crack_times_seconds.get('offline_fast_hashing_1e10_per_second', 0)

    if score == 0:
        strength = 'Muy Débil'
    elif score == 1:
        strength = 'Débil'
    elif score == 2:
        strength = 'Media'
    elif score == 3:
        strength = 'Fuerte'
    else:
        strength = 'Muy Fuerte'

    return jsonify({
        'score': score,
        'strength': strength,
        'crack_time_online_es': seconds_to_spanish(secs_online),
        'crack_time_offline_slow_es': seconds_to_spanish(secs_off_slow),
        'crack_time_offline_fast_es': seconds_to_spanish(secs_off_fast),
        'guesses': guesses,
        'attempts_per_second': 10000000
    })

if __name__ == '__main__':
    app.run(debug=True)