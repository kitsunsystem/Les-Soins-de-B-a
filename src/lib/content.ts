// Contenu éditorial du site : soins, tarifs, témoignages, FAQ, formations.
// Modifier ce fichier suffit pour mettre à jour le site ET le système de réservation.

export type CategoryId = "corps" | "energetique" | "femmes-bebes" | "guidance";

export type Service = {
  id: string;
  category: CategoryId;
  name: string;
  /** Nom court utilisé dans la grille tarifaire. */
  shortName?: string;
  description: string;
  /** Durée affichée (ex. « ~1h15 », « 45 min à 1h »). */
  durationLabel: string;
  /** Durée réservée dans l'agenda, en minutes. null = sur demande uniquement. */
  durationMinutes: number | null;
  price: string;
  /** Lieux possibles : au cabinet et/ou à distance (visio, téléphone). Par défaut : cabinet uniquement. */
  modes?: ServiceMode[];
};

export type ServiceMode = "cabinet" | "distance";

export const modesOf = (s: Service): ServiceMode[] => s.modes ?? ["cabinet"];
export const canBeRemote = (s: Service) => modesOf(s).includes("distance");

export type Category = {
  id: CategoryId;
  name: string;
  emoji: string;
  icon: "leaf" | "sparkles" | "baby" | "eye";
  summary: string;
  intro: string;
  /** « Idéal pour… » : ce que l'on vient chercher dans cet univers. */
  idealFor: string;
};

export const categories: Category[] = [
  {
    id: "corps",
    name: "Corps & Détente",
    emoji: "🌿",
    icon: "leaf",
    summary: "Réflexologie, massages, soins sur mesure",
    intro:
      "Des soins manuels pour libérer les tensions, relancer la circulation et reconnecter votre corps à sa sérénité.",
    idealFor: "se détendre en profondeur, relâcher les tensions, retrouver de la légèreté",
  },
  {
    id: "energetique",
    name: "Énergétique",
    emoji: "✨",
    icon: "sparkles",
    summary: "Magnétisme, soins énergétiques, à distance",
    intro:
      "Le magnétisme est le fil conducteur de ma pratique. Je l'intègre dans chacun de mes soins, et il peut aussi être proposé de manière ciblée.",
    idealFor: "se recentrer, apaiser le mental, retrouver un équilibre intérieur",
  },
  {
    id: "femmes-bebes",
    name: "Femmes enceintes & Bébés",
    emoji: "🤰",
    icon: "baby",
    summary: "Massage prénatal, atelier maman-bébé",
    intro:
      "Un accompagnement tout en douceur pour les futures et jeunes mamans, et leurs tout-petits.",
    idealFor: "vivre sa grossesse en douceur, créer un lien tendre avec bébé",
  },
  {
    id: "guidance",
    name: "Guidance spirituelle",
    emoji: "🔮",
    icon: "eye",
    summary: "Oracle, tarot, médiumnité",
    intro:
      "Des séances de guidance pour celles et ceux qui cherchent des réponses, du sens, ou souhaitent retrouver le lien avec un être cher. Au cabinet, ou à distance par visio ou téléphone, où que vous soyez en France.",
    idealFor: "éclairer un questionnement, traverser un deuil, trouver du sens",
  },
];

export const services: Service[] = [
  // Corps & Détente
  {
    id: "reflexologie-plantaire",
    category: "corps",
    name: "Réflexologie plantaire",
    shortName: "Réflexologie plantaire",
    description: "Stimulation des zones réflexes du pied pour rééquilibrer l'ensemble du corps.",
    durationLabel: "45 min",
    durationMinutes: 45,
    price: "40 €",
  },
  {
    id: "reflexologie-facio-cranienne",
    category: "corps",
    name: "Réflexologie facio-crânienne",
    description: "Détente profonde du visage et du cuir chevelu, idéale contre le stress et les migraines.",
    durationLabel: "30 min",
    durationMinutes: 30,
    price: "30 €",
  },
  {
    id: "reflexologie-palmaire",
    category: "corps",
    name: "Réflexologie palmaire",
    description: "Travail énergétique par les mains, accessible et profondément relaxant.",
    durationLabel: "30 min",
    durationMinutes: 30,
    price: "30 €",
  },
  {
    id: "reflexologie-complete",
    category: "corps",
    name: "Réflexologie complète",
    description: "Séance approfondie associant plantaire et facio-crânien.",
    durationLabel: "~1h15",
    durationMinutes: 75,
    price: "60 €",
  },
  {
    id: "massage-relaxant",
    category: "corps",
    name: "Massage bien-être relaxant",
    description: "Un voyage de détente pour apaiser le corps et l'esprit.",
    durationLabel: "45 min",
    durationMinutes: 45,
    price: "50 €",
  },
  {
    id: "massage-cible",
    category: "corps",
    name: "Massage ciblé personnalisé",
    description: "Soin adapté à vos zones de tension spécifiques.",
    durationLabel: "1h",
    durationMinutes: 60,
    price: "55 €",
  },
  {
    id: "massage-crano-facial",
    category: "corps",
    name: "Massage crâno-facial & décolleté",
    description: "Visage, cou et décolleté pour un moment de détente profonde et de lâcher-prise.",
    durationLabel: "45 min",
    durationMinutes: 45,
    price: "60 €",
  },
  {
    id: "massage-tonique",
    category: "corps",
    name: "Massage tonique & récupération",
    description:
      "Un massage dynamisant pour une sensation de légèreté et de détente après l'effort ou les journées chargées.",
    durationLabel: "40 min",
    durationMinutes: 40,
    price: "45 €",
  },
  {
    id: "massage-californien",
    category: "corps",
    name: "Massage californien complet",
    description: "Dos, buste et ventre : un massage enveloppant et harmonisant.",
    durationLabel: "1h",
    durationMinutes: 60,
    price: "60 €",
  },
  {
    id: "massage-ayurvedique",
    category: "corps",
    name: "Massage ayurvédique",
    description: "Rééquilibrage du corps et de l'esprit selon la tradition indienne.",
    durationLabel: "45 min",
    durationMinutes: 45,
    price: "50 €",
  },
  {
    id: "massage-sur-mesure",
    category: "corps",
    name: "Massage sur mesure",
    description: "Construit ensemble selon vos besoins du moment.",
    durationLabel: "variable",
    durationMinutes: null,
    price: "sur devis",
  },
  // Énergétique
  {
    id: "massage-energetique",
    category: "energetique",
    name: "Massage énergétique",
    description: "Libération des blocages énergétiques par l'imposition des mains et le massage.",
    durationLabel: "45 min à 1h",
    durationMinutes: 60,
    price: "50 €",
  },
  {
    id: "soin-complet",
    category: "energetique",
    name: "Soin complet",
    description:
      "L'expérience la plus aboutie : massage viscéral, réflexologie, bien-être et énergétique.",
    durationLabel: "1h",
    durationMinutes: 60,
    price: "70 €",
  },
  {
    id: "magnetisme-distance",
    category: "energetique",
    name: "Magnétisme à distance (sur photo)",
    description:
      "Accompagnement énergétique à distance, à partir d'une photo récente. Une pratique traditionnelle pour celles et ceux qui recherchent un moment de recentrage sans se déplacer.",
    durationLabel: "variable",
    durationMinutes: null,
    price: "30 à 60 €",
    modes: ["distance"],
  },
  // Femmes enceintes & Bébés
  {
    id: "massage-prenatal",
    category: "femmes-bebes",
    name: "Massage prénatal",
    description: "Un moment de détente et de reconnexion, adapté à chaque trimestre.",
    durationLabel: "30 min",
    durationMinutes: 30,
    price: "30 €",
  },
  {
    id: "atelier-massage-bebe",
    category: "femmes-bebes",
    name: "Atelier massage bébé (maman + bébé)",
    description: "Je vous transmets les gestes pour masser votre bébé et renforcer le lien.",
    durationLabel: "30 min",
    durationMinutes: 30,
    price: "25 €",
  },
  // Guidance
  {
    id: "guidance-complete",
    category: "guidance",
    name: "Consultation de guidance (1 h)",
    description:
      "Une heure pour faire le point sur plusieurs thèmes et toutes vos questions (amour, travail, famille, choix de vie…) : tirage d'oracle et de tarot, enrichi des ressentis et messages reçus en médiumnité. Idéale à distance, depuis chez vous.",
    durationLabel: "1h",
    durationMinutes: 60,
    price: "60 €",
    modes: ["cabinet", "distance"],
  },
  {
    id: "oracle-tarot",
    category: "guidance",
    name: "Tirage Oracle / Tarot",
    description:
      "Un tirage personnalisé selon votre demande : amour, travail, famille, choix de vie, questionnement spirituel. Nous explorons ensemble les cartes et ce qu'elles vous racontent (environ 5 questions).",
    durationLabel: "30 min",
    durationMinutes: 30,
    price: "30 €",
    modes: ["cabinet", "distance"],
  },
  {
    id: "mediumnite",
    category: "guidance",
    name: "Médiumnité & prestations sur demande",
    description:
      "Une séance personnalisée selon votre demande : guidance, accompagnement autour d'un deuil, questionnement spirituel. Le cadre est défini ensemble avant la séance, dans l'écoute et la bienveillance.",
    durationLabel: "sur demande",
    durationMinutes: null,
    price: "sur devis",
    modes: ["cabinet", "distance"],
  },
];

/** Offre à distance, mise en avant sur le site. */
export const distanceOffer = {
  title: "Partout en France, à distance",
  intro:
    "Pas besoin d'habiter Perpignan : la guidance, les tirages et le magnétisme se pratiquent aussi à distance. Béatrice vous appelle ou vous retrouve en visio, à l'heure de votre rendez-vous, où que vous soyez.",
  points: [
    "Consultation de guidance d'une heure : plusieurs thèmes, toutes vos questions, tirage et médiumnité — 60 €",
    "Tirage oracle ou tarot de 30 minutes — 30 €",
    "Magnétisme à distance à partir d'une photo récente, sur demande",
    "Par visio ou par téléphone, au choix, réservation en ligne 24 h/24",
  ],
};

/** Objets proposés dans le formulaire de contact (clé utilisable dans l'URL : /contact?objet=cadeau). */
export const contactSubjects = {
  rdv: "Prise de rendez-vous",
  question: "Question sur un soin",
  cadeau: "Carte cadeau",
  formation: "Formation",
  autre: "Autre",
} as const;

/** Soins mis en avant sur l'accueil. */
export const popularServiceIds = ["reflexologie-plantaire", "massage-relaxant", "soin-complet", "massage-prenatal"];

export const bookableServices = services.filter((s) => s.durationMinutes !== null);

export function getService(id: string | null | undefined) {
  return services.find((s) => s.id === id);
}

export function servicesByCategory(id: CategoryId) {
  return services.filter((s) => s.category === id);
}

export const magnetismeExplication =
  "Le magnétisme est une pratique traditionnelle ancestrale qui consiste à transmettre de l'énergie par l'imposition des mains. Je le pratique depuis l'adolescence et l'intègre naturellement dans chacun de mes accompagnements. Il s'adresse aux personnes en recherche de détente, de mieux-être et d'équilibre énergétique.";

export const guidanceNote =
  "Les séances de guidance se déroulent dans un cadre d'écoute et de partage. Elles ne se substituent à aucun suivi médical ou psychologique, et ne constituent pas un engagement de résultat. Chaque personne est accueillie avec bienveillance, sans jugement, et toujours dans le respect de son rythme et de sa sensibilité.";

export const bientotDisponible = {
  title: "Bientôt disponible : la pressothérapie (bottes de récupération)",
  text: "Compression pneumatique bien-être : un nouveau service bientôt disponible au cabinet pour compléter vos soins toniques et de récupération. Un moment de détente apprécié après l'effort, pour une sensation de légèreté dans les jambes.",
};

export const disclaimer =
  "Les accompagnements et pratiques de bien-être proposés sur ce site ne relèvent pas de la médecine et ne se substituent en aucun cas à une consultation médicale, à un diagnostic ou à un traitement prescrit par un professionnel de santé. Ils ne peuvent être considérés comme des actes médicaux ni comme une promesse de résultat. En cas de problème de santé, consultez votre médecin traitant.";

export type Testimonial = { name: string; text: string; image: string };

export const testimonials: Testimonial[] = [
  {
    name: "Léa",
    text: "Un moment suspendu, d'évasion, de liberté. Des sensations, chaque fois plus uniques, singulières et intenses. Ton écoute, ô combien extraordinaire, tes mains… Pour tout ça, merci !",
    image: "/images/temoignages/livre-dor-1.webp",
  },
  {
    name: "Val",
    text: "Merci d'être là. Merci pour le bien-être que vous m'avez procuré, vous êtes une vraie fée. Merci tout simplement.",
    image: "/images/temoignages/livre-dor-2.webp",
  },
  {
    name: "Sarah",
    text: "Un grand merci pour ce moment de bien-être et d'échange. Tu es une pépite avec des mains et un cœur en or ❤️ À très bientôt et force à toi, je te souhaite toute la réussite que tu mérites.",
    image: "/images/temoignages/livre-dor-3.webp",
  },
  {
    name: "Isabelle",
    text: "La rencontre avec Béatrice a été une révélation. J'ai longtemps cherché une professionnelle comme elle… Pluridisciplinaire, douce et bienveillante. C'est le destin qui l'a mise sur ma route, c'est sûr ! Dès la 1ère séance, j'ai eu beaucoup de réponses et ce fut le départ d'un nouveau cycle. Laissez-vous guider. Vous aurez de belles surprises. Avec gratitude ❤️",
    image: "/images/temoignages/livre-dor-4.webp",
  },
  {
    name: "Céline",
    text: "Béa est à l'écoute et est très douce. Elle vise juste et cible tout de suite les points de tension et les problématiques. Elle lit en moi comme un livre ouvert. On sent qu'elle travaille avec le cœur et c'est très agréable. Vivement un autre soin avec elle. Merci, merci, merci.",
    image: "/images/temoignages/livre-dor-5.webp",
  },
  {
    name: "Laurence",
    text: "Merci ma chère Béa pour ce soin complet d'un bienfait incroyable ! Tes gestes sont à la fois doux et fermes, précis, profonds. J'ai été touchée dans mon corps, mon cœur et mon âme. Praticienne en Chi Nei Tsang, j'ai adoré et reviendrai. Quel bon moment nous avons partagé. Merci pour ton professionnalisme et ta générosité de cœur.",
    image: "/images/temoignages/livre-dor-6.webp",
  },
  {
    name: "Carole",
    text: "Expérience intrigante et incroyable. Béa est très douce, gentille et rassurante. J'ai adoré et je reviendrais. Merci Béa pour ta patience et le temps que tu as pris pour m'expliquer tes soins.",
    image: "/images/temoignages/livre-dor-7.webp",
  },
  {
    name: "Stéphanie & Pascale",
    text: "Merci pour cette bienveillance hors du commun, merci d'avoir pris le temps… Un joli moment agréable, belle rencontre. À bientôt ❤️ — Merci pour ce merveilleux moment avec une belle personne.",
    image: "/images/temoignages/livre-dor-8.webp",
  },
];

export const faq: { q: string; a: string }[] = [
  {
    q: "Comment prendre rendez-vous ?",
    a: "Directement en ligne depuis la page « Prendre rendez-vous » : choisissez votre soin, au cabinet ou à distance, un créneau disponible, et laissez vos coordonnées. Le créneau vous est réservé immédiatement et vous recevez un email récapitulatif, puis la confirmation. Vous pouvez aussi m'appeler au 07.62.94.79.39 ou passer par le formulaire de contact.",
  },
  {
    q: "Les consultations à distance, comment ça marche ?",
    a: "La guidance (consultation d'une heure, tirages, médiumnité) se pratique aussi à distance, partout en France : choisissez « À distance » lors de la réservation, puis la visio ou le téléphone. À l'heure du rendez-vous, je vous appelle ou je vous envoie le lien de la visio. Le magnétisme à distance, sur photo, se prépare sur demande. Les modalités de règlement vous sont précisées lors de la confirmation.",
  },
  {
    q: "Qu'est-ce que la fiche d'admission ?",
    a: "Avant votre première séance, je vous demande de remplir une courte fiche (coordonnées, ce qui vous amène, quelques questions de santé pour écarter toute contre-indication). Le lien vous est envoyé avec votre réservation : elle se remplit en ligne en quelques minutes et reste strictement confidentielle.",
  },
  {
    q: "Comment se déroule une première séance ?",
    a: "Nous échangeons d'abord quelques minutes sur vos besoins, votre état général et vos attentes. Puis nous commençons le soin dans une atmosphère calme et apaisante.",
  },
  {
    q: "Que dois-je prévoir pour venir ?",
    a: "Rien de particulier : venez comme vous êtes. Pour les massages, une tenue confortable facilite l'arrivée et le départ. Je mets tout le linge nécessaire à disposition.",
  },
  {
    q: "Les soins conviennent-ils à tout le monde ?",
    a: "La plupart des accompagnements sont adaptés à tous. Toutefois, certaines conditions particulières (grossesse, problèmes de santé spécifiques) peuvent nécessiter d'adapter ou de reporter la séance. N'hésitez pas à m'en parler lors de la prise de rendez-vous. En cas de doute, je vous invite à consulter votre médecin.",
  },
  {
    q: "Comment annuler ou déplacer un rendez-vous ?",
    a: "Chaque email de confirmation contient un lien d'annulation. Merci de prévenir au minimum 24 h à l'avance. Pour déplacer un rendez-vous, annulez-le puis choisissez un nouveau créneau, ou appelez-moi directement.",
  },
  {
    q: "Pourquoi un acompte peut-il m'être demandé ?",
    a: "Pour respecter le temps réservé, un acompte peut être demandé à la réservation après plusieurs annulations ou absences. Il est déduit du prix de la séance, et n'est pas remboursé en cas de nouvelle annulation de votre part.",
  },
  {
    q: "À partir de quel âge pour les bébés ?",
    a: "L'atelier massage bébé est accessible à partir d'un mois, toujours en présence d'un parent. C'est un moment de douceur et de complicité partagé.",
  },
  {
    q: "Comment se passe une séance de médiumnité ?",
    a: "Je me mets à l'écoute des âmes qui souhaitent se manifester. Je transmets ce que je reçois — images, sons, ressentis, messages — avec douceur et dans le plus grand respect.",
  },
  {
    q: "Qu'est-ce que le magnétisme à distance ?",
    a: "À partir d'une photo récente de vous, je peux vous proposer un accompagnement énergétique à distance. Une pratique traditionnelle qui s'adresse aux personnes en recherche d'un moment de recentrage et de détente.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Espèces et carte bancaire, en fin de séance.",
  },
  {
    q: "Les soins sont-ils remboursés ?",
    a: "Certaines mutuelles proposent une prise en charge partielle des pratiques de bien-être (réflexologie notamment). Renseignez-vous directement auprès de la vôtre.",
  },
  {
    q: "Proposez-vous des cartes cadeaux ?",
    a: "Oui, avec un montant libre à votre convenance. Contactez-moi pour les commander.",
  },
  {
    q: "Vos séances remplacent-elles un suivi médical ?",
    a: "Non, en aucun cas. Mes accompagnements relèvent du bien-être et ne constituent ni un diagnostic, ni un traitement médical. Ils ne se substituent pas à une consultation médicale, à un traitement prescrit par un professionnel de santé, ni à un suivi psychologique. En cas de problème de santé, consultez toujours votre médecin traitant.",
  },
];

/** Prestations proposées dans le journal des séances (mêmes choix que le classeur Excel). */
export const prestationsJournal = [
  "Réflexologie",
  "Kinésiologie",
  "Magnétisme",
  "Massage",
  "Pressothérapie",
  "Guidance",
  "Autre",
] as const;

/** Prestation du journal correspondant à un soin du site. */
export function prestationOf(serviceId: string): string {
  const s = getService(serviceId);
  if (!s) return "Autre";
  if (s.id.startsWith("reflexologie")) return "Réflexologie";
  if (s.category === "guidance") return "Guidance";
  if (s.category === "energetique") return "Magnétisme";
  return "Massage";
}

/**
 * Diplômes et certifications affichés sur la page « À propos ».
 * Ajouter les scans dans public/images/diplomes/ puis une ligne par diplôme ici.
 */
export const diplomas: { title: string; detail: string; image: string }[] = [];

export const parcours: { title: string; date: string }[] = [
  { title: "Formation en Kinésiologie", date: "novembre 2023" },
  { title: "Formation en Réflexologie", date: "novembre 2023" },
  { title: "Formation en Massage Bien-Être", date: "mai 2024" },
  { title: "Formation en Magnétisme", date: "janvier 2023 — Formateur Jean Angius" },
  { title: "Formation en Lithothérapie", date: "février 2023" },
  { title: "Formation Flamme Violette niveau II", date: "janvier 2022" },
];

export const formations: { title: string; text: string }[] = [
  {
    title: "Formation Magnétisme",
    text: "Apprendre à ressentir, canaliser et transmettre l'énergie.",
  },
  {
    title: "Formation Flamme Violette (niveau II)",
    text: "Utiliser et enseigner la Flamme Violette, purificatrice de l'énergie de Saint-Germain.",
  },
];
