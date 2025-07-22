import os
import sys
import torch
import soundfile as sf

current_dir = os.path.dirname(os.path.abspath(__file__))
openvoice_dir = os.path.join(current_dir, 'my_openvoice')  # Adjust if your folder is named differently

if openvoice_dir not in sys.path:
    sys.path.insert(0, openvoice_dir)  # Insert at front to prioritize local openvoice

# Import from the local openvoice package explicitly
from openvoice.api import BaseSpeakerTTS, ToneColorConverter

# Paths to checkpoints (update paths as needed)
BASE_SPEAKER_CONFIG = os.path.join(current_dir, "checkpoints", "base_speakers", "EN", "config.json")
BASE_SPEAKER_CKPT = os.path.join(current_dir, "checkpoints", "base_speakers", "EN", "checkpoint.pth")
TONE_COLOR_CONFIG = os.path.join(current_dir, "checkpoints", "converter", "config.json")
TONE_COLOR_CKPT = os.path.join(current_dir, "checkpoints", "converter", "checkpoint.pth")
SOURCE_SE_PATH = os.path.join(current_dir, "checkpoints", "base_speakers", "EN", "en_default_se.pth")

class VoiceGenerator:
    def __init__(self, device='cpu'):
        self.device = device
        self.tts = BaseSpeakerTTS(BASE_SPEAKER_CONFIG, device=device)
        self.tts.load_ckpt(BASE_SPEAKER_CKPT)

        self.converter = ToneColorConverter(TONE_COLOR_CONFIG, device=device)
        self.converter.load_ckpt(TONE_COLOR_CKPT)

        self.source_se = torch.load(SOURCE_SE_PATH).to(device)

    def generate(self, text, output_path, speaker='default', language='English', speed=1.0, tgt_se=None):
        if tgt_se is None:
            tgt_se = self.source_se

        audio = self.tts.tts(text, None, speaker=speaker, language=language, speed=speed)

        temp_path = "temp.wav"
        sf.write(temp_path, audio, self.tts.hps.data.sampling_rate)

        self.converter.convert(temp_path, self.source_se, tgt_se, output_path)

        os.remove(temp_path)
        return output_path

if __name__ == "__main__":
    vg = VoiceGenerator(device='cpu')
    out = vg.generate("Hello from Open
