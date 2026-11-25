import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAll, run } from '@/lib/admin';
import { today } from '@/lib/format';
import type { Data } from '@/components/Direction';

const ST = [['present', 'Présent', 'bg-emerald-600'], ['retard', 'Retard', 'bg-amber-500'], ['absent', 'Absent', 'bg-red-600']] as const;

export function Presences({ d }: { d: Data }) {
  const [cible, setCible] = useState<'eleve' | 'personnel'>('eleve');
  const [jour, setJour] = useState(today());
  const [cl, setCl] = useState('');
  const [pers, setPers] = useState<any[]>([]);
  const [st, setSt] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => { fetchAll('personnel', 'nom').then(setPers); }, []);
  const gens = useMemo(() => cible === 'eleve'
    ? d.eleves.filter((e) => e.actif && e.classe_id === cl).map((e) => ({ id: e.id, nom: e.nom + ' ' + e.prenoms }))
    : pers.filter((p) => p.actif).map((p) => ({ id: p.id, nom: p.nom + ' · ' + p.role })), [cible, cl, d.eleves, pers]);

  useEffect(() => {
    (async () => {
      setOk(false);
      if (!gens.length) { setSt({}); return; }
      const r = ((await run(supabase.from('presences').select('ref_id,statut').eq('jour', jour).eq('cible', cible).in('ref_id', gens.map((g) => g.id)))) as any[]) || [];
      const s: Record<string, string> = {};
      for (const x of r) s[x.ref_id] = x.statut;
      setSt(s);
    })();
  }, [jour, cible, gens]);

  const toutPresent = () => setSt(Object.fromEntries(gens.map((g) => [g.id, 'present'])));
  async function enregistrer() {
    setBusy(true);
    const rows = gens.filter((g) => st[g.id]).map((g) => ({ jour, cible, ref_id: g.id, statut: st[g.id] }));
    if (rows.length) await run(supabase.from('presences').upsert(rows, { onConflict: 'jour,cible,ref_id' }));
    setBusy(false); setOk(true);
  }
  const cpt = (k: string) => gens.filter((g) => st[g.id] === k).length;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <button className={'btn ' + (cible === 'eleve' ? 'btn-primary' : 'btn-ghost')} onClick={() => setCible('eleve')}>Élèves</button>
          <button className={'btn ' + (cible === 'personnel' ? 'btn-primary' : 'btn-ghost')} onClick={() => setCible('personnel')}>Personnel</button>
        </div>
        <input className="input !w-44" type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
        {cible === 'eleve' && <select className="input !w-44" value={cl} onChange={(e) => setCl(e.target.value)}><option value="">Choisir la classe</option>{d.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>}
      </div>
      {gens.length > 0 && (
        <div className="card !p-0">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <button className="btn btn-ghost" onClick={toutPresent}>Tous présents</button>
            <span className="text-sm text-slate-600">Présents {cpt('present')} · Retards {cpt('retard')} · Absents {cpt('absent')}</span>
            <button className="btn btn-primary ml-auto" onClick={enregistrer} disabled={busy}><Save size={16} />{busy ? '…' : 'Enregistrer l\'appel'}</button>
          </div>
          {ok && <p className="px-3 pb-2 text-sm font-bold text-emerald-700">Appel enregistré.</p>}
          <ul className="divide-y divide-slate-100">
            {gens.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="text-sm font-bold">{g.nom}</span>
                <span className="flex gap-1">{ST.map(([k, l, c]) => <button key={k} onClick={() => { setOk(false); setSt({ ...st, [g.id]: k }); }} className={'rounded-lg px-3 py-1.5 text-xs font-bold ' + (st[g.id] === k ? c + ' text-white' : 'bg-slate-100 text-slate-600')}>{l}</button>)}</span>
              </li>))}
          </ul>
        </div>
      )}
      {!gens.length && <p className="card text-sm text-slate-500">{cible === 'eleve' ? 'Choisissez une classe pour faire l\'appel.' : 'Ajoutez d\'abord le personnel dans l\'onglet Personnel.'}</p>}
    </div>
  );
}
