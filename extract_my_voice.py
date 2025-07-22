import os
import sys
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
openvoice_dir = os.path.join(current_dir, 'openvoice')  # Adjust if needed

if openvoice_dir not in sys.path:
    sys.path.insert(0, openvoice_dir)  # Use insert to prioritize local openvoice

from api import ToneColorConverter

device = 'cpu'  # Or 'cuda:0' for GPU

converter = ToneColorConverter(
    os.path.join(current_dir, "checkpoints", "converter", "config.json"),
    device=device
)
converter.load_ckpt(os.path.join(current_dir, "checkpoints", "converter", "checkpoint.pth"))

your_voice_wav = os.path.join(current_dir, "generated", "my_voice_long.wav")

# Pass a list of file paths as per your converter's method definition
se_vector = converter.extract_se([your_voice_wav])

save_path = os.path.join(current_dir, "generated", "my_voice_se.pth")
torch.save(se_vector.cpu(), save_path)

print(f"Saved your voice embedding at: {save_path}")
