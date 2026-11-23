#!/usr/bin/env python3
"""
Musique d'ambiance de la vidéo, générée par calcul (libre de droits).

Nappe douce en fa majeur (Fa maj9 → Ré m9 → Si♭ maj9 → Do add9), basse feutrée, petites notes
de carillon, bol chantant sur l'apparition du nom et sur le plan final, réverbération par convolution.

Les repères (durée, apparition du nom, plan final) sont lus dans src/voix-off.json et src/montage.json (début de la
voix, tenue finale, silences insérés), comme la vidéo. Un carillon discret accompagne les certificats de Béatrice,
montrés pendant le silence inséré.

Usage : python3 scripts/generate-music.py public/musique.mp3
Dépendances : numpy, et ffmpeg pour l'encodage MP3.
"""
import json
import math
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 44100
FPS = 30  # images par seconde de la vidéo (src/theme.ts)
# Repères de la vidéo (secondes), alignés sur la voix off comme dans src/voix-off.ts.
_src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src")
_voix = json.load(open(os.path.join(_src, "voix-off.json"), encoding="utf-8"))
_montage = json.load(open(os.path.join(_src, "montage.json"), encoding="utf-8"))
_ordre = list(_voix["paragraphes"])
# Silences insérés dans la voix : (instant dans la voix, durée), calés sur des images comme dans la vidéo.
_silences = []
for _id, _duree in _montage["silences"].items():
    _suivant = _ordre[_ordre.index(_id) + 1]
    _point = math.floor((_voix["paragraphes"][_id][1] + _voix["paragraphes"][_suivant][0]) / 2 * FPS + 0.5) / FPS
    _silences.append((_point, math.floor(_duree * FPS + 0.5) / FPS))


def video(s):
    """Seconde de la vidéo correspondant à une seconde de la voix (t() dans src/voix-off.ts)."""
    return _montage["debutVoix"] + s + sum(d for p, d in _silences if s >= p)


DUREE = video(_voix["duree"]) + _montage["tenueFinale"]  # durée de la vidéo
MARQUE = video(_voix["paragraphes"]["marque"][0])  # « Bienvenue aux Soins de Béa »
FINAL = video(_voix["paragraphes"]["final"][0])  # plan final : « Les Soins de Béa, à Perpignan »
PAUSES = [(video(p) - d, video(p)) for p, d in _silences]  # images sans voix (certificats de Béatrice) : début, fin
rng = np.random.default_rng(7)

N = int(SR * (DUREE + 0.1))
t = np.arange(N) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lisse(x):
    """Rampe 0 → 1 en cosinus surélevé (aucun clic)."""
    x = np.clip(x, 0.0, 1.0)
    return 0.5 - 0.5 * np.cos(np.pi * x)


def enveloppe(debut, fin, attaque, relache):
    montee = lisse((t - (debut - 0.3)) / attaque)
    descente = 1.0 - lisse((t - (fin - 0.2)) / relache)
    return montee * descente


# Accords : notes de la nappe (MIDI) et basse.
ACCORDS = {
    "F": ([53, 57, 60, 64, 67], 41),
    "Dm": ([53, 57, 60, 62, 64], 38),
    "Bb": ([50, 53, 57, 60, 62], 34),
    "C": ([55, 60, 62, 64, 67], 36),
    "F_fin": ([53, 57, 60, 64, 67, 72], 41),
}
cycle = ["F", "Dm", "Bb", "C"]

# Déroulé : Fa dès l'introduction, un accord toutes les 4,5 s environ entre la marque et le plan final, le dernier
# sur Si♭ (cadence plagale), puis Fa pour finir.
n_accords = max(3, round((FINAL - MARQUE) / 4.5))
n_accords += (3 - n_accords % 4) % 4
d = (FINAL - MARQUE) / n_accords
plan = [("F", 0.0, MARQUE + d)]
for k in range(1, n_accords):
    plan.append((cycle[k % 4], MARQUE + k * d, MARQUE + (k + 1) * d))
plan.append(("F_fin", FINAL, DUREE + 2))

gauche = np.zeros(N)
droite = np.zeros(N)
sec_g = np.zeros(N)  # envoi vers la réverbération
sec_d = np.zeros(N)

# --- Nappe ---------------------------------------------------------------------------------
partiels = [(1, 1.0), (2, 0.5), (3, 0.26), (4, 0.15), (5, 0.08), (6, 0.04)]
for nom, debut, fin in plan:
    notes, basse = ACCORDS[nom]
    env = enveloppe(debut, fin, 1.6, 1.8)
    actif = env > 1e-5
    ta = t[actif]
    for j, m in enumerate(notes):
        f = hz(m)
        pan = 0.5 + 0.28 * ((j % 2) * 2 - 1) * (0.4 + 0.15 * j)
        voix = np.zeros(ta.size)
        for cents in (-7.0, 0.0, 6.0):
            fd = f * 2 ** (cents / 1200)
            phase = rng.uniform(0, 2 * np.pi)
            for ordre, amp in partiels:
                voix += amp * np.sin(2 * np.pi * fd * ordre * ta + phase * ordre)
        tremolo = 1.0 + 0.12 * np.sin(2 * np.pi * (0.11 + 0.03 * j) * ta + j)
        voix *= tremolo * env[actif] * 0.022
        gauche[actif] += voix * math.cos(pan * math.pi / 2)
        droite[actif] += voix * math.sin(pan * math.pi / 2)
    # Scintillement : les notes hautes de l'accord une octave au-dessus, surtout dans la réverbération.
    for j, m in enumerate(notes[-3:]):
        f = hz(m + 12)
        brille = np.sin(2 * np.pi * f * ta + j) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * ta + 2 * j))
        brille *= env[actif] * 0.012
        sec_g[actif] += brille * (1.2 if j % 2 else 0.6)
        sec_d[actif] += brille * (0.6 if j % 2 else 1.2)
    # Basse feutrée
    fb = hz(basse)
    b = (np.sin(2 * np.pi * fb * ta) + 0.35 * np.sin(2 * np.pi * 2 * fb * ta)) * env[actif] * 0.032
    gauche[actif] += b
    droite[actif] += b

sec_g += gauche * 0.55
sec_d += droite * 0.55

# --- Carillon (arpèges discrets, à partir de l'apparition de la marque) -------------------------
def cloche(f0, debut, amp, pan):
    duree = 3.2
    i0 = int(debut * SR)
    n = min(int(duree * SR), N - i0)
    if n <= 0:
        return
    tt = np.arange(n) / SR
    attaque = lisse(tt / 0.006)
    s = np.zeros(n)
    for ratio, a, tau in ((1.0, 1.0, 1.1), (2.0, 0.28, 0.55), (3.01, 0.08, 0.3), (4.12, 0.035, 0.18)):
        s += a * np.sin(2 * np.pi * f0 * ratio * tt) * np.exp(-tt / tau)
    s *= attaque * amp
    gauche[i0 : i0 + n] += s * math.cos(pan * math.pi / 2) * 0.6
    droite[i0 : i0 + n] += s * math.sin(pan * math.pi / 2) * 0.6
    sec_g[i0 : i0 + n] += s * math.cos(pan * math.pi / 2) * 0.9
    sec_d[i0 : i0 + n] += s * math.sin(pan * math.pi / 2) * 0.9


motifs = [[0, 2, 4, 3], [0, 4, 2, None], [4, 2, 0, 2], [0, 3, None, 4]]
for k, (nom, debut, fin) in enumerate(plan[:-1]):
    notes, _ = ACCORDS[nom]
    aigus = [n + (24 if i % 2 else 12) for i, n in enumerate(notes)]
    motif = motifs[k % len(motifs)]
    debut = max(debut, MARQUE + 0.6)  # le carillon commence juste après l'apparition de la marque
    pas = (fin - debut) / 4
    for i, idx in enumerate(motif):
        if idx is None:
            continue
        # Moins de notes au début, un peu plus ensuite.
        if k < 2 and i % 2 == 1:
            continue
        quand = debut + i * pas + rng.uniform(0, 0.03)
        amp, pan = 0.075 + 0.015 * rng.random(), 0.25 + 0.5 * rng.random()
        # Pendant une pause, seul le carillon des certificats sonne (les tirages restent faits : le reste ne bouge pas).
        if any(a - 0.2 <= quand <= b for a, b in PAUSES):
            continue
        cloche(hz(aigus[idx]), quand, amp, pan)

# Accord final égrené
for i, m in enumerate([65, 69, 72, 76, 79]):
    cloche(hz(m + 12), FINAL + 0.35 + i * 0.32, 0.07, 0.25 + 0.12 * i)

# Certificats de Béatrice (silence de la voix) : trois notes montantes pendant que les feuilles se posent.
for debut_pause, _ in PAUSES:
    for i, m in enumerate([72, 76, 79]):
        cloche(hz(m + 12), debut_pause + 0.45 + i * 0.3, 0.06, 0.35 + 0.15 * i)

# --- Bol chantant ---------------------------------------------------------------------------
def bol(f0, debut, amp):
    i0 = int(debut * SR)
    n = N - i0
    if n <= 0:
        return
    tt = np.arange(n) / SR
    attaque = lisse(tt / 0.004)
    s = np.zeros(n)
    for ratio, a, tau, batt in ((1.0, 1.0, 7.0, 0.7), (2.72, 0.42, 4.2, 1.3), (5.13, 0.16, 2.2, 2.1), (8.2, 0.05, 1.1, 2.9)):
        f = f0 * ratio
        s += a * 0.5 * (np.sin(2 * np.pi * (f - batt / 2) * tt) + np.sin(2 * np.pi * (f + batt / 2) * tt)) * np.exp(-tt / tau)
    s *= attaque * amp
    gauche[i0:] += s * 0.55
    droite[i0:] += s * 0.55
    sec_g[i0:] += s * 0.7
    sec_d[i0:] += s * 0.7


bol(hz(53), MARQUE - 0.05, 0.11)
bol(hz(53), FINAL, 0.09)

# --- Réverbération (convolution par une réponse impulsionnelle synthétique) --------------------
def reponse(seed):
    r = np.random.default_rng(seed)
    n = int(SR * 3.4)
    tt = np.arange(n) / SR
    bruit = r.standard_normal(n)
    # Adoucit les aigus de la réverbération (passe-bas simple par moyenne glissante).
    noyau = np.ones(9) / 9
    bruit = np.convolve(bruit, noyau, mode="same")
    ir = bruit * np.exp(-tt * (6.9 / 3.0))  # RT60 ≈ 3 s
    ir[: int(0.022 * SR)] = 0.0  # pré-délai
    return ir / np.sqrt(np.sum(ir**2))


def convolue(x, ir):
    taille = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, taille) * np.fft.rfft(ir, taille), taille)
    return y[: len(x)]


rev_g = convolue(sec_g, reponse(11))
rev_d = convolue(sec_d, reponse(23))
gauche = gauche + 0.42 * rev_g
droite = droite + 0.42 * rev_d

# --- Finitions : fondus, normalisation ------------------------------------------------------
# Fondu de fin court : c'est la vidéo (volumeMusique dans Presentation.tsx) qui fait remonter la musique après la
# dernière phrase puis l'éteint ; un long fondu ici annulerait cette remontée.
fondu = lisse(t / 1.5) * (1.0 - lisse((t - (DUREE - 1.2)) / 1.2))
gauche *= fondu
droite *= fondu
stereo = np.stack([gauche, droite], axis=1)
stereo -= stereo.mean(axis=0)
stereo *= 10 ** (-1.5 / 20) / np.max(np.abs(stereo))


def sonie(x):
    """Sonie intégrée (LUFS) mesurée par ffmpeg (filtre ebur128)."""
    with tempfile.TemporaryDirectory() as tmp:
        f = os.path.join(tmp, "m.wav")
        with wave.open(f, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
        log = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-af", "ebur128", "-f", "null", "-"],
            capture_output=True,
            text=True,
        ).stderr
    return float(log.rsplit("I:", 1)[1].split("LUFS")[0])


CIBLE = -15.0  # musique seule (pas de voix off)
gain = 10 ** ((CIBLE - sonie(stereo)) / 20)
stereo *= min(gain, 10 ** (-1.0 / 20) / np.max(np.abs(stereo)))

sortie = sys.argv[1] if len(sys.argv) > 1 else "public/musique.mp3"
with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, "musique.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    if sortie.endswith(".wav"):
        os.replace(wav, sortie)
    else:
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "192k", sortie],
            check=True,
        )

crete = 20 * np.log10(np.max(np.abs(stereo)))
print(f"{sortie} : {DUREE:.1f} s, crête {crete:.1f} dBFS, sonie {sonie(stereo):.1f} LUFS")
