from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import re
import secrets
import sqlite3
from dotenv import load_dotenv
from datetime import datetime
import uuid
import requests
from werkzeug.security import check_password_hash, generate_password_hash

# Load credentials from server/.env regardless of the directory used to start Flask.
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app, origins=os.getenv("FRONTEND_URL", "http://localhost:5173").split(","))

DB_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "vent.db"))
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    with get_db() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                user_email TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_activity TEXT NOT NULL,
                title TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                sender TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                user_email TEXT NOT NULL
            );
        """)


def public_user(row):
    return {"id": row["id"], "email": row["email"]}


def issue_token(user_id):
    token = secrets.token_urlsafe(32)
    expires_at = int(datetime.now().timestamp()) + TOKEN_TTL_SECONDS
    with get_db() as connection:
        connection.execute(
            "INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at),
        )
    return token


def current_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header.removeprefix("Bearer ").strip()
    with get_db() as connection:
        row = connection.execute(
            "SELECT users.* FROM auth_tokens JOIN users ON users.id = auth_tokens.user_id "
            "WHERE auth_tokens.token = ? AND auth_tokens.expires_at > ?",
            (token, int(datetime.now().timestamp())),
        ).fetchone()
    return row


def require_user():
    user = current_user()
    if user is None:
        return jsonify({"error": "Authentication required"}), 401
    return user


init_db()

messages = {}

THERAPEUTIC_RESPONSES = {
    'crisis': [
        "It sounds like you're going through a very difficult time. If you're thinking about harming yourself or others, please reach out to a mental health professional or a crisis helpline immediately. You're not alone, and there are people who care and want to help."
    ]
}

CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself', 'give up', "can't go on", 'want to die', 'die', 'worthless', 'hopeless', 'no way out'
]

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
DEFAULT_ELEVEN_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

def detect_crisis(text):
    lowered = text.lower()
    for word in CRISIS_KEYWORDS:
        if word in lowered:
            return True
    return False

def call_groq_chat_completion(message_history):
    if not GROQ_API_KEY:
        print("GROQ_API_KEY not set in environment.")
        return None
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    data = {
        "model": os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        "messages": message_history,
        "temperature": 0.7,
        "max_tokens": 120
    }
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            print(f"Groq API error: {response.status_code} {response.text}")
            return None
    except Exception as e:
        print(f"Groq API exception: {e}")
    return None


def call_gemini_chat_completion(message_history):
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set in environment.")
        return None

    system_message = next(
        (message["content"] for message in message_history if message["role"] == "system"),
        "You are a warm, empathetic emotional support assistant.",
    )
    contents = [
        {
            "role": "model" if message["role"] == "assistant" else "user",
            "parts": [{"text": message["content"]}],
        }
        for message in message_history
        if message["role"] != "system"
    ]
    payload = {
        "system_instruction": {"parts": [{"text": system_message}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 160},
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            candidates = response.json().get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(part.get("text", "") for part in parts).strip()
                if text:
                    return text
        print(f"Gemini API error: {response.status_code} {response.text[:500]}")
    except requests.RequestException as exc:
        print(f"Gemini API exception: {exc}")
    return None

def analyze_mood_from_messages(message_list):
    if not message_list:
        return "neutral"
    user_text = " ".join(
        m.get("text", "") for m in message_list if m.get("sender") == "user"
    ).lower()
    if detect_crisis(user_text):
        return "sad"
    sad_words = ["sad", "depressed", "lonely", "hopeless", "cry", "tired", "anxious", "stress"]
    happy_words = ["happy", "grateful", "excited", "good", "great", "better", "relief", "calm"]
    sad_score = sum(1 for w in sad_words if w in user_text)
    happy_score = sum(1 for w in happy_words if w in user_text)
    if happy_score > sad_score and happy_score > 0:
        return "happy" if happy_score >= 2 else "positive"
    if sad_score > happy_score and sad_score > 0:
        return "sad" if sad_score >= 2 else "negative"
    return "neutral"


def get_ai_response(message_history, user_email):
    user_message = message_history[-1]['text'] if message_history else ''
    if detect_crisis(user_message):
        return THERAPEUTIC_RESPONSES['crisis'][0]
    groq_history = [
        {"role": "system", "content": (
            "You are an engaging, empathetic AI therapist. Respond to users in a warm, conversational, and supportive manner. "
            "Ask thoughtful follow-up questions to keep the conversation going and help users reflect on their feelings. "
            "Offer therapeutic advice, encouragement, and validation. Avoid generic responses—make each reply feel personal and attentive. "
            "Keep each response concise: 1 to 3 sentences, with one clear follow-up question when helpful."
        )}
    ]
    for msg in message_history:
        role = 'user' if msg['sender'] == 'user' else 'assistant'
        groq_history.append({"role": role, "content": msg['text']})
    gemini_response = call_gemini_chat_completion(groq_history)
    if gemini_response:
        return gemini_response
    groq_response = call_groq_chat_completion(groq_history)
    if groq_response:
        return groq_response
    return local_support_response(user_message)


def valid_password(password):
    return (
        len(password) >= 8
        and re.search(r"[a-z]", password)
        and re.search(r"[A-Z]", password)
        and re.search(r"[0-9]", password)
        and re.search(r"[^A-Za-z0-9]", password)
    )


@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if not valid_password(password):
        return jsonify({"error": "Password must be at least 8 characters and include lowercase, uppercase, number, and special character."}), 400
    user = {"id": str(uuid.uuid4()), "email": email, "created_at": datetime.now().isoformat()}
    try:
        with get_db() as connection:
            connection.execute(
                "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user["id"], email, generate_password_hash(password), user["created_at"]),
            )
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists. Try logging in."}), 409
    return jsonify({"user": {"id": user["id"], "email": email}, "token": issue_token(user["id"])}), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Incorrect email or password."}), 401
    return jsonify({"user": public_user(user), "token": issue_token(user["id"])}), 200


@app.route('/api/auth/me', methods=['GET'])
def me():
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    return jsonify({"user": public_user(user)})


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    header = request.headers.get("Authorization", "")
    token = header.removeprefix("Bearer ").strip() if header.startswith("Bearer ") else ""
    with get_db() as connection:
        connection.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))
    return jsonify({"ok": True})


def local_support_response(user_message):
    """Keep chat usable when an external AI key is missing or temporarily unavailable."""
    lowered = user_message.lower()
    if any(word in lowered for word in ["anxious", "anxiety", "panic", "stressed"]):
        return "That sounds really heavy to carry. Try taking one slow breath in and a longer breath out, then notice one thing around you that feels steady. What part of this situation feels most difficult right now?"
    if any(word in lowered for word in ["sad", "lonely", "upset", "crying"]):
        return "I hear how painful and lonely this feels. You do not have to solve everything at once; naming what hurts is already a meaningful step. What happened today that brought these feelings forward?"
    if any(word in lowered for word in ["happy", "good", "excited", "grateful"]):
        return "It is good to hear a little light in your day. Taking a moment to notice what is helping can make that feeling easier to return to. What has been going well for you?"
    return "Thank you for sharing that with me. I am here to listen and help you think it through without judgment. What feels most important about this for you right now?"

@app.route('/api/voices', methods=['GET'])
def list_voices():
    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API key not configured", "voices": []}), 503
    try:
        response = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            timeout=15,
        )
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch voices", "voices": []}), response.status_code
        data = response.json()
        return jsonify({"voices": data.get("voices", [])})
    except Exception as exc:
        print(f"ElevenLabs voices error: {exc}")
        return jsonify({"error": "Voice service unavailable", "voices": []}), 500


@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API key not configured"}), 503
    data = request.json or {}
    text = (data.get("text") or "").strip()
    voice_id = data.get("voiceId") or DEFAULT_ELEVEN_VOICE_ID
    if not text:
        return jsonify({"error": "Text is required"}), 400
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text[:2500],
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    try:
        response = requests.post(
            url,
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json=payload,
            timeout=30,
        )
        if response.status_code != 200:
            print(f"ElevenLabs TTS error: {response.status_code} {response.text}")
            return jsonify({"error": "Text-to-speech failed"}), response.status_code
        return Response(response.content, mimetype="audio/mpeg")
    except Exception as exc:
        print(f"ElevenLabs TTS exception: {exc}")
        return jsonify({"error": "Text-to-speech service unavailable"}), 500


@app.route('/api/stt', methods=['POST'])
def speech_to_text():
    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API key not configured"}), 503
    audio = request.files.get('audio')
    if audio is None or not audio.filename:
        return jsonify({"error": "Audio is required"}), 400

    try:
        response = requests.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            files={
                "file": (
                    audio.filename,
                    audio.stream,
                    audio.mimetype or "audio/webm",
                )
            },
            data={"model_id": "scribe_v1", "language_code": "eng"},
            timeout=60,
        )
        if response.status_code != 200:
            print(f"ElevenLabs STT error: {response.status_code} {response.text}")
            return jsonify({"error": "Speech-to-text failed"}), response.status_code
        transcript = response.json().get("text", "").strip()
        return jsonify({"text": transcript})
    except Exception as exc:
        print(f"ElevenLabs STT exception: {exc}")
        return jsonify({"error": "Speech-to-text service unavailable"}), 500


@app.route('/api/mood-analysis', methods=['POST'])
def mood_analysis():
    data = request.json or {}
    message_list = data.get("messages", [])
    mood = analyze_mood_from_messages(message_list)
    return jsonify({"mood": mood})


@app.route('/api/messages', methods=['GET'])
def get_messages():
    user_email = request.args.get('email')
    if not user_email:
        return jsonify({"error": "User email required"}), 400
    user_messages = messages.get(user_email, [])
    return jsonify(user_messages)

@app.route('/api/messages', methods=['POST'])
def add_message():
    data = request.json
    if not data or 'text' not in data or 'userEmail' not in data:
        return jsonify({"error": "Message text and user email required"}), 400
    user_email = data['userEmail']
    if user_email not in messages:
        messages[user_email] = []
    user_message = {
        "id": str(len(messages[user_email]) + 1),
        "text": data['text'],
        "sender": "user",
        "timestamp": datetime.now().isoformat(),
        "userEmail": user_email
    }
    messages[user_email].append(user_message)
    ai_response_text = get_ai_response(messages[user_email], user_email)
    ai_message = {
        "id": str(len(messages[user_email]) + 1),
        "text": ai_response_text,
        "sender": "ai",
        "timestamp": datetime.now().isoformat(),
        "userEmail": user_email
    }
    messages[user_email].append(ai_message)
    return jsonify({
        "userMessage": user_message,
        "aiMessage": ai_message
    })

@app.route('/api/sessions', methods=['POST'])
def create_session():
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    session_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    with get_db() as connection:
        connection.execute(
            "INSERT INTO sessions (id, user_id, user_email, created_at, last_activity, title) VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, user["id"], user["email"], now, now, "New Session"),
        )
    return jsonify({"id": session_id, "userEmail": user["email"], "createdAt": now, "lastActivity": now, "title": "New Session"})

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    with get_db() as connection:
        rows = connection.execute(
            "SELECT id, user_email, created_at, last_activity, title FROM sessions WHERE user_id = ? ORDER BY last_activity DESC",
            (user["id"],),
        ).fetchall()
    return jsonify([{
        "id": row["id"], "userEmail": row["user_email"], "createdAt": row["created_at"],
        "lastActivity": row["last_activity"], "title": row["title"]
    } for row in rows])

@app.route('/api/sessions/<session_id>/messages', methods=['GET'])
def get_session_messages(session_id):
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    with get_db() as connection:
        session = connection.execute("SELECT id FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])).fetchone()
        if session is None:
            return jsonify({"error": "Session not found"}), 404
        rows = connection.execute(
            "SELECT id, text, sender, timestamp, user_email, session_id FROM messages WHERE session_id = ? ORDER BY rowid",
            (session_id,),
        ).fetchall()
    return jsonify([dict(row) for row in rows])

@app.route('/api/sessions/<session_id>/messages', methods=['POST'])
def add_session_message(session_id):
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    data = request.json or {}
    if not data or 'text' not in data:
        return jsonify({"error": "Message text required"}), 400
    text = data['text'].strip()
    if not text:
        return jsonify({"error": "Message text required"}), 400
    with get_db() as connection:
        session = connection.execute("SELECT * FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])).fetchone()
        if session is None:
            return jsonify({"error": "Session not found"}), 404
        previous = connection.execute("SELECT text, sender FROM messages WHERE session_id = ? ORDER BY rowid", (session_id,)).fetchall()
        now = datetime.now().isoformat()
        user_message = {
            "id": str(uuid.uuid4()), "text": text, "sender": "user", "timestamp": now,
            "userEmail": user["email"], "sessionId": session_id
        }
        history = [dict(row) for row in previous] + [user_message]
        ai_response_text = get_ai_response(history, user["email"])
        ai_message = {
            "id": str(uuid.uuid4()), "text": ai_response_text, "sender": "ai",
            "timestamp": datetime.now().isoformat(), "userEmail": user["email"], "sessionId": session_id
        }
        connection.executemany(
            "INSERT INTO messages (id, session_id, text, sender, timestamp, user_email) VALUES (?, ?, ?, ?, ?, ?)",
            [(user_message["id"], session_id, user_message["text"], "user", user_message["timestamp"], user["email"]),
             (ai_message["id"], session_id, ai_message["text"], "ai", ai_message["timestamp"], user["email"])],
        )
        title = text[:50] + ("..." if len(text) > 50 else "")
        connection.execute(
            "UPDATE sessions SET last_activity = ?, title = ? WHERE id = ?",
            (ai_message["timestamp"], title, session_id),
        )
    return jsonify({"userMessage": user_message, "aiMessage": ai_message})

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    user = require_user()
    if not isinstance(user, sqlite3.Row):
        return user
    with get_db() as connection:
        result = connection.execute("DELETE FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"]))
        if result.rowcount == 0:
            return jsonify({"error": "Session not found"}), 404
    return jsonify({"message": "Session deleted successfully"})

if __name__ == '__main__':
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )