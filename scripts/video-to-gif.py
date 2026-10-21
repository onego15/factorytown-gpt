from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parent.parent
paths=sorted((root/'docs/video-frames').glob('*.png'))
assert paths,'Extract frames from docs/demo.webm first; see production log.'
# A shared palette preserves stable colors and lets GIF encode small changed regions.
sample=Image.new('RGB',(960,666*4))
for i,index in enumerate([0,len(paths)//3,2*len(paths)//3,len(paths)-1]):
    sample.paste(Image.open(paths[index]).convert('RGB'),(0,666*i))
palette=sample.quantize(colors=160,method=Image.Quantize.MEDIANCUT)
frames=[Image.open(p).convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE) for p in paths]
frames[0].save(root/'docs/demo.gif',save_all=True,append_images=frames[1:],duration=125,loop=0,optimize=True,disposal=1)
print(f'{len(frames)} real video frames; {len(frames)/8:.1f}s; {(root/"docs/demo.gif").stat().st_size/1024/1024:.2f} MiB')
