import sys
import os
import torch
import soundfile as sf

# Add the openvoice folder to sys.path so Python can find it
sys.path.append(os.path.join(os.path.dirname(__file__), 'OpenVoice', 'openvoice'))

from api import BaseSpeakerTTS, ToneColorConverter

# Adjust these paths to your setup!
BASE_SPEAKER_CONFIG = "checkpoints/base_speakers/EN/config.json"
BASE_SPEAKER_CKPT = "checkpoints/base_speakers/EN/checkpoint.pth"
TONE_COLOR_CONFIG = "checkpoints/converter/config.json"
TONE_COLOR_CKPT = "checkpoints/converter/checkpoint.pth"
SOURCE_SE_PATH = "checkpoints/base_speakers/EN/en_default_se.pth"

class VoiceGenerator:
    def __init__(self, device='cpu'):
        self.device = device
        self.tts = BaseSpeakerTTS(BASE_SPEAKER_CONFIG, device=device)
        self.tts.load_ckpt(BASE_SPEAKER_CKPT)

        self.converter = ToneColorConverter(TONE_COLOR_CONFIG, device=device)
        self.converter.load_ckpt(TONE_COLOR_CKPT)

        # Load source speaker embedding
        self.source_se = torch.load(SOURCE_SE_PATH).to(device)

    def generate(self, text, output_path, speaker='default', language='English', speed=1.0, tgt_se=None):
        if tgt_se is None:
            tgt_se = self.source_se
        
        # Generate raw audio (numpy array) with TTS model
        audio = self.tts.tts(text, None, speaker=speaker, language=language, speed=speed)

        # Save temporary raw audio
        tmp_path = "temp.wav"
        sf.write(tmp_path, audio, self.tts.hps.data.sampling_rate)

        # Run tone color conversion
        self.converter.convert(tmp_path, self.source_se, tgt_se, output_path)

        # Clean temp file
        os.remove(tmp_path)

        return output_path


if __name__ == "__main__":
    vg = VoiceGenerator(device='cpu')  # or 'cuda:0' if you have GPU
    out_file = vg.generate("Hello from OpenVoice!", "output.wav")
    print(f"Generated audio saved to: {out_file}")
