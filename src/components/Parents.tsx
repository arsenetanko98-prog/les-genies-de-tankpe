import { useState } from 'react';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import { Logo } from '@/components/Site';
import { supabase } from '@/lib/supabase';
import { ECOLE } from '@/lib/ecole';
import { PERIODES, dateFr, fcfa, mention, moyGenerale, moyMatiere, n2 } from '@/lib/format';

export default function Parents() {
  const [mat, setMat] = useState('');
  const [code, setCode] = useState('');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);
  const [per, setPer] = useState('T1');

  async function ouvrir(e: React.FormEvent) {
    e.preventDefault();
    setLoad(true); setErr('');
    const { data, error } = await supabase.rpc('parent_consulter', { p_matricule: mat, p_code: code });
    setLoad(false);
    if (error || !data) { setErr('Matricule ou code incorrect. Demandez-les à l\'administration de l\'école.'); return; }
    setD(data);
  }

  const frais = d?.classe?.frais || 0;
  const paye = (d?.paiements || []).reduce((s: number, p: any) => s + p.montant, 0);
  const moy = d ? moyGenerale(d.matieres, d.notes, per) : null;

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <a href="#top" className="rounded-lg p-1.5 hover:bg-white/10"><ArrowLeft size={20} /></a>
          <Logo size={36} />
          <div className="leading-tight"><p className="font-display font-extrabold">Espace parents</p><p className="text-xs text-blue-200">{ECOLE.court}</p></div>
          {d && <button className="btn ml-auto !py-1.5 text-white hover:bg-white/10" onClick={() => { setD(null); setCode(''); }}><LogOut size={16} />Quitter</button>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {!d && (
          <form onSubmit={ouvrir} className="card space-y-3">
            <h1 className="font-display text-2xl font-extrabold text-navy">Suivre mon enfant</h1>
            <p className="text-sm text-slate-600">Entrez le matricule et le code secret remis par l'école pour voir les notes, les paiements et les présences.</p>
            <input className="input" placeholder="Matricule (ex. GT-0001)" value={mat} onChange={(e) => setMat(e.target.value)} required />
            <input className="input uppercase" placeholder="Code secret" value={code} onChange={(e) => setCode(e.target.value)} required />
            <button className="btn btn-primary w-full" disabled={load}><Search size={16} />{load ? 'Recherche…' : 'Voir le dossier'}</button>
            {err && <p className="text-sm font-bold text-red-700">{err}</p>}
          </form>
        )}
        {d && (
          <>
            <div className="card">
              <p className="text-xs font-bold text-royal">{d.classe?.cycle} · {d.classe?.nom || 'Classe non renseignée'}</p>
              <h1 className="font-display text-2xl font-extrabold text-navy">{d.eleve.nom} {d.eleve.prenoms}</h1>
              <p className="text-sm text-slate-500">Matricule {d.eleve.matricule}</p>
            </div>

            <div className="card">
              <h2 className="mb-2 font-display text-lg font-bold text-navy">Notes</h2>
              <div className="mb-3 flex gap-2">
                {PERIODES.map((p) => <button key={p.k} onClick={() => setPer(p.k)} className={'btn !py-1.5 ' + (per === p.k ? 'btn-primary' : 'btn-ghost')}>{p.k}</button>)}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="th">Matière</th><th className="th">Coef</th><th className="th">Devoir</th><th className="th">Compo</th><th className="th">Moy.</th></tr></thead>
                  <tbody>
                    {d.matieres.map((m: any) => {
                      const n = d.notes.find((x: any) => x.matiere_id === m.id && x.periode === per);
                      return <tr key={m.id} className="border-b border-slate-100"><td className="td font-bold">{m.nom}</td><td className="td">{m.coef}</td><td className="td">{n?.devoir ?? '—'}</td><td className="td">{n?.compo ?? '—'}</td><td className="td font-bold">{n2(moyMatiere(n))}</td></tr>;
                    })}
                    {!d.matieres.length && <tr><td className="td text-slate-500" colSpan={5}>Aucune matière enregistrée.</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 rounded-xl bg-mist p-3 text-sm">Moyenne générale : <b className="text-royal">{n2(moy)} / 20</b> {moy !== null && <span className="font-bold">· {mention(moy)}</span>}</p>
            </div>

            <div className="card">
              <h2 className="mb-2 font-display text-lg font-bold text-navy">Scolarité</h2>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-mist p-2"><p className="text-xs text-slate-500">Frais</p><p className="font-bold">{fcfa(frais)}</p></div>
                <div className="rounded-xl bg-emerald-50 p-2"><p className="text-xs text-slate-500">Payé</p><p className="font-bold text-emerald-700">{fcfa(paye)}</p></div>
                <div className="rounded-xl bg-red-50 p-2"><p className="text-xs text-slate-500">Reste</p><p className="font-bold text-red-700">{fcfa(Math.max(0, frais - paye))}</p></div>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {d.paiements.map((p: any) => <li key={p.recu_no} className="flex justify-between py-1.5"><span>{dateFr(p.jour)} · {p.motif}</span><b>{fcfa(p.montant)}</b></li>)}
                {!d.paiements.length && <li className="py-1.5 text-slate-500">Aucun paiement enregistré.</li>}
              </ul>
            </div>

            <div className="card">
              <h2 className="mb-2 font-display text-lg font-bold text-navy">Présences</h2>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-emerald-50 p-2"><p className="text-xs text-slate-500">Présent</p><p className="font-bold">{d.presences.present || 0}</p></div>
                <div className="rounded-xl bg-red-50 p-2"><p className="text-xs text-slate-500">Absent</p><p className="font-bold">{d.presences.absent || 0}</p></div>
                <div className="rounded-xl bg-amber-50 p-2"><p className="text-xs text-slate-500">Retard</p><p className="font-bold">{d.presences.retard || 0}</p></div>
              </div>
              {d.dernieres_absences.length > 0 && <p className="mt-2 text-xs text-slate-500">Dernières absences : {d.dernieres_absences.map((j: string) => dateFr(j)).join(', ')}</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
