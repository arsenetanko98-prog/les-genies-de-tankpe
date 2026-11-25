import { supabase } from '@/lib/supabase';
import { ECOLE } from '@/lib/ecole';
import { PERIODES, dateFr, fcfa, mention, moyGenerale, moyMatiere, n2, type Matiere, type Note } from '@/lib/format';

export type Classe = { id: string; nom: string; cycle: string; ordre: number; frais_annuels: number };
export type Eleve = { id: string; matricule: string; nom: string; prenoms: string; sexe: string; date_naissance: string | null; classe_id: string | null; parent_nom: string; parent_tel: string; code_parent: string; actif: boolean };
export type Paiement = { id: string; recu_no: number; eleve_id: string; montant: number; motif: string; mode: string; jour: string };

/** Exécute une requête Supabase ; affiche l'erreur si besoin. */
export async function run<T = any>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T | null> {
  const { data, error } = await p;
  if (error) { alert('Erreur : ' + error.message); return null; }
  return data;
}
export const fetchAll = async (table: string, order?: string): Promise<any[]> => {
  let q = supabase.from(table).select('*');
  if (order) q = q.order(order);
  return ((await run(q)) as any[]) || [];
};

const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const STYLE = `<style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:24px;max-width:780px;margin:auto}
.top{display:flex;gap:14px;align-items:center;border-bottom:3px solid #1D3FB4;padding-bottom:10px}
.top img{width:70px;height:70px;object-fit:contain}.top h1{margin:0;font-size:18px;color:#0E2680}.top p{margin:2px 0;font-size:12px;color:#444}
h2{text-align:center;font-size:17px;margin:16px 0 6px;color:#0E2680;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #999;padding:5px 7px;font-size:12px;text-align:left}th{background:#E8ECFA}
.r{text-align:right}.box{border:1px solid #999;padding:8px;margin-top:10px;font-size:13px}.sign{display:flex;justify-content:space-between;margin-top:30px;font-size:12px}
@media print{button{display:none}}
</style>`;
function ouvrir(titre: string, corps: string) {
  const w = window.open('', '_blank');
  if (!w) { alert("Autorisez l'ouverture de fenêtres pour imprimer."); return; }
  const base = location.origin;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>${STYLE}</head><body>
<div class="top"><img src="${base}/logo.png"><div><h1>${esc(ECOLE.nom)}</h1><p>${esc(ECOLE.adresse)}</p><p>Tél : ${ECOLE.telephones.map(esc).join(' / ')}</p></div></div>
${corps}<p style="text-align:center;margin-top:20px"><button onclick="print()" style="padding:10px 22px;font-size:14px">Imprimer</button></p></body></html>`);
  w.document.close();
}

export function imprimerRecu(p: Paiement, e: Eleve, classe: string, totalPaye: number, frais: number) {
  ouvrir('Reçu ' + p.recu_no, `<h2>Reçu de paiement n° ${String(p.recu_no).padStart(5, '0')}</h2>
<div class="box"><b>Élève :</b> ${esc(e.nom)} ${esc(e.prenoms)} (${esc(e.matricule)})<br><b>Classe :</b> ${esc(classe)}<br><b>Date :</b> ${dateFr(p.jour)}<br><b>Motif :</b> ${esc(p.motif)} · <b>Mode :</b> ${esc(p.mode)}</div>
<table><tr><th>Montant reçu</th><td class="r"><b>${fcfa(p.montant)}</b></td></tr><tr><th>Total payé à ce jour</th><td class="r">${fcfa(totalPaye)}</td></tr>${frais ? `<tr><th>Reste à payer</th><td class="r">${fcfa(Math.max(0, frais - totalPaye))}</td></tr>` : ''}</table>
<div class="sign"><span>Le parent</span><span>La Direction (cachet et signature)</span></div>`);
}

export function imprimerBulletin(e: Eleve, classe: Classe | undefined, matieres: Matiere[], notes: Note[], periode: string, rang: number | null, effectif: number, moyClasse: number | null) {
  const per = PERIODES.find((p) => p.k === periode)?.l || periode;
  const moy = moyGenerale(matieres, notes, periode);
  const lignes = matieres.map((m) => {
    const n = notes.find((x) => x.matiere_id === m.id && x.periode === periode);
    const mm = moyMatiere(n);
    return `<tr><td>${esc(m.nom)}</td><td class="r">${m.coef}</td><td class="r">${n?.devoir ?? '—'}</td><td class="r">${n?.compo ?? '—'}</td><td class="r"><b>${n2(mm)}</b></td><td class="r">${mm === null ? '' : n2(mm * m.coef)}</td><td>${mention(mm)}</td></tr>`;
  }).join('');
  ouvrir('Bulletin ' + e.nom, `<h2>Bulletin de notes — ${esc(per)}</h2><p style="text-align:center;margin:0;font-size:12px">Année scolaire ${ECOLE.annee}</p>
<div class="box"><b>Élève :</b> ${esc(e.nom)} ${esc(e.prenoms)} · <b>Matricule :</b> ${esc(e.matricule)} · <b>Classe :</b> ${esc(classe?.nom || '')}</div>
<table><tr><th>Matière</th><th class="r">Coef</th><th class="r">Devoir</th><th class="r">Compo</th><th class="r">Moyenne</th><th class="r">Moy×Coef</th><th>Appréciation</th></tr>${lignes}</table>
<div class="box"><b>Moyenne générale : ${n2(moy)} / 20</b> — ${mention(moy)}${rang ? `<br>Rang : <b>${rang}</b> / ${effectif}` : ''}${moyClasse !== null ? `<br>Moyenne de la classe : ${n2(moyClasse)}` : ''}</div>
<div class="sign"><span>Le parent</span><span>Le Directeur (cachet et signature)</span></div>`);
}

export function imprimerListe(titre: string, entetes: string[], lignes: string[][]) {
  ouvrir(titre, `<h2>${esc(titre)}</h2><table><tr>${entetes.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${lignes.map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`);
}
