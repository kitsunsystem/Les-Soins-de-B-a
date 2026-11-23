"""Retouche les certificats scannés de Béatrice pour qu'ils aient tous le même aspect, lumineux.

Pour chaque image du dossier d'entrée (JPEG, PNG, WebP ; pour un PDF de scan, extraire d'abord l'image avec
`pdfimages -j fichier.pdf nom`) :
1. éclairage aplani : un polynôme de degré 2 est ajusté sur le papier seul (pixels clairs et peu colorés), puis
   l'image est divisée par ce champ ; les dessins, sceaux et tampons colorés ne sont pas touchés ;
2. papier ramené au même blanc chaud pour tous les certificats, encre légèrement plus contrastée ;
3. bords de scan, tranche de la feuille et ombres (gris) retirés ; une bordure dessinée (comme la frise bleue du
   magnétisme) est recentrée en complétant la marge la plus étroite avec le papier de la marge opposée ;
4. redimensionnement et légère accentuation.

Usage (depuis video/) :
    python3 scripts/retoucher-diplomes.py <dossier-des-scans> ../public/images/diplomes [largeur=1400]
Dépendances : numpy, Pillow.
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
LARGEUR = int(sys.argv[3]) if len(sys.argv) > 3 else 1400
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

def cadre_dessine(img):
    """Marges (gauche, droite, haut, bas) d'une bordure dessinée en couleur sur presque toute la largeur et la
    hauteur de la feuille (comme la frise bleue du magnétisme), ou None s'il n'y en a pas."""
    hh_, ww_, _ = img.shape
    couleur = ((img.max(axis=2) - img.min(axis=2)) / (img.max(axis=2) + 1e-6) > 0.25) & (img.mean(axis=2) < 230)
    xs = np.nonzero(couleur.sum(axis=0) > 0.3 * hh_)[0]
    ys = np.nonzero(couleur.sum(axis=1) > 0.3 * ww_)[0]
    if len(xs) and len(ys) and xs[-1] - xs[0] > 0.95 * ww_ and ys[-1] - ys[0] > 0.95 * hh_:
        return xs[0], ww_ - 1 - xs[-1], ys[0], hh_ - 1 - ys[-1]
    return None


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
    # Bords du scan : bord franc (bord du scanner, tranche de la feuille, nettement plus sombre que le papier) cherché
    # dans les 2 % extérieurs, ombre légère seulement tout près du bord. Les profils sont pris sur trois bandes
    # (haut, milieu, bas) pour suivre un bord un peu de biais. Seuls les pixels gris comptent : une bordure colorée
    # dessinée sur la feuille, ou un lavis, n'est jamais rognée.
    Lb = b.mean(axis=2)
    gris = (b.max(axis=2) - b.min(axis=2)) / (b.max(axis=2) + 1e-6) < 0.15
    Lg = np.where(gris, Lb, np.nan)
    ref = np.nanmedian(Lg)
    def rogne(profils):
        n = 0
        for p in profils:
            franc = [i for i in range(int(0.02 * len(p)) + 4) if not np.isnan(p[i]) and p[i] < 0.88 * ref]
            ombre = [i for i in range(int(0.006 * len(p)) + 2) if not np.isnan(p[i]) and p[i] < 0.95 * ref]
            n = max(n, franc[-1] + 1 if franc else 0, ombre[-1] + 1 if ombre else 0)
        return n
    with np.errstate(all="ignore"):
        cols = [np.nanmedian(Lg[k * h // 3: (k + 1) * h // 3], axis=0) for k in range(3)]
        rows = [np.nanmedian(Lg[:, k * w // 3: (k + 1) * w // 3], axis=1) for k in range(3)]
    g, d = rogne(cols), rogne([c[::-1] for c in cols])
    hh, bb = rogne(rows), rogne([r[::-1] for r in rows])
    extra = 3  # trois pixels de plus pour un bord net
    rognes = [g + extra, d + extra, hh + extra, bb + extra]
    # Une bordure dessinée n'est jamais entamée : on s'arrête un pixel avant elle.
    cadre = cadre_dessine(b)
    if cadre:
        rognes = [min(r, max(0, m - 1)) for r, m in zip(rognes, cadre)]
    rg, rd, rh, rb = rognes
    b = b[rh: h - rb, rg: w - rd]
    # Puis on la recentre en complétant la marge la plus étroite par le papier de la marge opposée, retourné.
    cadre = cadre_dessine(b)
    if cadre:
        mg, md, mh, mb = cadre
        if md < mg:
            b = np.concatenate([b, b[:, : mg - md][:, ::-1]], axis=1)
        elif mg < md:
            b = np.concatenate([b[:, w2 - (md - mg):][:, ::-1], b], axis=1)
        if mb < mh:
            b = np.concatenate([b, b[: mh - mb][::-1]], axis=0)
        elif mh < mb:
            b = np.concatenate([b[b.shape[0] - (mb - mh):][::-1], b], axis=0)
        print(f"   bordure recentrée : marges g {mg} d {md} h {mh} b {mb}")
    out = Image.fromarray(b.round().astype(np.uint8))
    hauteur = round(out.height * LARGEUR / out.width)
    out = out.resize((LARGEUR, hauteur), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    out.save(os.path.join(dst, f"{nom}.jpg"), quality=86, optimize=True, progressive=True)
    print(f"{nom:20s} papier {np.round(np.median(a[papier], axis=0)).astype(int)} → rognage g{g} d{d} h{hh} b{bb} → {out.size}")
