# Les Soins de Béa — site & prise de rendez-vous

Site de **Béatrice Ribes, praticienne bien-être à Perpignan** (réflexologie, massages, magnétisme, guidance),
refait à partir de l'ancienne version Lovable, avec en plus :

- **Réservation en ligne** sans compte client : choix du soin → jour → créneau → coordonnées.
- **Emails automatiques via Brevo** : accusé de réception, confirmation (avec fichier `.ics` pour l'agenda),
  refus, annulation, rappel la veille, notification à Béa à chaque demande.
- **Espace admin** (`/admin`, protégé par mot de passe) : calendrier des disponibilités et des rendez-vous,
  confirmation/refus en un clic, jours fermés, congés, créneaux bloqués, horaires habituels, réglages.
- **Annulation en ligne** par le client (lien dans l'email, jusqu'à 24 h avant).
- Formulaire de contact (envoyé par Brevo), pages légales, SEO (métadonnées, sitemap, données structurées),
  responsive, accessible, sans cookie de suivi.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner au minimum ADMIN_PASSWORD
npm run dev
```

- Site : http://localhost:3000 — Admin : http://localhost:3000/admin
- Sans `DATABASE_URL`, une base PostgreSQL embarquée (PGlite) est créée automatiquement dans `.data/`.
- Sans clé Brevo, les emails ne partent pas : ils sont simplement journalisés dans la console.

Autres commandes : `npm test` (tests du calcul des créneaux), `npm run lint`, `npm run typecheck`, `npm run build`.

## Mise en ligne (Vercel + PostgreSQL + Brevo)

1. **Vercel** : « Add New → Project », importer ce dépôt GitHub.
2. **Base de données** : dans le projet Vercel, onglet *Storage* → créer une base **Neon (Postgres)**, région
   Europe. La variable `DATABASE_URL` est ajoutée automatiquement. (Supabase ou tout autre PostgreSQL convient
   aussi : utiliser l'URL de connexion « pooled ».)
3. **Brevo** (https://app.brevo.com) :
   - *Expéditeurs, domaines & IP dédiées* → ajouter et vérifier l'adresse d'expédition (idéalement authentifier
     le domaine du site : DKIM/DMARC, pour éviter les spams) ;
   - *SMTP & API → Clés API* → créer une clé API ;
   - si les emails ne partent pas depuis Vercel, vérifier *Sécurité → IP autorisées* (les IP de Vercel
     changent : désactiver le blocage des IP inconnues).
4. **Variables d'environnement** (Vercel → *Settings → Environment Variables*), voir `.env.example` :

   | Variable | Rôle |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | URL publique, ex. `https://www.lessoinsdebea.fr` (liens dans les emails) |
   | `DATABASE_URL` | PostgreSQL (ajoutée par Neon/Vercel) |
   | `ADMIN_PASSWORD` | Mot de passe de l'espace admin |
   | `SESSION_SECRET` | Chaîne aléatoire ≥ 32 caractères (`openssl rand -base64 32`) |
   | `BREVO_API_KEY` | Clé API Brevo |
   | `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Expéditeur vérifié dans Brevo |
   | `ADMIN_EMAIL` | Adresse de Béa qui reçoit les demandes et les messages |
   | `CRON_SECRET` | Chaîne aléatoire : active les rappels envoyés la veille (cron `vercel.json`, 9 h) |

5. **Déployer**. Les migrations de la base sont appliquées automatiquement au build (`scripts/migrate.mjs`).
6. Brancher le nom de domaine (*Settings → Domains*), puis mettre à jour `NEXT_PUBLIC_SITE_URL`.

La page *Horaires & réglages* de l'admin affiche l'état de la configuration (emails, base, rappels).

## Guide de l'espace admin (pour Béa)

- **Agenda** : calendrier du mois. Chaque jour indique les horaires d'ouverture, les rendez-vous confirmés
  (vert) et les demandes en attente (doré). Cliquer sur un jour pour voir le détail.
- **Demandes en attente** (en haut) : *Confirmer* envoie la confirmation au client ; *Refuser* lui envoie un
  email (avec un message facultatif) et libère le créneau.
- **Modifier un jour** : horaires spécifiques pour une date, ou *Fermer ce jour*. *Revenir aux horaires
  habituels* annule l'exception.
- **Ajouter un rendez-vous ou bloquer un créneau** : pour un rendez-vous pris par téléphone, ou une
  indisponibilité ponctuelle (le créneau disparaît de la réservation en ligne).
- **Horaires & réglages** : horaires de chaque jour de la semaine (plusieurs plages possibles), fermeture
  d'une période (congés), intervalle entre créneaux, pause entre deux soins, délai minimum de réservation,
  horizon de réservation, confirmation automatique, suspension de la réservation, message d'information.

## Modifier le contenu

- `src/lib/content.ts` : soins, durées, tarifs (utilisés à la fois par le site et par la réservation),
  témoignages, FAQ, formations.
- `src/lib/site.ts` : téléphone, email, réseaux sociaux, adresse.
- `public/images/` : photos.

## À compléter avant la mise en ligne

Email public, SIRET, adresse professionnelle, code APE, assureur RC Pro, médiateur de la consommation,
fournisseur de base de données (pages *Mentions légales*, *Confidentialité*, *CGV* — repérés en surbrillance),
liens Instagram/Facebook. Les horaires par défaut (lun.–ven. 9h–12h30 / 14h–19h, sam. 9h–13h) sont à ajuster
dans l'admin.

## Technique

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (PGlite en local) · API Brevo ·
Zod · polices auto-hébergées (Fontsource). Les créneaux sont calculés en heure de Paris (changements d'heure
gérés) et revérifiés sous verrou au moment de la réservation pour éviter les doubles réservations.
