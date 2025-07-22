from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import subprocess

app = Flask(__name__)
CORS(app)  # 🚀 Enables cross-origin requests

GENERATED_DIR = "generated"
os.makedirs(GENERATED_DIR, exist_ok=True)

@app.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get("text")
    audio_id = str(uuid.uuid4())
    output_path = os.path.join(GENERATED_DIR, f"{audio_id}.wav")

    subprocess.run([
        "python", "OpenVoice/demo_part1.py",
        "--text", text,
        "--reference_audio", "OpenVoice/resources/reference_audio/your_voice.wav",
        "--output_path", output_path
    ])

    return jsonify({"url": f"http://localhost:5000/audio/{audio_id}.wav"})


@app.route('/audio/<filename>')
def audio(filename):
    return send_from_directory(GENERATED_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
