"""Cale la vidéo sur la voix off : début et fin de chaque paragraphe, instant de chaque repère.

Usage (depuis video/) :
    python3 scripts/caler-voix.py <dossier-du-modèle> [public/voix-off.mp3] [voix-off-reperes.txt] [src/voix-off.json]

1. Reconnaissance de la voix avec un modèle français hors ligne (sherpa-onnx, zipformer en flux) : chaque mot
   reconnu avec son instant.
2. Alignement de ces mots sur le texte annoté (voix-off-reperes.txt, où « {nom}mot » marque un repère).
3. Recalage fin sur le signal : le modèle annonce les mots avec ~0,3 s de retard ; on retranche ce décalage puis
   on se cale sur la fin d'un silence (début réel de la parole) ou, à défaut, sur le creux d'énergie entre deux mots.

4. Corrections manuelles (voix-off-corrections.json, à côté du texte annoté) : quelques mots que le recalage place mal,
   par exemple sur le creux d'une consonne au milieu du mot. Elles ne s'appliquent qu'au fichier de voix dont
   l'empreinte SHA-256 est indiquée dans le fichier ; pour une nouvelle voix, elles sont ignorées (avec un message).

Écart mesuré sur la première voix off (repères relevés à la main) : 0,01 s en médiane, 0,05 s en moyenne.

Prérequis : ffmpeg, et `pip install sherpa-onnx numpy`. Modèle (≈ 400 Mo) :
https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-fr-2023-04-14.tar.bz2
"""

import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np
import sherpa_onnx

args = sys.argv[1:]
if not args:
    sys.exit(__doc__)
modele = args[0]
audio = args[1] if len(args) > 1 else "public/voix-off.mp3"
annote = args[2] if len(args) > 2 else "voix-off-reperes.txt"
sortie = args[3] if len(args) > 3 else "src/voix-off.json"

SR = 16000
DECALAGE = 0.30
x = np.frombuffer(
    subprocess.run(["ffmpeg", "-loglevel", "error", "-i", audio, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout,
    dtype="<f4",
)
duree = len(x) / SR

# 1. Reconnaissance : mots et instants.
nom = "epoch-29-avg-9-with-averaged-model"
rec = sherpa_onnx.OnlineRecognizer.from_transducer(
    tokens=f"{modele}/tokens.txt",
    encoder=f"{modele}/encoder-{nom}.onnx",
    decoder=f"{modele}/decoder-{nom}.onnx",
    joiner=f"{modele}/joiner-{nom}.onnx",
    num_threads=4,
    sample_rate=SR,
    feature_dim=80,
    decoding_method="greedy_search",
    enable_endpoint_detection=False,
)
flux = rec.create_stream()
for i in range(0, len(x), SR // 10):
    flux.accept_waveform(SR, x[i : i + SR // 10])
    while rec.is_ready(flux):
        rec.decode_stream(flux)
flux.accept_waveform(SR, np.zeros(int(SR * 0.8), dtype="float32"))
flux.input_finished()
while rec.is_ready(flux):
    rec.decode_stream(flux)
resultat_reco = rec.get_result_all(flux)
hyp = []
for tok, ts in zip(resultat_reco.tokens, resultat_reco.timestamps):
    if tok.startswith(("▁", " ")) or not hyp:
        hyp.append({"mot": tok.lstrip("▁ "), "debut": float(ts)})
    else:
        hyp[-1]["mot"] += tok
print("Reconnu :", " ".join(m["mot"] for m in hyp).lower(), "\n")


def norm(w):
    w = unicodedata.normalize("NFD", w.lower().replace("œ", "oe"))
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


hyp = [m for m in hyp if norm(m["mot"])]

# 2. Texte de référence : mots, avec les repères qui les précèdent.
paragraphes = []
noms_vus = set()
for ligne in open(annote, encoding="utf-8").read().strip().split("\n"):
    if not ligne.strip() or ligne.startswith("#"):
        continue
    pid, texte = ligne.split(" | ", 1)
    texte = re.sub(r"\[(?:sighs|exhales|inhales deeply|breathes|gasps|laughs|chuckles)\]", " ⟨souffle⟩ ", texte)
    texte = re.sub(r"\[[^\]]*\]", " ", texte)
    mots, attente, souffle = [], [], False
    for tok in re.findall(r"\{[^}]+\}|[^\s{]+", texte):
        if tok == "⟨souffle⟩":
            souffle = True
            continue
        if tok.startswith("{"):
            nom_repere = tok[1:-1]
            if nom_repere in noms_vus:
                sys.exit(f"Repère en double : {nom_repere}")
            noms_vus.add(nom_repere)
            attente.append(nom_repere)
            continue
        if norm(tok):
            mots.append({"n": norm(tok), "reperes": attente, "apres_souffle": souffle})
            attente, souffle = [], False
    paragraphes.append((pid, mots))
tous = [m for _, ms in paragraphes for m in ms]

# Alignement caractère par caractère (résiste aux mots mal reconnus ou mal découpés).
ref_chars, ref_mot = [], []
for i, m in enumerate(tous):
    ref_chars += list(m["n"])
    ref_mot += [i] * len(m["n"])
hyp_chars, hyp_t = [], []
for j, m in enumerate(hyp):
    n = norm(m["mot"])
    fin = hyp[j + 1]["debut"] if j + 1 < len(hyp) else m["debut"] + 0.4
    for k, c in enumerate(n):
        hyp_chars.append(c)
        hyp_t.append(m["debut"] + (fin - m["debut"]) * k / len(n) * 0.8)
sm = difflib.SequenceMatcher(None, "".join(ref_chars), "".join(hyp_chars), autojunk=False)
correspondance = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        correspondance[a + k] = b + k
premier = {}
for idx, i in enumerate(ref_mot):
    premier.setdefault(i, idx)
temps = [None] * len(tous)
for i in range(len(tous)):
    for k in range(len(tous[i]["n"])):
        if premier[i] + k in correspondance:
            temps[i] = hyp_t[correspondance[premier[i] + k]] - 0.06 * k
            break
connus = [i for i, v in enumerate(temps) if v is not None]
non_trouves = [tous[i]["n"] for i in range(len(tous)) if temps[i] is None]
for i in range(len(temps)):
    if temps[i] is None:
        avant = max([j for j in connus if j < i], default=None)
        apres = min([j for j in connus if j > i], default=None)
        if avant is not None and apres is not None:
            temps[i] = temps[avant] + (temps[apres] - temps[avant]) * (i - avant) / (apres - avant)
        else:
            temps[i] = temps[avant] if avant is not None else temps[apres]
temps = [t - DECALAGE for t in temps]
if non_trouves:
    print("Mots non retrouvés (instant interpolé) :", ", ".join(non_trouves), "\n")

# 3. Recalage sur le signal.
log = subprocess.run(
    ["ffmpeg", "-hide_banner", "-nostats", "-i", audio, "-af", "silencedetect=noise=-38dB:d=0.15", "-f", "null", "-"],
    capture_output=True,
    text=True,
).stderr
silences = list(zip([float(v) for v in re.findall(r"silence_start: ([\d.]+)", log)], [float(v) for v in re.findall(r"silence_end: ([\d.]+)", log)]))
FEN = SR // 100
env = np.sqrt(np.convolve(x.astype(np.float64) ** 2, np.ones(FEN * 3) / (FEN * 3), mode="same"))[::FEN]
env_db = 20 * np.log10(env + 1e-6)


def creux(t, avant=0.22, apres=0.08):
    """Creux d'énergie le plus marqué juste avant l'instant estimé (frontière entre deux mots enchaînés)."""
    a, b = int(max(0, t - avant) * 100), int(min(len(env_db) - 1, (t + apres) * 100))
    if b <= a + 2:
        return t
    seg = env_db[a:b]
    k = int(np.argmin(seg))
    return (a + k) / 100 if seg.max() - seg[k] >= 6 else t


def attaque(t, avant=0.1, apres=0.6):
    """Après un soupir, le modèle situe mal le mot : on prend la plus forte montée d'énergie (attaque du mot)."""
    a, b = int(max(0, t - avant) * 100), int(min(len(env_db) - 4, (t + apres) * 100))
    if b <= a:
        return t
    montees = env_db[a + 3 : b + 3] - env_db[a:b]
    return (a + int(np.argmax(montees)) + 1) / 100


def recale(t, precedent):
    """Fin d'un silence proche qui sépare bien ce mot du précédent ; sinon creux d'énergie proche."""
    proches = [e for s, e in silences if t - 0.45 <= e <= t + 0.15 and (precedent is None or s >= precedent + 0.05)]
    return min(proches, key=lambda e: abs(e - t)) if proches else creux(t)


def ecrire_json(r):
    """JSON lisible : un paragraphe ou un repère par ligne."""
    lignes = ["{", f'  "duree": {json.dumps(r["duree"])},']
    for cle in ("paragraphes", "reperes"):
        lignes.append(f'  "{cle}": {{')
        elements = [f"    {json.dumps(k, ensure_ascii=False)}: {json.dumps(v)}" for k, v in r[cle].items()]
        lignes.append(",\n".join(elements))
        lignes.append("  }" + ("," if cle == "paragraphes" else ""))
    lignes.append("}")
    return "\n".join(lignes) + "\n"


resultat = {"duree": round(duree, 3), "paragraphes": {}, "reperes": {}}
i = 0
for pid, mots in paragraphes:
    idx = list(range(i, i + len(mots)))
    i += len(mots)
    # Un paragraphe commence toujours après un silence.
    proches = [e for s, e in silences if temps[idx[0]] - 0.6 <= e <= temps[idx[0]] + 0.3]
    debut = min(proches, key=lambda e: abs(e - temps[idx[0]])) if proches else temps[idx[0]]
    resultat["paragraphes"][pid] = [round(debut, 2), None]
    for k in idx:
        instant = attaque(temps[k]) if tous[k]["apres_souffle"] else recale(temps[k], temps[k - 1] if k > 0 else None)
        for r in tous[k]["reperes"]:
            resultat["reperes"][r] = round(instant, 2)

# Fin d'un paragraphe : début du silence qui précède le paragraphe suivant.
ids = list(resultat["paragraphes"])
for a, b in zip(ids, ids[1:]):
    debut_suivant = resultat["paragraphes"][b][0]
    candidats = [(s, e) for s, e in silences if abs(e - debut_suivant) <= 0.3 and s > resultat["paragraphes"][a][0]]
    fin = min(candidats, key=lambda se: abs(se[1] - debut_suivant))[0] if candidats else debut_suivant - 0.3
    resultat["paragraphes"][a][1] = round(fin, 2)
final = [s for s, e in silences if s > resultat["paragraphes"][ids[-1]][0] and e >= duree - 0.05]
resultat["paragraphes"][ids[-1]][1] = round(final[0] if final else duree, 2)
premier_son = int(np.argmax(env_db > -40)) / 100
resultat["paragraphes"][ids[0]][0] = round(min(resultat["paragraphes"][ids[0]][0], premier_son), 2)

# 4. Corrections manuelles, propres à ce fichier de voix.
empreinte = hashlib.sha256(open(audio, "rb").read()).hexdigest()
chemin_corrections = os.path.join(os.path.dirname(annote), "voix-off-corrections.json")
if os.path.exists(chemin_corrections):
    with open(chemin_corrections, encoding="utf-8") as f:
        corrections = json.load(f)
    if corrections.get("voix") != empreinte:
        print(f"Corrections de {chemin_corrections} ignorées : elles concernent un autre fichier de voix.\n")
    else:
        for nom_repere, instant in corrections.get("reperes", {}).items():
            if nom_repere not in resultat["reperes"]:
                sys.exit(f"Correction pour un repère inconnu : {nom_repere}")
            print(f"Correction : {nom_repere} {resultat['reperes'][nom_repere]} → {instant}")
            resultat["reperes"][nom_repere] = instant
        print()
print(f"Empreinte de la voix (pour {chemin_corrections}) : {empreinte}\n")

with open(sortie, "w", encoding="utf-8") as f:
    f.write(ecrire_json(resultat))
for pid, (a, b) in resultat["paragraphes"].items():
    print(f"{pid:14s} {a:7.2f} → {b:7.2f}  ({b - a:4.1f} s)")
print(f"\n{len(resultat['reperes'])} repères, voix de {duree:.1f} s → {sortie}")
