# Kirkland Signature promo video

`kirkland-promo.mp4` — 17.5 s, 1080×1920 (9:16), 30 fps, with a synced beat. Built from the Costco "Kirkland Signature" promo email.

Scenes: brand slam → cat food $499 → coffee $319 → dog food $859 → Uber Eats "90 minutos o menos" → end card with "Ver Todo".

## Rebuild
```sh
pip install pillow numpy imageio-ffmpeg
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
python3 soundtrack.py                                   # -> soundtrack.wav
NODE_PATH=$(npm root -g) FFMPEG=$FF node render.mjs video-silent.mp4
$FF -y -i video-silent.mp4 -i soundtrack.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart kirkland-promo.mp4
```
Edit copy, prices and timing in `scene.html` (`PRODUCTS`, `CUTS`, `render(t)`); preview stills with `node render.mjs out --stills 1,4,12`.
`crop.py` cut the product shots in `assets/` from the original email screenshot.
