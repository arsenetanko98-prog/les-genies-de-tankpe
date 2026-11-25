// Informations de l'école : tout se modifie ici.
export const ECOLE = {
  nom: 'Complexe Scolaire Les Génies de Tankpè',
  court: 'Les Génies de Tankpè',
  devise: ['Apprendre', 'Réussir', 'Réussir ensemble'],
  adresse: 'Parana-Tankpè, Abomey-Calavi, Bénin',
  telephones: ['+229 01 66 26 00 06', '+229 01 97 07 15 22'],
  annee: '2026-2027',
  directeur: 'Le Directeur',
  motDirecteur:
    "Chers parents, chers élèves, au Complexe Scolaire Les Génies de Tankpè nous croyons que chaque enfant porte un talent. Notre mission est de le révéler, dans la discipline, le travail et la réussite. Avec une équipe d'enseignants engagés, nous accompagnons chaque élève, de la maternelle à la terminale, pour bâtir un avenir solide. Nous vous accueillons avec plaisir.",
  valeurs: [
    { t: 'Discipline', d: "Le respect des règles et des autres, pour apprendre dans un cadre serein." },
    { t: 'Travail', d: "Un suivi régulier, des devoirs et des compositions pour progresser pas à pas." },
    { t: 'Réussite', d: "Des élèves accompagnés jusqu'aux examens et fiers de leurs résultats." },
  ],
  cycles: [
    { t: 'Maternelle', n: "L'éveil des tout-petits", d: "Jeux, langage, premiers gestes d'apprentissage dans un cadre rassurant.", img: '/img/classe2.jpg' },
    { t: 'Primaire', n: 'Du CI au CM2', d: "Lecture, calcul, découverte du monde : les bases solides pour la suite.", img: '/img/bus1.jpg' },
    { t: 'Secondaire', n: 'De la 6ème à la Terminale', d: "Un encadrement rigoureux pour réussir les examens et préparer l'avenir.", img: '/img/bus2.jpg' },
  ],
  dossiers: [
    "Copie d'extrait de naissance",
    'Carnet de vaccination',"4 photos d'identité",
    '2 ramettes',
    'Certificat médical',
    'Attestation du CEE (pour le secondaire)',
  ],
  frais: [
    { n: 'Primaire (CI au CM2)', m: "À consulter à l'administration" },
    { n: 'Secondaire (6ème à Terminale)', m: "À consulter à l'administration" },
  ],
  echeances: [
    { t: '1ère tranche', q: "À l'inscription" },
    { t: '2ème tranche', q: 'En décembre' },
    { t: '3ème tranche', q: 'En février' },
  ],
  reductions: ['10 % pour 3 élèves ou plus', '5 % sur paiement unique annuel'],
  fiche: '/docs/fiche-renseignements-genies-tankpe.pdf',
  galerie: [
    { src: '/img/batiment.jpg', l: "L'école" },
    { src: '/img/groupe.jpg', l: 'Élèves et enseignants' },
    { src: '/img/classe2.jpg', l: 'En classe' },
    { src: '/img/sport.jpg', l: 'Sport' },
    { src: '/img/bus1.jpg', l: 'Sortie éducative' },
    { src: '/img/classe1.jpg', l: 'Cours au secondaire' },
    { src: '/img/bus2.jpg', l: 'Sortie éducative' },
  ],
};

export const tel = (t: string) => t.replace(/[^+\d]/g, '');
export const wa = (t: string) => 'https://wa.me/' + tel(t).replace('+', '');
