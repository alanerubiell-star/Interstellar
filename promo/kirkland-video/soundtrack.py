"""Synthesizes a punchy 120 BPM track synced to scene.html (cuts every 3s, price slams at +1.5s)."""
import wave, numpy as np
SR, DUR, BPM = 44100, 17.5, 120
beat = 60 / BPM
n = int(SR * DUR); t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(7)

def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR); sig = sig[: max(0, n - i)]
    L[i:i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * gain * (1 + min(0, pan))

def env(d, k): x = np.arange(int(d * SR)) / SR; return x, np.exp(-x * k)

def kick():
    x, e = env(.45, 9); f = 45 + 110 * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * e + 0.3 * rng.standard_normal(len(x)) * np.exp(-x * 300)

def clap():
    x, e = env(.22, 22); nz = rng.standard_normal(len(x)); nz = np.diff(nz, prepend=0)
    return nz * e * 0.5

def hat():
    x, e = env(.06, 90); nz = np.diff(rng.standard_normal(len(x)), prepend=0)
    return nz * e * 0.25

def bass(freq, d):
    x = np.arange(int(d * SR)) / SR
    saw = 2 * ((x * freq) % 1) - 1
    saw = np.convolve(saw, np.ones(18) / 18, mode='same')  # soften
    return (saw * 0.6 + np.sin(2 * np.pi * freq * x) * 0.6) * np.minimum(1, x * 200) * np.exp(-x * 4)

def impact():
    x, e = env(1.2, 3.5); f = 30 + 60 * np.exp(-x * 8)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * e
    nz = np.diff(rng.standard_normal(len(x)), prepend=0) * np.exp(-x * 14) * 0.35
    return boom + nz

def whoosh(d=.45):
    x = np.arange(int(d * SR)) / SR; nz = rng.standard_normal(len(x))
    nz = np.convolve(nz, np.ones(6) / 6, mode='same')
    return nz * (x / d) ** 2.2 * 0.5

# drums: intro starts with an impact, groove enters at 0.5s
end = DUR - 0.5
for i in range(int(end / beat) + 1):
    b = i * beat
    if b >= 0.5: add(kick(), b, gain=.9)
    if i % 2 == 1 and b >= 1: add(clap(), b, gain=.8)
for i in range(int(end / (beat / 2)) + 1):
    b = i * beat / 2
    if b >= 1 and i % 2 == 1: add(hat(), b, pan=(.35 if i % 4 == 1 else -.35))
# bassline, 8th-note pulses, 4 chords per 2-bar cycle
roots = [55.0, 43.65, 65.41, 49.0]  # A1 F1 C2 G1
for i in range(int(end / (beat / 2))):
    b = i * beat / 2
    if b < 0.5: continue
    add(bass(roots[int(b // 2) % 4], beat / 2), b, gain=.35)
# hits: logo slam, price slams, "90" slam, logo pop
for h in [0.0, 0.33, 3.5, 6.5, 9.5, 12.5, 14.3]: add(impact(), h, gain=.8)
for c in [2, 5, 8, 11, 14]: add(whoosh(), c - .42, gain=.7)
# final hit + fade tail
add(impact(), 15.5, gain=.9)
fade = np.ones(n); k = int(.6 * SR); fade[-k:] = np.linspace(1, 0, k)

mix = np.stack([L, R], 1) * fade[:, None]
mix = np.tanh(mix * 1.4)  # glue / loudness
mix /= np.abs(mix).max() / 0.95
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote soundtrack.wav')
