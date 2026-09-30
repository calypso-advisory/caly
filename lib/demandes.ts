export const STATUTS = [
  { id: 'nouveau', label: 'Nouvelle' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'traite', label: 'Traitée' },
  { id: 'archive', label: 'Archivée' }
] as const;

export type Statut = (typeof STATUTS)[number]['id'];

export const SITUATIONS = [
  'Anticiper', 'Trésorerie', 'Créanciers', 'Négociation', 'Procédure envisagée',
  'Sauvegarde ou redressement', 'Échéance', 'Cession', 'Autre'
];

export type Demande = {
  id: string; created_at: string; updated_at: string;
  situation: string | null; message: string | null; nom: string; societe: string | null;
  email: string; telephone: string | null; statut: Statut; notes: string | null;
};

export function statutLabel(s: string) { return STATUTS.find((x) => x.id === s)?.label || s; }
