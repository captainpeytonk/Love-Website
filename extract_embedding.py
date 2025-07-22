import os
import torch
import soundfile as sf

# Adjust these imports and paths according to your project structure
from openvoice.api import SpeakerEncoder  # or whatever the correct import is

def extract_embedding(wav_path, save_path, device='cpu'):
    encoder = SpeakerEncoder(device=device)
    encoder.load_checkpoint('path_to_speaker_encoder_checkpoint.pth')

    audio, sr = sf.read(wav_path)
    embedding = encoder.encode(audio, sr)
    torch.save(embedding, save_path)
    print(f"Saved embedding to {save_path}")

if __name__ == "__main__":
    wav_path = os.path.join('generated', 'my_voice_long.wav')
    save_path = os.path.join('generated', 'my_voice_long.pth')
    extract_embedding(wav_path, save_path)
