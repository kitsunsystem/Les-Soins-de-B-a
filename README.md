# Les Soins de Béa — site & prise de rendez-vous

Site de **Béatrice Ribes, praticienne bien-être à Perpignan** (réflexologie, massages, magnétisme, guidance),
refait à partir de l'ancienne version Lovable, avec en plus :

- **Réservation en ligne** sans compte client : choix du soin → jour → créneau → coordonnées.
- **Emails automatiques via Brevo** : accusé de réception, confirmation (avec fichier `.ics` pour l'agenda),
  refus, annulation, rappel la veille, notification à Béa à chaque demande.
- **Espace admin** (`/admin`, protégé par mot de passe) : calendrier des disponibilités et des rendez-vous,
  confirmation/refus en un clic, jours fermés, congés, créneaux bloqués, horaires habituels, réglages.
- **CRM clients** (dans l'admin uniquement) : une fiche par personne, créée et complétée automatiquement à
  chaque réservation, rendez-vous ajouté ou message de contact (retrouvée par email ou téléphone) ;
  historique complet (rendez-vous passés et à venir, annulations, absences, messages), notes privées,
  date de naissance, statistiques, recherche, export Excel/CSV, suppression RGPD.
- **Annulation en ligne** par le client (lien dans l'email, jusqu'à 24 h avant).
- Formulaire de contact (envoyé par Brevo), pages légales, SEO (métadonnées, sitemap, données structurées),
  responsive, accessible, sans cookie de suivi.

Hébergement : **Cloudflare Workers** (via [OpenNext](https://opennext.js.org/cloudflare)) + base **Cloudflare D1**.
Tout tient dans l'offre gratuite de Cloudflare pour un site de cette taille.

## Mise en ligne sur Cloudflare

### 1. Créer le Worker depuis GitHub

Tableau de bord Cloudflare → **Workers & Pages** → **Créer** → **Importer un dépôt** → choisir
`Les-Soins-de-B-a` et la branche à déployer, puis :

| Réglage | Valeur |
| --- | --- |
| Nom du projet | `les-soins-de-bea` (doit correspondre à `name` dans `wrangler.jsonc`) |
| Commande de build | `npx opennextjs-cloudflare build` |
| Commande de déploiement | `npx opennextjs-cloudflare deploy` |

Commande de déploiement des autres branches (prévisualisation) : `npx opennextjs-cloudflare upload`.

**Base de données** : au premier déploiement, la base **D1 `les-soins-de-bea` est créée automatiquement**, et
le site crée lui-même ses tables au premier accès (migrations embarquées) : aucune commande à lancer.

> Recommandé (RGPD) : créer la base **avant** le premier déploiement pour choisir son emplacement —
> *Stockage et bases de données → D1 → Créer*, nom exactement `les-soins-de-bea`, emplacement Europe de
> l'Ouest (ou juridiction UE). Le déploiement s'y connecte automatiquement grâce à son nom, sans identifiant
> à recopier.

### 2. Variables et secrets

Worker `les-soins-de-bea` → **Paramètres → Variables et secrets** :

| Nom | Type | Valeur |
| --- | --- | --- |
| `SITE_URL` | Texte | URL publique, ex. `https://www.lessoinsdebea.fr` (liens dans les emails) |
| `ADMIN_EMAIL` | Texte | Adresse de Béa qui reçoit les demandes et les messages |
| `BREVO_SENDER_EMAIL` | Texte | Adresse d'expédition vérifiée dans Brevo |
| `BREVO_SENDER_NAME` | Texte | `Les Soins de Béa` |
| `ADMIN_PASSWORD` | Secret | Mot de passe de l'espace admin |
| `SESSION_SECRET` | Secret | Chaîne aléatoire ≥ 32 caractères (`openssl rand -base64 32`) |
| `BREVO_API_KEY` | Secret | Clé API Brevo |
| `CRON_SECRET` | Secret | Chaîne aléatoire : active les rappels envoyés la veille |

Les variables saisies ici sont conservées lors des déploiements (`keep_vars` dans `wrangler.jsonc`).

### 3. Brevo

Sur https://app.brevo.com :

- *Expéditeurs, domaines & IP dédiées* → ajouter et vérifier l'adresse d'expédition (idéalement authentifier
  le domaine du site : DKIM/DMARC, pour éviter les spams) ;
- *SMTP & API → Clés API* → créer une clé API ;
- si les emails ne partent pas, vérifier *Sécurité → IP autorisées* : les IP de Cloudflare changent, il faut
  désactiver le blocage des IP inconnues.

### 4. Nom de domaine

Worker → **Paramètres → Domaines et routes → Ajouter → Domaine personnalisé** (le domaine doit être géré par
Cloudflare), puis mettre à jour `SITE_URL` et la valeur par défaut `url` dans `src/lib/site.ts`.

La page *Horaires & réglages* de l'admin affiche l'état de la configuration (emails, adresse du site, rappels).

### Déployer depuis un ordinateur (alternative)

```bash
npx wrangler login
npm run deploy
npx wrangler secret put ADMIN_PASSWORD   # idem pour SESSION_SECRET, BREVO_API_KEY, CRON_SECRET
```

## Développement local

```bash
npm install
cp .dev.vars.example .dev.vars     # utilisé par `npm run preview`
cp .dev.vars.example .env.local    # utilisé par `npm run dev`
npm run dev                         # http://localhost:3000 — admin : /admin
```

- La base D1 locale est créée automatiquement dans `.wrangler/` (aucun compte Cloudflare nécessaire).
- Sans clé Brevo, les emails ne partent pas : ils sont journalisés dans la console.
- `npm run preview` : build Cloudflare + exécution dans le vrai moteur Workers (http://localhost:8787).

Autres commandes : `npm test` (calcul des créneaux), `npm run lint`, `npm run typecheck`.
Après une modification de `src/lib/db/schema.ts` : `npm run db:generate` (crée la migration SQL et l'embarque).

## Guide de l'espace admin (pour Béa)

- **Agenda** : calendrier du mois. Chaque jour indique les horaires d'ouverture, les rendez-vous confirmés
  (vert) et les demandes en attente (doré). Cliquer sur un jour pour voir le détail.
- **Demandes en attente** (en haut) : *Confirmer* envoie la confirmation au client ; *Refuser* lui envoie un
  email (avec un message facultatif) et libère le créneau.
- **Modifier un jour** : horaires spécifiques pour une date, ou *Fermer ce jour*. *Revenir aux horaires
  habituels* annule l'exception.
- **Ajouter un rendez-vous ou bloquer un créneau** : pour un rendez-vous pris par téléphone, ou une
  indisponibilité ponctuelle (le créneau disparaît de la réservation en ligne).
- **Clients** : liste de toutes les personnes avec leurs séances, dernière visite et prochain rendez-vous ;
  recherche par nom, email ou téléphone ; export Excel. Chaque fiche montre l'historique complet, les soins
  préférés, le montant estimé, et permet d'écrire des **notes privées** (préférences, grossesse,
  précautions…), d'ajouter un rendez-vous, de marquer une **absence** ou de supprimer la fiche (RGPD).
- **Horaires & réglages** : horaires de chaque jour de la semaine (plusieurs plages possibles), fermeture
  d'une période (congés), intervalle entre créneaux, pause entre deux soins, délai minimum de réservation,
  horizon de réservation, confirmation automatique, suspension de la réservation, message d'information.

## Modifier le contenu

- `src/lib/content.ts` : soins, durées, tarifs (utilisés à la fois par le site et par la réservation),
  témoignages, FAQ, formations.
- `src/lib/site.ts` : téléphone, email, réseaux sociaux, domaine.
- `public/images/` : photos (format WebP).

## Vidéo de présentation

La vidéo est intégrée à la page d'accueil (section « En vidéo », sous-titrée, chargée au clic) depuis
`public/videos/`, avec un lecteur aux couleurs du site (`src/components/PresentationVideo.tsx`) : barre de
commandes flottante, progression terracotta, volume, sous-titres dans la typographie du site, plein écran,
raccourcis clavier (Espace/K, ←/→, M, C, F) et écran de fin « Prendre rendez-vous ». Après une modification : `cd video && npm run render && npm run site`.

Le dossier `video/` contient une vidéo publicitaire d'1 min 21 avec voix off (Remotion, 1920 × 1080), dans le
style du site. Elle reprend automatiquement les soins, tarifs, témoignages et coordonnées de `src/lib/`. Projet
indépendant du site (ses dépendances ne sont pas installées ni déployées avec lui) : voir `video/README.md`.

```bash
cd video && npm install && npm run render   # → video/out/les-soins-de-bea.mp4
```

## À compléter avant la mise en ligne

Email public, SIRET, adresse professionnelle, code APE, assureur RC Pro, médiateur de la consommation
(pages *Mentions légales*, *Confidentialité*, *CGV* — repérés en surbrillance), liens Instagram/Facebook,
domaine définitif. Les horaires par défaut (lun.–ven. 9h–12h30 / 14h–19h, sam. 9h–13h) sont à ajuster dans
l'admin.

## Identité visuelle

- Palette : vert eucalyptus (calme, nature), terracotta (chaleur, toucher), lin et or ; une couleur par
  univers de soins (sauge, ambre, poudre, lavande) — définie dans `src/app/globals.css` (`@theme`).
- Typographies auto-hébergées : **Fraunces** « soft » (titres, serif organique et chaleureux) et
  **Nunito Sans** (texte, douce et très lisible).
- Emblème : lotus surmonté d'un point de lumière (`src/components/brand.tsx`).

## Technique

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · OpenNext pour Cloudflare Workers · Cloudflare D1
(SQLite) avec Drizzle ORM · API Brevo · Zod · polices auto-hébergées (Fontsource).

- Les créneaux sont calculés en heure de Paris (changements d'heure gérés).
- Anti double réservation : le créneau est inséré par une requête SQL unique et atomique qui échoue si un
  autre rendez-vous chevauche (testé avec 10 réservations simultanées : 1 acceptée, 9 refusées).
- Les pages publiques sont pré-générées et servies depuis les assets statiques du Worker.
- CRM : tables `clients` et `contact_messages`, rattachement automatique (email en minuscules, téléphone
  normalisé au format national).
- Vidéos (`public/videos`) : servies par `worker.ts` en réponses partielles (« Range », 206), indispensables
  pour la lecture sur Safari/iPhone et l'avance rapide — les fichiers statiques de Cloudflare ne les gèrent pas.
  Leur taille est relevée à chaque build dans `video-sizes.json` (`scripts/video-sizes.mjs`). Un fichier vidéo
  doit rester sous 25 Mo (limite des fichiers statiques de Cloudflare).
- `worker.ts` ajoute au Worker d'OpenNext une tâche planifiée quotidienne (rappels, `triggers.crons`).
