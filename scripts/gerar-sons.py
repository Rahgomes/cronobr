"""Gera o pacote de sons do CronôBR por síntese (originais, sem licença de terceiros).

Uso: python3 scripts/gerar-sons.py   (escreve assets/sounds/*.wav, mono 44,1 kHz 16 bits)
Os mesmos arquivos servem ao app e às notificações (iOS aceita .wav de até 30 s).
"""
import math
import struct
import wave
from pathlib import Path

RATE = 44_100
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'sounds'


def tone(seconds, partials, decay, attack=0.004, vibrato=None):
    """partials: lista de (freq, amplitude). decay: constante de tempo em s (None = plano)."""
    n = int(seconds * RATE)
    out = []
    phases = [0.0] * len(partials)
    for i in range(n):
        t = i / RATE
        env = min(1.0, t / attack) if attack else 1.0
        if decay:
            env *= math.exp(-t / decay)
        # Corte suave nos últimos 10 ms para não estalar.
        env *= min(1.0, (n - i) / (0.01 * RATE))
        mod = 1.0
        if vibrato:
            rate, depth = vibrato
            mod = 1.0 + depth * math.sin(2 * math.pi * rate * t)
        s = 0.0
        for k, (f, a) in enumerate(partials):
            phases[k] += 2 * math.pi * f * mod / RATE
            s += a * math.sin(phases[k])
        out.append(s * env)
    return out


def concat(*parts, gap=0.0):
    out = []
    for p in parts:
        out.extend(p)
        out.extend([0.0] * int(gap * RATE))
    return out


def write(name, samples, peak=0.7):
    top = max(abs(s) for s in samples) or 1.0
    frames = b''.join(struct.pack('<h', int(s / top * peak * 32767)) for s in samples)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(frames)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # Beeps: seno quase puro em dó agudo, com ataque e queda suaves (o quadrado de antes
    # incomodava). Mais baixos que os outros: tocam muitas vezes.
    beep = [(1046.5, 1.0), (2093, 0.05)]
    write('beepShort', tone(0.11, beep, 0.09, attack=0.008), peak=0.45)
    write('beepLong', tone(0.5, beep, 0.35, attack=0.01), peak=0.5)
    # Sino de ringue: parciais inarmônicas de metal, dois toques.
    ring = [(620, 1.0), (1485, 0.6), (2340, 0.4), (3210, 0.25), (4050, 0.12)]
    ding = tone(0.55, ring, 0.35, attack=0.002)
    write('bell', concat(ding, ding, tone(1.4, ring, 0.5, attack=0.002), gap=0.02))
    # Gongo: grave, inarmônico, cauda longa.
    write('gong', tone(3.0, [(110, 1.0), (167, 0.7), (231, 0.5), (298, 0.35), (412, 0.2)], 1.1, attack=0.02))
    # Apito: agudo com trêmulo rápido da bolinha.
    whistle = [(2900, 1.0), (5800, 0.12)]
    write('whistle', concat(tone(0.18, whistle, None, attack=0.01, vibrato=(32, 0.03)),
                            tone(0.6, whistle, None, attack=0.01, vibrato=(32, 0.03)), gap=0.06))
    # Conclusão: três notas subindo (dó, mi, sol) com brilho.
    note = lambda f, s: tone(s, [(f, 1.0), (2 * f, 0.3), (3 * f, 0.1)], 0.45, attack=0.005)
    write('finish', concat(note(523.25, 0.18), note(659.25, 0.18), note(783.99, 1.1), gap=0.02))


if __name__ == '__main__':
    main()
