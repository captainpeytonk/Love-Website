import os
import torch
import soundfile as sf

# Adjust this import based on your local openvoice folder structure
# Make sure your sys.path includes the folder containing openvoice/api.py before importing
from api import BaseSpeakerTTS, ToneColorConverter


# === Paths to model files ===
BASE_SPEAKER_CONFIG = "checkpoints/base_speakers/EN/config.json"
BASE_SPEAKER_CKPT = "checkpoints/base_speakers/EN/checkpoint.pth"
TONE_COLOR_CONFIG = "checkpoints/converter/config.json"
TONE_COLOR_CKPT = "checkpoints/converter/checkpoint.pth"
SOURCE_SE_PATH = "checkpoints/base_speakers/EN/en_default_se.pth"


class VoiceGenerator:
    def __init__(self, device='cpu'):
        self.device = device
        # Load TTS model
        self.tts = BaseSpeakerTTS(BASE_SPEAKER_CONFIG, device=device)
        self.tts.load_ckpt(BASE_SPEAKER_CKPT)

        # Load tone color converter
        self.converter = ToneColorConverter(TONE_COLOR_CONFIG, device=device)
        self.converter.load_ckpt(TONE_COLOR_CKPT)

        # Load default source speaker embedding
        self.source_se = torch.load(SOURCE_SE_PATH).to(device)

    def load_custom_embedding(self, embedding_path):
        """
        Load a custom speaker embedding from a .pth file.
        """
        embedding = torch.load(embedding_path).to(self.device)
        return embedding

    def generate(self, text, output_path, speaker='default', language='English', speed=1.0, tgt_se=None):
        """
        Generate speech audio from text.

        :param text: Input text to synthesize.
        :param output_path: Where to save the generated audio.
        :param speaker: Speaker ID if applicable.
        :param language: Language of the input text.
        :param speed: Speech speed multiplier.
        :param tgt_se: Target speaker embedding tensor. If None, use default.
        :return: Path to saved audio file.
        """
        if tgt_se is None:
            tgt_se = self.source_se

        # Generate raw audio waveform (numpy array) from TTS model
        audio = self.tts.tts(text, None, speaker=speaker, language=language, speed=speed)

        # Save raw audio temporarily
        temp_path = "temp.wav"
        sf.write(temp_path, audio, self.tts.hps.data.sampling_rate)

        # Convert the voice with tone color converter using source and target embeddings
        self.converter.convert(temp_path, self.source_se, tgt_se, output_path)

        # Remove temp file
        os.remove(temp_path)

        return output_path


# If run as main, example usage
if __name__ == "__main__":
    vg = VoiceGenerator(device='cpu')

    # Example: load your own voice embedding if you have it
    # my_voice_embedding = vg.load_custom_embedding("generated/my_voice_long.pth")

    # Use your embedding here (uncomment the line below and comment the None)
    # out_path = vg.generate("Hello from my own voice!", "output_myvoice.wav", tgt_se=my_voice_embedding)

    # Or just use the default voice (source_se)
    out_path = vg.generate("Hello from OpenVoice!", "output.wav")

    print(f"Generated audio saved at: {out_path}")
