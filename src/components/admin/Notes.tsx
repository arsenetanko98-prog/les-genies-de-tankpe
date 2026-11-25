import { useEffect, useMemo, useState } from 'react';
import { Printer, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { imprimerBulletin, run } from '@/lib/admin';
import { PERIODES, moyGenerale, moyMatiere, n2, type Matiere, type Note } from '@/lib/format';
import type { Data } from '@/components/Direction';

export function Notes({ d }: { d: Data }) {
  const [cl, setCl] = useState('');
  const [per, setPer] = useState('T1');
  const [mat, setMat] = useState('');
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [saisie, setSaisie] = useState<Record<string, { devoir: string; compo: string }>>({});
  const [busy, setBusy] = useState(false);

  const eleves = useMemo(() => d.eleves.filter((e) => e.classe_id === cl && e.actif), [d.eleves, cl]);

  const charger = async () => {
    if (!cl) { setMatieres([]); setNotes([]); return; }
    const ms = ((await run(supabase.from('matieres').select('id,nom,coef').eq('classe_id', cl).order('nom'))) as Matiere[]) || [];
    setMatieres(ms);
    const ids = eleves.map((e) => e.id);
    const ns = ids.length ? (((await run(supabase.from('notes').select('*').in('eleve_id', ids))) as Note[]) || []) : [];
    setNotes(ns);
  };
  useEffect(() => { setMat(''); charger(); }, [cl, d.eleves.length]); // eslint-disable-line
  useEffect(() => {
    const s: Record<string, { devoir: string; compo: string }> = {};
    for (const e of eleves) {
      const n = notes.find((x) => x.eleve_id === e.id && x.matiere_id === mat && x.periode === per);
      s[e.id] = { devoir: n?.devoir?.toString() ?? '', compo: n?.compo?.toString() ?? '' };
    }
    setSaisie(s);
  }, [mat, per, notes, eleves]);

  const valide = (v: string) => v === '' || (!isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) >= 0 && Number(v.replace(',', '.')) <= 20);
  const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')));

  async function enregistrer() {
    const rows = eleves.map((e) => ({ eleve_id: e.id, matiere_id: mat, periode: per, devoir: num(saisie[e.id]?.devoir ?? ''), compo: num(saisie[e.id]?.compo ?? '') }));
    if (rows.some((r) => (r.devoir !== null && (r.devoir < 0 || r.devoir > 20)) || (r.compo !== null && (r.compo < 0 || r.compo > 20)))) { alert('Les notes doivent être entre 0 et 20.'); return; }
    setBusy(true);
    await run(supabase.from('notes').upsert(rows.filter((r) => r.devoir !== null || r.compo !== null), { onConflict: 'eleve_id,matiere_id,periode' }));
    setBusy(false);
    await charger();
  }

  const moyennes = useMemo(() => eleves.map((e) => ({ e, m: moyGenerale(matieres, notes.filter((n) => n.eleve_id === e.id), per) })), [eleves, matieres, notes, per]);
  const classees = moyennes.filter((x) => x.m !== null).sort((a, b) => (b.m as number) - (a.m as number));
  const moyClasse = classees.length ? classees.reduce((s, x) => s + (x.m as number), 0) / classees.length : null;
  const classe = d.classes.find((c) => c.id === cl);

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-2">
        <select className="input !w-44" value={cl} onChange={(e) => setCl(e.target.value)}><option value="">Choisir la classe</option>{d.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        <select className="input !w-44" value={per} onChange={(e) => setPer(e.target.value)}>{PERIODES.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}</select>
        <select className="input !w-52" value={mat} onChange={(e) => setMat(e.target.value)} disabled={!cl}><option value="">Choisir la matière</option>{matieres.map((m) => <option key={m.id} value={m.id}>{m.nom} (coef {m.coef})</option>)}</select>
      </div>
      {cl && !matieres.length && <p className="card text-sm text-amber-800">Cette classe n'a pas encore de matières : ajoutez-les dans « Classes et matières ».</p>}

      {cl && mat && (
        <section className="card !p-0">
          <div className="flex items-center justify-between p-3"><h2 className="font-display text-lg font-bold text-navy">Saisie des notes sur 20</h2>
            <button className="btn btn-primary" onClick={enregistrer} disabled={busy || eleves.some((e) => !valide(saisie[e.id]?.devoir ?? '') || !valide(saisie[e.id]?.compo ?? ''))}><Save size={16} />{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
          <table className="w-full"><thead><tr className="border-y bg-slate-50"><th className="th">Élève</th><th className="th w-28">Devoir</th><th className="th w-28">Composition</th><th className="th">Moyenne</th></tr></thead>
            <tbody>{eleves.map((e) => {
              const s = saisie[e.id] || { devoir: '', compo: '' };
              const mm = moyMatiere({ devoir: num(s.devoir), compo: num(s.compo) });
              return (
                <tr key={e.id} className="border-b border-slate-100"><td className="td">{e.nom} {e.prenoms}</td>
                  {(['devoir', 'compo'] as const).map((k) => (
                    <td key={k} className="td"><input className={'input !py-1.5 ' + (valide(s[k]) ? '' : '!border-red-500')} inputMode="decimal" value={s[k]} onChange={(ev) => setSaisie({ ...saisie, [e.id]: { ...s, [k]: ev.target.value } })} /></td>))}
                  <td className="td font-bold">{n2(mm)}</td></tr>);
            })}</tbody></table>
        </section>
      )}

      {cl && (
        <section className="card !p-0">
          <h2 className="p-3 font-display text-lg font-bold text-navy">Résultats et bulletins · {PERIODES.find((p) => p.k === per)?.l}</h2>
          <table className="w-full"><thead><tr className="border-y bg-slate-50"><th className="th">Rang</th><th className="th">Élève</th><th className="th">Moyenne</th><th className="th" /></tr></thead>
            <tbody>
              {[...classees.map((x, i) => ({ ...x, rang: i + 1 })), ...moyennes.filter((x) => x.m === null).map((x) => ({ ...x, rang: 0 }))].map(({ e, m, rang }) => (
                <tr key={e.id} className="border-b border-slate-100"><td className="td">{rang || '—'}</td><td className="td">{e.nom} {e.prenoms}</td><td className="td font-bold">{n2(m)}</td>
                  <td className="td text-right"><button className="btn btn-ghost !py-1.5" onClick={() => imprimerBulletin(e, classe, matieres, notes.filter((n) => n.eleve_id === e.id), per, rang || null, classees.length, moyClasse)}><Printer size={15} />Bulletin</button></td></tr>
              ))}
              {!eleves.length && <tr><td className="td text-slate-500" colSpan={4}>Aucun élève dans cette classe.</td></tr>}
            </tbody></table>
          {moyClasse !== null && <p className="p-3 text-sm text-slate-600">Moyenne de la classe : <b>{n2(moyClasse)}</b></p>}
        </section>
      )}
    </div>
  );
}
