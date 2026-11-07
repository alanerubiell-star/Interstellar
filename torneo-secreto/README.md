# Torneo Secreto · Leyendas Liga MX

Video homenaje (fan-made, 63 s, 1920×1080, 30 fps) con formato de torneo 3 vs 3 en una jaula dentro de un barco de carga: "el primer gol gana".

- `torneo_secreto.mp4`: video final.
- `make_video.py`: generador. Fondos, jaula, letreros, títulos, música y efectos se generan por código; las únicas entradas son las 9 fotos de tríos en `assets/` (fotos: Jerseys La Gambeta).

Regenerar:

```bash
python3 make_video.py            # video completo
python3 make_video.py --preview  # fotogramas de muestra en preview/
```

Requiere Python 3 con numpy y Pillow, además de ffmpeg con libx264.
