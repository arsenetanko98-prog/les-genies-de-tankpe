import { useMemo, useState } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { imprimerListe, imprimerRecu, run, type Eleve, type Paiement } from '@/lib/admin';
import { dateFr, fcfa, today } from '@/lib/format';
import type { Data } from '@/components/Direction';

export function Paiements({ d }: { d: Data }) {
  const [cl, setCl] = useState('');
  const [f, setF] = useState({ eleve_id: '', montant: '', motif: 'Scolarité', mode: 'Espèces', jour: today() });
  const [vue, setVue] = useState<'recus' | 'impayes'>('recus');
  const eleve = (id: string) => d.eleves.find((e) => e.id === id);
  const classe = (id: string | null) => d.classes.find((c) => c.id === id);
  const payeDe = (id: string) => d.paiements.filter((p) => p.eleve_id === id).reduce((s, p) => s + p.montant, 0);
  const fraisDe = (e: Eleve) => classe(e.classe_id)?.frais_annuels || 0;
  const choix = d.eleves.filter((e) => e.actif && (!cl || e.classe_id === cl));
  const sel = eleve(f.eleve_id);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(f.montant, 10);
    if (!f.eleve_id || !m) return;
    const r = (await run(supabase.from('paiements').insert({ eleve_id: f.eleve_id, montant: m, motif: f.motif, mode: f.mode, jour: f.jour }).select().single())) as Paiement | null;
    setF({ ...f, montant: '' });
    await d.reload();
    if (r && sel && confirm('Paiement enregistré. Imprimer le reçu ?')) imprimerRecu(r, sel, classe(sel.classe_id)?.nom || '', payeDe(sel.id) + r.montant, fraisDe(sel));
  }
  async function suppr(p: Paiement) {
    if (!confirm(`Supprimer le paiement de ${fcfa(p.montant)} ?`)) return;
    await run(supabase.from('paiements').delete().eq('id', p.id));
    await d.reload();
  }

  const impayes = useMemo(() => d.eleves.filter((e) => e.actif && (!cl || e.classe_id === cl))
    .map((e) => ({ e, frais: fraisDe(e), paye: payeDe(e.id) })).filter((x) => x.frais > x.paye).sort((a, b) => (b.frais - b.paye) - (a.frais - a.paye)), [d.eleves, d.paiements, d.classes, cl]); // eslint-disable-line
  const recents = [...d.paiements].reverse().filter((p) => !cl || eleve(p.eleve_id)?.classe_id === cl).slice(0, 60);
  const total = d.paiements.reduce((s, p) => s + p.montant, 0);

  return (
    <div className="space-y-4">
      <form onSubmit={enregistrer} className="card grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <select className="input" value={cl} onChange={(e) => { setCl(e.target.value); setF({ ...f, eleve_id: '' }); }}><option value="">Toutes classes</option>{d.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        <select className="input lg:col-span-2" required value={f.eleve_id} onChange={(e) => setF({ ...f, eleve_id: e.target.value })}><option value="">Choisir l'élève *</option>{choix.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule})</option>)}</select>
        <input className="input" placeholder="Montant (F) *" inputMode="numeric" required value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value.replace(/\D/g, '') })} />
        <select className="input" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })}><option>Scolarité</option><option>Inscription</option><option>Tenue</option><option>Fournitures</option><option>Transport</option><option>Autre</option></select>
        <select className="input" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option>Espèces</option><option>Mobile Money</option><option>Virement</option></select>
        <input className="input" type="date" value={f.jour} onChange={(e) => setF({ ...f, jour: e.target.value })} />
        {sel && <p className="text-sm text-slate-600 sm:col-span-2 lg:col-span-4">Frais : <b>{fcfa(fraisDe(sel))}</b> · Déjà payé : <b className="text-emerald-700">{fcfa(payeDe(sel.id))}</b> · Reste : <b className="text-red-700">{fcfa(Math.max(0, fraisDe(sel) - payeDe(sel.id)))}</b></p>}
        <button className="btn btn-primary lg:col-span-2">Enregistrer le paiement</button>
      </form>

      <div className="flex items-center gap-2">
        <button className={'btn ' + (vue === 'recus' ? 'btn-primary' : 'btn-ghost')} onClick={() => setVue('recus')}>Derniers paiements</button>
        <button className={'btn ' + (vue === 'impayes' ? 'btn-primary' : 'btn-ghost')} onClick={() => setVue('impayes')}>Impayés ({impayes.length})</button>
        <p className="ml-auto text-sm text-slate-600">Total encaissé : <b className="text-emerald-700">{fcfa(total)}</b></p>
      </div>

      {vue === 'recus' ? (
        <div className="card overflow-x-auto !p-0"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="th">Reçu</th><th className="th">Date</th><th className="th">Élève</th><th className="th">Motif</th><th className="th">Montant</th><th className="th" /></tr></thead>
          <tbody>{recents.map((p) => { const e = eleve(p.eleve_id); return (
            <tr key={p.id} className="border-b border-slate-100"><td className="td">N° {String(p.recu_no).padStart(5, '0')}</td><td className="td">{dateFr(p.jour)}</td><td className="td">{e ? e.nom + ' ' + e.prenoms : '—'}</td><td className="td">{p.motif} · {p.mode}</td><td className="td font-bold">{fcfa(p.montant)}</td>
              <td className="td whitespace-nowrap text-right">{e && <button className="btn btn-ghost !px-2 !py-1.5" onClick={() => imprimerRecu(p, e, classe(e.classe_id)?.nom || '', payeDe(e.id), fraisDe(e))}><Printer size={15} /></button>}{' '}<button className="btn btn-danger !px-2 !py-1.5" onClick={() => suppr(p)}><Trash2 size={15} /></button></td></tr>); })}
            {!recents.length && <tr><td className="td text-slate-500" colSpan={6}>Aucun paiement.</td></tr>}</tbody></table></div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <div className="flex justify-end p-2"><button className="btn btn-ghost" onClick={() => imprimerListe('Élèves avec solde à payer', ['Élève', 'Classe', 'Frais', 'Payé', 'Reste', 'Tél. parent'], impayes.map(({ e, frais, paye }) => [e.nom + ' ' + e.prenoms, classe(e.classe_id)?.nom || '', fcfa(frais), fcfa(paye), fcfa(frais - paye), e.parent_tel]))}><Printer size={15} />Imprimer</button></div>
          <table className="w-full"><thead><tr className="border-y bg-slate-50"><th className="th">Élève</th><th className="th">Classe</th><th className="th">Payé</th><th className="th">Reste</th><th className="th">Parent</th></tr></thead>
            <tbody>{impayes.map(({ e, frais, paye }) => <tr key={e.id} className="border-b border-slate-100"><td className="td">{e.nom} {e.prenoms}</td><td className="td">{classe(e.classe_id)?.nom}</td><td className="td">{fcfa(paye)}</td><td className="td font-bold text-red-700">{fcfa(frais - paye)}</td><td className="td">{e.parent_tel && <a className="font-bold text-royal" href={'tel:' + e.parent_tel}>{e.parent_tel}</a>}</td></tr>)}
              {!impayes.length && <tr><td className="td text-slate-500" colSpan={5}>Aucun solde en attente (pensez à renseigner les frais de chaque classe).</td></tr>}</tbody></table></div>
      )}
    </div>
  );
}
