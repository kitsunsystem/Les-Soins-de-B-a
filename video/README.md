# Vidéo de présentation — Les Soins de Béa

Vidéo publicitaire (1920 × 1080, 30 i/s, environ 1 min 07) réalisée avec [Remotion](https://www.remotion.dev),
dans le même style que le site : palette crème / rose / or / sauge, polices Cormorant Garamond, Montserrat et
Dancing Script, fond aquarelle à feuillages, ornement doré, cartes arrondies et apparitions en fondu.

## Déroulé

| Scène | Contenu |
| --- | --- |
| Ouverture | Accroche (« Et si vous preniez enfin un moment pour vous ? »), puis l'accueil du site : « Bienvenue — Les Soins de Béa » |
| Béatrice | « Une rencontre, un soin, un chemin » avec l'illustration aquarelle |
| Les 4 univers | Les cartes de l'accueil |
| Corps & Détente, Énergétique, Femmes enceintes & Bébés, Guidance | Tous les soins avec durées et tarifs |
| Formations | Magnétisme et Flamme Violette |
| Pourquoi me consulter | Les trois engagements de l'accueil |
| Mon cabinet | Les photos de la page À propos |
| Livre d'or | Trois extraits de témoignages |
| Réservation | Démonstration animée de la prise de rendez-vous en ligne |
| Cartes cadeaux | L'encadré de la page Tarifs |
| Fin | « Offrez-vous un moment de bien-être », site, téléphone, cabinet à Perpignan |

## Commandes

```bash
cd video
npm install
npm run studio    # aperçu interactif dans le navigateur (http://localhost:3000)
npm run render    # fichier final : out/les-soins-de-bea.mp4
```

## Modifier la vidéo

- **Soins, tarifs, témoignages, téléphone, adresse du site** : repris automatiquement de `../src/lib/content.ts`
  et `../src/lib/site.ts`. Après une modification du site, relancer `npm run render`.
- **Domaine affiché à la fin** : `url` dans `../src/lib/site.ts` (actuellement le domaine par défaut du site).
- **Textes propres à la vidéo** (accroche, extraits du livre d'or, démonstration de réservation) : `src/script.ts`.
- **Ordre et durée des scènes** : `src/Presentation.tsx` (30 images = 1 seconde).
- **Images** : lues directement dans `../public/images`.
- **Musique** : `public/musique.mp3`, une nappe d'ambiance générée par `scripts/generate-music.py` (libre de
  droits). Pour utiliser une autre musique, remplacer ce fichier (même nom) par un MP3 libre de droits.
  Pour la regénérer : `npm run music` (Python 3 avec numpy, et ffmpeg).

## Licence Remotion

Remotion est gratuit pour les particuliers et les entreprises de 3 personnes au plus ; au-delà, une licence
entreprise est nécessaire (voir https://www.remotion.dev/license).
