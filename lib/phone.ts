/* Numéros français : accepte 06 12 34 56 78, 0612345678, +33 6 12 34 56 78, 0033612345678.
   Renvoie le format international +33XXXXXXXXX, ou null si le numéro n'est pas valide. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.replace(/[\s.\-()]/g, '');
  let n: string;
  if (/^\+33[1-9]\d{8}$/.test(s)) n = s.slice(3);
  else if (/^0033[1-9]\d{8}$/.test(s)) n = s.slice(4);
  else if (/^0[1-9]\d{8}$/.test(s)) n = s.slice(1);
  else return null;
  return '+33' + n;
}

/* SIREN (9 chiffres) ou SIRET (14 chiffres) saisi dans le champ « Entreprise ». */
export function extractSiren(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const d = input.replace(/[\s.]/g, '');
  if (/^\d{9}$/.test(d)) return d;
  if (/^\d{14}$/.test(d)) return d.slice(0, 9);
  return null;
}
