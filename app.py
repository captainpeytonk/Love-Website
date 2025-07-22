from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid

from generate_voice import VoiceGenerator

app = Flask(__name__)
CORS(app)

GENERATED_DIR = "generated"
os.makedirs(GENERATED_DIR, exist_ok=True)

# Initialize voice generator once
voice_gen = VoiceGenerator(device='cpu')  # Change to 'cuda:0' if GPU available

@app.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Missing 'text' in request"}), 400

    audio_id = str(uuid.uuid4())
    output_path = os.path.join(GENERATED_DIR, f"{audio_id}.wav")

    # Generate voice audio
    voice_gen.generate(text, output_path)

    return jsonify({"url": f"http://localhost:5000/audio/{audio_id}.wav"})

@app.route('/audio/<filename>')
def audio(filename):
    return send_from_directory(GENERATED_DIR, filename)

if __name__ == "__main__":
    vg = VoiceGenerator(device='cpu')
    
    # Path to your voice embedding file (.pth)
    my_voice_emb_path = os.path.join(os.path.dirname(__file__), 'generated', 'my_voice_long.pth')
    
    # Load your embedding tensor
    my_voice_embedding = torch.load(my_voice_emb_path).to('cpu')
    
    # Pass your voice embedding as tgt_se
    out = vg.generate("Hello from OpenVoice with my voice!", "output_myvoice.wav", tgt_se=my_voice_embedding)
    
    print(f"Generated: {out}")
