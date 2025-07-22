import os
import sys
import torch

# Add OpenVoice/openvoice to sys.path (same as your main file)
current_dir = os.path.dirname(os.path.abspath(__file__))
openvoice_dir = os.path.join(current_dir, 'OpenVoice', 'openvoice')
sys.path.append(openvoice_dir)

from api import ToneColorConverter

device = 'cpu'  # or 'cuda:0' if you want GPU

converter = ToneColorConverter(
    os.path.join(current_dir, "checkpoints", "converter", "config.json"),
    device=device
)
converter.load_ckpt(os.path.join(current_dir, "checkpoints", "converter", "checkpoint.pth"))

# Path to your recorded voice audio (change if needed)
your_voice_wav = os.path.join(current_dir, "generated", "my_voice_long.wav")

# Extract speaker embedding vector from your audio
se_vector = converter.extract_se([your_voice_wav])

# Save embedding for later use
save_path = os.path.join(current_dir, "generated", "my_voice_se.pth")
torch.save(se_vector.cpu(), save_path)
print(f"Saved your voice embedding at: {save_path}")
