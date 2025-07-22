import os
import torch
from openvoice import BaseSpeakerTTS, ToneColorConverter, se_extractor  # Adjust if your module structure differs

def generate_voice(text, reference_audio_path, output_path):
    device = "cuda:0" if torch.cuda.is_available() else "cpu"

    ckpt_base = 'checkpoints/base_speakers/EN'       # Adjust paths if needed
    ckpt_converter = 'checkpoints/converter'

    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)

    # Load base speaker TTS model
    base_speaker_tts = BaseSpeakerTTS(f'{ckpt_base}/config.json', device=device)
    base_speaker_tts.load_ckpt(f'{ckpt_base}/checkpoint.pth')

    # Load tone color converter model
    tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
    tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

    # Load source speaker embedding
    source_se = torch.load(f'{ckpt_base}/en_default_se.pth').to(device)

    # Extract speaker embedding from reference audio (your voice sample)
    target_se, _ = se_extractor.get_se(reference_audio_path, tone_color_converter, target_dir='processed', vad=True)

    # Generate base speech audio (temp file)
    src_path = os.path.join(output_dir, 'tmp.wav')
    base_speaker_tts.tts(text, src_path, speaker='default', language='English', speed=1.0)

    # Convert base speech to match reference voice tone/color
    tone_color_converter.convert(
        audio_src_path=src_path,
        src_se=source_se,
        tgt_se=target_se,
        output_path=output_path,
        message="@MyShell"
    )

    return output_path
