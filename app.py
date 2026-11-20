
from flask import Flask, request, jsonify, send_from_directory
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")

API_KEY = os.getenv("OPENAI_API_KEY")
API_URL = "https://api.openai.com/v1/chat/completions"
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():

    if not API_KEY:
        return jsonify({
            "error": "Falta configurar la clave de API en el servidor."
        }), 500

    data = request.get_json(silent=True) or {}

    question = data.get("question", "").strip()
    subject = data.get("subject", "General")
    history = data.get("history", [])

    if not question:
        return jsonify({
            "error": "La consulta no puede estar vacía."
        }), 400

    if len(question) > 2000:
        return jsonify({
            "error": "La consulta es demasiado larga."
        }), 400

    # Instrucciones para el asistente
    messages = [
        {
            "role": "system",
            "content": (
                "Sos Study AI, un asistente educativo. "
                "Tu objetivo es ayudar a estudiantes a aprender. "
                "Explicá los temas de forma sencilla, clara y ordenada. "
                "Utilizá ejemplos cuando sea necesario. "
                "La materia seleccionada es: " + str(subject) + ". "
                "Adaptá las respuestas a esa materia. "
                "Si te piden ejercicios, generá actividades "
                "y explicá sus soluciones."
            )
        }
    ]

    # Agregar historial de la conversación
    if isinstance(history, list):
        for item in history[-20:]:

            if not isinstance(item, dict):
                continue

            role = item.get("role")
            content = item.get("content", "")

            if role in ["user", "assistant"] and isinstance(content, str):
                messages.append({
                    "role": role,
                    "content": content[:4000]
                })

    # Agregar la pregunta actual
    messages.append({
        "role": "user",
        "content": question
    })

    try:

        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MODEL,
                "messages": messages,
                "temperature": 0.7
            },
            timeout=60
        )

        response.raise_for_status()

        result = response.json()

        answer = result["choices"][0]["message"]["content"]

        return jsonify({
            "answer": answer
        })

    except requests.exceptions.Timeout:

        return jsonify({
            "error": "El servidor tardó demasiado en responder."
        }), 504

    except requests.exceptions.RequestException:

        return jsonify({
            "error": "No se pudo conectar con el proveedor de inteligencia artificial."
        }), 502

    except (KeyError, IndexError, TypeError):

        return jsonify({
            "error": "La respuesta de inteligencia artificial no fue válida."
        }), 502


if __name__ == "__main__":
    app.run(debug=True)
