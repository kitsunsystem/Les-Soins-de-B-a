"""Retouche les certificats scannés de Béatrice pour qu'ils aient tous le même aspect, lumineux.

Pour chaque image du dossier d'entrée (JPEG, PNG, WebP ; pour un PDF de scan, extraire d'abord l'image avec
`pdfimages -j fichier.pdf nom`) :
1. éclairage aplani : un polynôme de degré 2 est ajusté sur le papier seul (pixels clairs et peu colorés), puis
   l'image est divisée par ce champ ; les dessins, sceaux et tampons colorés ne sont pas touchés ;
2. papier ramené au même blanc chaud pour tous les certificats, encre légèrement plus contrastée ;
3. bords de scan plus sombres retirés, redimensionnement et légère accentuation.

Usage (depuis video/) :
    python3 scripts/retoucher-diplomes.py <dossier-des-scans> ../public/images/diplomes [largeur=1400]
Dépendances : numpy, Pillow.
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
LARGEUR = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
PAPIER = np.array([251.0, 249.0, 244.0])  # blanc chaud commun (proche des cartes de la vidéo et du site)
os.makedirs(dst, exist_ok=True)

def surface(x, y, v, w, h, deg=2):
    """Ajuste un polynôme 2D de degré `deg` (moindres carrés robustes) et l'évalue sur toute l'image."""
    xn, yn = x / w - 0.5, y / h - 0.5
    termes = lambda a, b: np.stack([a**i * b**j for i in range(deg + 1) for j in range(deg + 1 - i)], axis=1)
    A = termes(xn, yn)
    poids = np.ones_like(v)
    for _ in range(3):  # quelques itérations pour écarter les pixels qui ne sont pas du papier
        c, *_ = np.linalg.lstsq(A * poids[:, None], v * poids, rcond=None)
        r = v - A @ c
        s = 1.4826 * np.median(np.abs(r)) + 1e-6
        poids = (np.abs(r) < 2.5 * s).astype(float)
    gx, gy = np.meshgrid(np.arange(w), np.arange(h))
    return (termes(gx.ravel() / w - 0.5, gy.ravel() / h - 0.5) @ c).reshape(h, w)

for f in sorted(glob.glob(os.path.join(src, "*"))):
    nom = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert("RGB")
    # Travail à une taille raisonnable (le résultat final fait LARGEUR px de large).
    echelle = min(1.0, 2000 / im.width)
    if echelle < 1:
        im = im.resize((round(im.width * echelle), round(im.height * echelle)), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64)
    h, w, _ = a.shape
    L = a.mean(axis=2)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / (mx + 1e-6)
    # Papier : clair, peu saturé, loin des bords (les bords du scan sont souvent ombrés).
    marge = int(0.03 * min(w, h))
    interieur = np.zeros_like(L, bool)
    interieur[marge:-marge, marge:-marge] = True
    clair = L > np.percentile(L[interieur], 45)
    papier = interieur & clair & (sat < 0.10)
    ys, xs = np.nonzero(papier)
    pas = max(1, len(xs) // 60000)
    ys, xs = ys[::pas], xs[::pas]
    champ = np.stack([surface(xs.astype(float), ys.astype(float), a[ys, xs, k], w, h) for k in range(3)], axis=2)
    champ = np.clip(champ, 60, 255)
    b = a / champ * PAPIER  # éclairage aplani et papier ramené au blanc commun
    # Contraste de l'encre : légère courbe qui fonce les tons moyens, le blanc du papier ne bouge pas.
    n = np.clip(b / PAPIER, 0, 1.05)
    n = np.where(n < 1, n ** 1.18, n)
    b = np.clip(n * PAPIER, 0, 255)
    # Bords de scan : on retire les lignes/colonnes extérieures plus sombres que le papier.
    Lb = b.mean(axis=2)
    def rogne(profil):
        ref = np.median(profil)
        i = 0
        while i < len(profil) // 10 and profil[i] < 0.9 * ref:
            i += 1
        return i
    col = Lb[h // 4: 3 * h // 4].mean(axis=0)
    row = Lb[:, w // 4: 3 * w // 4].mean(axis=1)
    g, d = rogne(col), rogne(col[::-1])
    hh, bb = rogne(row), rogne(row[::-1])
    extra = max(2, int(0.004 * min(w, h)))  # quelques pixels de plus pour un bord net
    b = b[hh + extra: h - bb - extra, g + extra: w - d - extra]
    out = Image.fromarray(b.round().astype(np.uint8))
    hauteur = round(out.height * LARGEUR / out.width)
    out = out.resize((LARGEUR, hauteur), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    out.save(os.path.join(dst, f"{nom}.jpg"), quality=86, optimize=True, progressive=True)
    print(f"{nom:20s} papier {np.round(np.median(a[papier], axis=0)).astype(int)} → rognage g{g} d{d} h{hh} b{bb} → {out.size}")
