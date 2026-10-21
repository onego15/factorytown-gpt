from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
paths=sorted((root/'docs/frames').glob('*.png'))
timings=json.loads((root/'docs/frames/timing.json').read_text())
frames=[]
for path in paths:
    img=Image.open(path).convert('RGB')
    img.thumbnail((960,667),Image.Resampling.LANCZOS)
    frames.append(img.quantize(colors=160,method=Image.Quantize.MEDIANCUT))
durations=[max(80,min(1500,int(t/10)*10)) for t in timings[1:]]+[180]
frames[0].save(root/'docs/demo.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=False,disposal=2)
print(f'{len(frames)} actual browser frames, {sum(durations)/1000:.1f}s; GIF size {(root/"docs/demo.gif").stat().st_size/1024/1024:.2f} MiB')
