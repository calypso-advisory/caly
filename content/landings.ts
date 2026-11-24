/* Pages d'atterrissage de campagne. Ajouter une page = ajouter une entrée ici.
   Les textes suivent la direction artistique du site : phrases courtes, un écran = une question,
   aucun chiffre ni référence inventés. Espace fine insécable ( ) avant « ? » et « ! ». */

export type LandingCard = { k: string; h3: string; p: string };

export type Landing = {
  id: string;              /* segment d'adresse : /rj, /options… */
  campagne: string;        /* identifiant transmis au CRM et au suivi */
  canal: 'sms';
  situation: string;       /* option pré-cochée du formulaire (mêmes valeurs que /faire-le-point) */
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  sub: string;
  lead: string;
  scene: { eyebrow: string; l1: string; l2: string; lead: string };
  identify: { eyebrow: string; h2: string; cols: 2 | 3; cards: LandingCard[]; note?: string };
  first: { points: string[]; aside: string };
  origin: string;          /* première phrase de la notice « Pourquoi ce message » */
};

export const SITUATIONS: { value: string; label: string }[] = [
  { value: 'Anticiper', label: 'Je souhaite anticiper avant que la situation ne se dégrade' },
  { value: 'Trésorerie', label: 'Ma trésorerie devient difficile à gérer' },
  { value: 'Créanciers', label: 'Mes dettes ou certains créanciers deviennent préoccupants' },
  { value: 'Négociation', label: 'Une négociation est en cours avec mes banques ou créanciers' },
  { value: 'Procédure envisagée', label: 'Une procédure est envisagée' },
  { value: 'Sauvegarde ou redressement', label: 'Mon entreprise est déjà en sauvegarde ou redressement' },
  { value: 'Échéance', label: 'Une audience ou une échéance importante approche' },
  { value: 'Cession', label: "J'envisage une cession ou recherche un repreneur" },
  { value: 'Autre', label: 'Ma situation est différente' }
];

/* Blocs communs à toutes les pages (textes déjà validés sur le site principal). */
export const COMMON = {
  cta: 'Faire le point avec Calypso',
  micro: 'Confidentiel · Sans engagement · Réponse sous 24h ouvrées',
  first: {
    eyebrow: "Ce que Calypso fait d'abord",
    h2: "Comprendre avant d'orienter.",
    lead: "La plupart de nos interventions commencent par un Audit Juridique d'Orientation : un diagnostic global, une comparaison sans a priori des voies ouvertes et une orientation motivée."
  },
  finale: {
    h2: "Vous n'avez pas besoin de savoir exactement ce dont vous avez besoin.",
    sub: "Il faut d'abord comprendre où vous en êtes.",
    lead: 'Quelques lignes suffisent. Nous faisons avec vous une première lecture de la situation et identifions les sujets qui méritent d\'être examinés.'
  },
  steps: [
    "Un membre de l'équipe revient vers vous sous 24 heures ouvrées.",
    'Un échange de 30 à 45 minutes permet de comprendre la situation.',
    'Si nécessaire, nous vous proposons un audit ou une prochaine étape adaptée.'
  ],
  formLead: 'Un premier échange confidentiel permet de comprendre votre situation, les principales échéances et les difficultés auxquelles vous êtes confronté.',
  originRest: "Votre numéro provient des coordonnées publiées par votre société ou d'un fournisseur de données professionnelles. Vous pouvez demander l'origine de vos données, les faire supprimer ou refuser tout nouveau message : répondez STOP au SMS reçu, ou utilisez la page"
};

const RJ_POINTS = [
  "Votre trésorerie pendant la période d'observation.",
  'Les voies encore ouvertes et ce que chacune exige.',
  'Ce qui vous engage personnellement : cautions, comptes courants, responsabilité.'
];
const RJ_ASIDE = 'Calypso intervient aux côtés de votre avocat, de votre expert-comptable et des organes de la procédure.';
const RJ_ORIGIN = "L'ouverture de la procédure de votre société a été publiée au BODACC, qui est public.";

export const landings: Landing[] = [
  {
    id: 'rj', campagne: 'sms-rj-a', canal: 'sms', situation: 'Sauvegarde ou redressement',
    title: "Redressement judiciaire : faire le point avant l'audience",
    description: "Votre société est en redressement judiciaire. Un premier échange confidentiel pour faire le point avant l'audience des deux mois.",
    eyebrow: 'Redressement judiciaire',
    h1: "Avant l'audience, ne restez pas seul.",
    sub: 'Deux mois pour savoir où vous en êtes.',
    lead: "Dans les deux mois qui suivent le jugement, le tribunal réexamine le dossier et vérifie que l'entreprise peut financer la poursuite de son activité. C'est le moment de faire le point.",
    scene: { eyebrow: 'Notre premier travail', l1: 'Retrouver de la visibilité', l2: "avant l'audience.", lead: "Tant que la situation reste dans l'ombre, aucune décision n'est vraiment libre. Nous commençons par l'éclairer." },
    identify: {
      eyebrow: 'Où vous en êtes', h2: 'Trois temps. Vous êtes entre les deux premiers.', cols: 3,
      cards: [
        { k: '01', h3: "Le jugement d'ouverture", p: "Il a ouvert une période d'observation. L'activité continue, sous le regard du tribunal." },
        { k: '02', h3: "L'audience des deux mois", p: "Le tribunal vérifie que l'entreprise peut financer la poursuite de son activité." },
        { k: '03', h3: "L'issue", p: "Ensuite se prépare la suite : plan, cession ou arrêt de l'activité." }
      ]
    },
    first: { points: RJ_POINTS, aside: RJ_ASIDE },
    origin: RJ_ORIGIN
  },
  {
    id: 'options', campagne: 'sms-rj-b', canal: 'sms', situation: 'Sauvegarde ou redressement',
    title: 'Redressement judiciaire : vos options de dirigeant',
    description: "Plan, cession ou arrêt de l'activité : faites le point sur vos options et sur ce qui vous engage personnellement.",
    eyebrow: 'Redressement judiciaire',
    h1: 'Trois voies sont ouvertes. Laquelle est la vôtre ?',
    sub: "Plan, cession ou arrêt de l'activité.",
    lead: "Chaque voie a ses conditions, son calendrier et ses conséquences pour vous. Avant l'audience des deux mois, mieux vaut savoir laquelle vous préparez.",
    scene: { eyebrow: 'Notre premier travail', l1: 'Comparer les voies', l2: "avant d'en choisir une.", lead: "Nous ne partons pas d'une solution. Nous partons de votre situation." },
    identify: {
      eyebrow: 'Les options', h2: 'Il y a rarement une seule voie possible.', cols: 3,
      cards: [
        { k: '01', h3: 'Le plan de redressement', p: "L'entreprise continue et rembourse ses dettes sur plusieurs années. Il faut montrer qu'elle peut financer son activité et tenir ses échéances." },
        { k: '02', h3: 'La cession', p: "Un repreneur poursuit l'activité. Elle se prépare tôt : périmètre, salariés, calendrier des offres." },
        { k: '03', h3: "L'arrêt de l'activité", p: "Quand la poursuite n'est plus possible, la procédure est convertie en liquidation. Mieux vaut l'avoir anticipé que le subir." }
      ],
      note: "Cautions données aux banques, compte courant d'associé, responsabilité du dirigeant : selon la voie retenue, ce qui vous engage personnellement n'est pas le même."
    },
    first: { points: RJ_POINTS, aside: RJ_ASIDE },
    origin: RJ_ORIGIN
  },
  {
    id: 'audience', campagne: 'sms-rj-relance', canal: 'sms', situation: 'Échéance',
    title: "L'audience approche : faire le point",
    description: "L'audience des deux mois approche. Clarifiez votre position avec Calypso, réponse sous 24 heures ouvrées.",
    eyebrow: 'Redressement judiciaire',
    h1: "L'audience approche. Arrivez avec un cap.",
    sub: 'Il reste peu de temps pour clarifier votre position.',
    lead: "À l'audience des deux mois, le tribunal vérifie que votre entreprise peut financer la poursuite de son activité. Un échange suffit souvent à remettre les priorités dans l'ordre.",
    scene: { eyebrow: 'Notre premier travail', l1: "Arriver à l'audience", l2: 'avec une position claire.', lead: 'Une position claire se prépare. Nous commençons par remettre les éléments dans l\'ordre.' },
    identify: {
      eyebrow: "Avant l'audience", h2: 'Trois points à clarifier.', cols: 3,
      cards: [
        { k: '01', h3: 'La trésorerie', p: "Une prévision sur la période d'observation." },
        { k: '02', h3: 'Les dettes nouvelles', p: "L'état des dettes nées depuis le jugement." },
        { k: '03', h3: 'Votre position', p: 'Ce que vous visez pour la suite : plan, cession ou arrêt.' }
      ]
    },
    first: { points: RJ_POINTS, aside: RJ_ASIDE },
    origin: RJ_ORIGIN
  },
  {
    id: 'kbis', campagne: 'sms-kbis', canal: 'sms', situation: 'Anticiper',
    title: 'Capitaux propres inférieurs à la moitié du capital : lever la mention',
    description: 'Votre Kbis mentionne des capitaux propres inférieurs à la moitié du capital. Faites le point sur les voies pour régulariser.',
    eyebrow: 'Capitaux propres',
    h1: 'Une ligne sur votre Kbis. Plusieurs façons de la lever.',
    sub: 'Votre banque et vos fournisseurs peuvent la lire.',
    lead: "Quand les capitaux propres passent sous la moitié du capital, la décision de poursuivre l'activité est inscrite au registre. Cette mention figure sur votre Kbis.",
    scene: { eyebrow: 'La mention au registre', l1: 'Lever la mention,', l2: 'sans se tromper de voie.', lead: 'Sa formulation habituelle : « Continuation de la société malgré un actif net devenu inférieur à la moitié du capital social ».' },
    identify: {
      eyebrow: 'Les voies pour régulariser', h2: 'Quatre voies, selon vos comptes.', cols: 2,
      cards: [
        { k: '01', h3: 'Par les résultats', p: 'Reconstituer les capitaux propres avec les bénéfices à venir.' },
        { k: '02', h3: 'Par une augmentation de capital', p: "Par apport ou par incorporation de comptes courants d'associés." },
        { k: '03', h3: 'Par une réduction de capital', p: 'Ajuster le capital aux pertes constatées.' },
        { k: '04', h3: 'En combinant les deux', p: 'Réduire puis augmenter le capital dans la même opération.' }
      ],
      note: 'La loi laisse du temps pour régulariser, et ses règles ont été assouplies en 2023. Encore faut-il savoir où vous en êtes dans ce délai.'
    },
    first: {
      points: ["Vos comptes et l'origine des pertes.", 'La voie adaptée à vos associés et à votre calendrier.', 'Ce que la mention change avec votre banque et vos partenaires.'],
      aside: 'Calypso intervient aux côtés de votre expert-comptable et de vos conseils.'
    },
    origin: 'La mention relative aux capitaux propres de votre société est inscrite au registre du commerce, qui est public.'
  }
];

export function landingById(id: string) { return landings.find((l) => l.id === id) || null; }
