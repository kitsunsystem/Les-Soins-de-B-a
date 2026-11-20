# Voix off — texte ElevenLabs

Version longue (environ 2 minutes), après les retours de la cliente : guidance plus détaillée et possible à
distance (téléphone, visio), « enlève le feu » et magnétisme à distance, cabinet décrit photo par photo, trois
avis lus (Léa, Val, Sarah) et « Prenez soin de vous » pour finir.

À générer en une seule fois avec la voix « Jade — Customer Service », stabilité 50 %, similarité 75 % (comme la
première version, « v4 » d'après le nom du fichier). Les balises entre crochets demandent un modèle qui les
comprend (Eleven v3 ou plus récent) : les modèles plus anciens les liraient à voix haute. Bien écouter le numéro de
téléphone (« soixante-dix-neuf » ne doit pas devenir « soixante-neuf »).

Après une nouvelle génération : remplacer `public/voix-off.mp3`, puis mettre à jour les repères de
`src/voix-off.ts` (début et fin de chaque paragraphe, mots-clés) ; la vidéo se recale toute seule.

```
[sighs] Stress, tensions, fatigue du quotidien… [short pause] [softly] Et si vous preniez enfin un moment rien qu'à vous ?

[peaceful] Bienvenue aux Soins de Béa, à Perpignan.

[calm] Béatrice vous reçoit pour des soins sur mesure, qui apaisent le corps et libèrent les tensions.

[thoughtful] Sensible aux énergies depuis l'adolescence, elle a fait du magnétisme le cœur de sa pratique.

[happy] Quatre univers de soins, [short pause] une même attention.

[softly] Pour le corps : réflexologie et massages, relaxant, californien ou ayurvédique, [slowly] pour vous détendre en profondeur.

[calm] Pour l'énergie : massage énergétique et soin complet. [short pause] [confident] Magnétiseuse, Béatrice enlève aussi le feu, [short pause] et pratique le magnétisme à distance, sur simple photo.

[content] Pour les futures et jeunes mamans : massage prénatal et atelier massage bébé.

[quietly] Et pour éclairer un questionnement, la guidance spirituelle : [short pause] [softly] tirage d'oracle ou de tarot, sur l'amour, le travail ou un choix de vie, [short pause] et médiumnité, notamment pour traverser un deuil. [short pause] [calm] Ces séances ont lieu au cabinet, [short pause] mais aussi à distance, par téléphone ou en visio, où que vous soyez.

[confident] Béatrice transmet aussi son savoir : formations au magnétisme et à la Flamme Violette.

[peaceful] Son cabinet est un espace pensé pour votre détente : [short pause] [softly] une table de soin douillette, [short pause] un coin pour échanger, [short pause] une lumière tout en douceur.

[cheerful] Celles qui l'ont rencontrée en parlent mieux que personne. [short pause] [softly] « Un moment suspendu, d'évasion, de liberté », écrit Léa. [short pause] « Vous êtes une vraie fée », ajoute Val. [short pause] « Une pépite avec des mains et un cœur en or », confie Sarah.

[optimistic] Réservez en ligne, vingt-quatre heures sur vingt-quatre, sans créer de compte. [short pause] [calm] Béatrice vous confirme votre rendez-vous par email.

[playful] Envie de faire plaisir ? [cheerfully] Offrez une carte cadeau, du montant de votre choix, valable un an.

[happy] Les Soins de Béa, à Perpignan. [short pause] [deliberate] Réservez sur les soins de béa point f r, [short pause] [slowly] ou au zéro sept, soixante-deux, quatre-vingt-quatorze, soixante-dix-neuf, trente-neuf. [long pause] [softly] Prenez soin de vous.
```
