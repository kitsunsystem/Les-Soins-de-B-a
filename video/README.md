# Vidéo de présentation — Les Soins de Béa

Vidéo publicitaire (1920 × 1080, 30 i/s, 1 min 55) réalisée avec [Remotion](https://www.remotion.dev), dans le style du
site (vert eucalyptus, terracotta, lin et or, une couleur par univers, polices Fraunces et Nunito Sans, emblème lotus)
et montée sur la voix off ElevenLabs : chaque scène commence et s'arrête au rythme des phrases.

## Déroulé (calé sur la voix off)

| Voix off | À l'écran |
| --- | --- |
| « Stress, tensions… Et si vous preniez enfin un moment rien qu'à vous ? » | Accroche |
| « Bienvenue aux Soins de Béa, à Perpignan. » | Emblème lotus, nom, devise |
| « Béatrice vous reçoit pour des soins sur mesure… » | Haut de la page d'accueil (titre, preuves, photo en arche) |
| « Sensible aux énergies depuis l'adolescence… » | « Qui suis-je ? » |
| « Quatre univers de soins, une même attention. » | Les 4 cartes colorées |
| Corps, énergie, futures mamans, guidance | Les 4 univers de la page Soins, avec tous les tarifs ; chaque soin s'allume quand il est nommé |
| « Magnétiseuse, Béatrice enlève aussi le feu… à distance, sur simple photo. » | Coupe de feu et magnétisme à distance (avec la mention « ne remplacent pas un avis médical ») |
| « Ces séances ont lieu au cabinet, mais aussi à distance, par téléphone ou en visio… » | Guidance : au cabinet, par téléphone, en visio |
| « Béatrice transmet aussi son savoir… » | Formations |
| « Son cabinet est un espace pensé pour votre détente : une table de soin… » | Photos du cabinet, mises en avant une à une avec leur légende |
| « Celles qui l'ont rencontrée en parlent… » | Livre d'or : les messages de Léa, Val et Sarah s'avancent l'un après l'autre pendant leur lecture |
| « Réservez en ligne… Béatrice vous confirme… » | Les 3 étapes et la démonstration de réservation |
| « Envie de faire plaisir ? » | Cartes cadeaux |
| « Les Soins de Béa, à Perpignan. Réservez sur… » | Bandeau final (site puis téléphone mis en valeur quand ils sont prononcés), puis « Prenez soin de vous » |

## Commandes

```bash
cd video
npm install
npm run studio    # aperçu interactif dans le navigateur
npm run render    # fichier final : out/les-soins-de-bea.mp4
npm run site      # version web pour le site (public/videos) : vidéo compressée, vignette, sous-titres
```

Sur une machine sans Chrome, indiquer un Chromium « headless shell » : `npx remotion render Presentation
out/les-soins-de-bea.mp4 --browser-executable=/chemin/vers/chrome-headless-shell`.

## Sur le site

La page d'accueil affiche la vidéo (section « En vidéo »), avec une vignette légère : la vidéo ne se charge
qu'au clic. Fichiers dans `../public/videos/` :

- `les-soins-de-bea.mp4` — version web (H.264, démarrage rapide), **moins de 25 Mo** (limite de Cloudflare) ;
- `les-soins-de-bea-vignette.jpg` — vignette ;
- `les-soins-de-bea.fr.vtt` — sous-titres, générés depuis `voix-off.md` et les repères de `src/voix-off.json`
  (`npm run captions`).

Titre, durée et description affichés sur le site : `presentationVideo` dans `../src/lib/site.ts`.

## Modifier la vidéo

- **Soins, tarifs, « idéal pour », témoignages, téléphone, adresse du site** : repris automatiquement de
  `../src/lib/content.ts` et `../src/lib/site.ts`. Après une modification du site, relancer `npm run render`.
- **Domaine affiché à la fin** : `url` dans `../src/lib/site.ts`.
- **Voix off** : texte et réglages dans `voix-off.md`, fichier dans `public/voix-off.mp3`. Après une nouvelle
  génération, remplacer le fichier puis lancer le calage automatique, `npm run caler -- <dossier-du-modèle>` (Python
  avec `sherpa-onnx` et `numpy`, et un modèle de reconnaissance français à télécharger une fois : voir l'en-tête de
  `scripts/caler-voix.py`). Le script retrouve dans la voix chaque paragraphe et chaque mot repère de
  `voix-off-reperes.txt` (les `{repères}` placés devant les mots) et écrit `src/voix-off.json` : les scènes se recalent
  toutes seules. Si le texte change, reporter la modification dans `voix-off-reperes.txt`, puis relancer
  `npm run music` pour que la musique suive la nouvelle durée. Les rares mots que le calage place mal se corrigent
  dans `voix-off-corrections.json` (instant du début du mot, en secondes) : ces corrections ne valent que pour le
  fichier de voix dont l'empreinte y est notée, et sont ignorées après une nouvelle génération.
- **Textes propres à la vidéo** (accroche, extraits du livre d'or, démonstration de réservation) : `src/script.ts`.
- **Images** : lues directement dans `../public/images`.
- **Musique** : `public/musique.mp3`, une nappe d'ambiance générée par `scripts/generate-music.py` (libre de droits),
  baissée automatiquement sous la voix (niveaux dans `src/Presentation.tsx` ; le son est mixé par ffmpeg au rendu,
  vers −15,5 LUFS). Pour une autre musique, remplacer ce fichier (même nom) par un MP3 libre de droits. Pour la regénérer : `npm run music` (Python 3 avec numpy, et ffmpeg ; durée et repères lus dans
  `src/voix-off.json`).

## Licence Remotion

Remotion est gratuit pour les particuliers et les entreprises de 3 personnes au plus ; au-delà, une licence
entreprise est nécessaire (voir https://www.remotion.dev/license).
