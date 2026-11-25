export const fcfa = (n: number | null | undefined) => (Number(n) || 0).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' F';
export const dateFr = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
export const today = () => new Date().toISOString().slice(0, 10);
export const PERIODES = [
  { k: 'T1', l: '1er trimestre' },
  { k: 'T2', l: '2ème trimestre' },
  { k: 'T3', l: '3ème trimestre' },
];
export type Note = { eleve_id?: string; matiere_id: string; periode: string; devoir: number | null; compo: number | null };
export type Matiere = { id: string; nom: string; coef: number };

export function moyMatiere(n?: { devoir: number | null; compo: number | null }) {
  if (!n) return null;
  const v = [n.devoir, n.compo].filter((x) => x !== null && x !== undefined && !isNaN(Number(x))).map(Number);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
export function moyGenerale(matieres: Matiere[], notes: Note[], periode: string) {
  let s = 0, c = 0;
  for (const m of matieres) {
    const mm = moyMatiere(notes.find((n) => n.matiere_id === m.id && n.periode === periode));
    if (mm !== null) { s += mm * m.coef; c += m.coef; }
  }
  return c ? s / c : null;
}
export const mention = (m: number | null) =>
  m === null ? '' : m >= 16 ? 'Excellent' : m >= 14 ? 'Très bien' : m >= 12 ? 'Bien' : m >= 10 ? 'Passable' : 'Insuffisant';
export const n2 = (x: number | null) => (x === null ? '—' : x.toFixed(2).replace('.', ','));
