import { useMemo, useState } from 'react';
import { MessageCircle, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { run, imprimerListe, type Eleve } from '@/lib/admin';
import { ECOLE, wa } from '@/lib/ecole';
import type { Data } from '@/components/Direction';

const VIDE = { nom: '', prenoms: '', sexe: 'M', date_naissance: '', classe_id: '', parent_nom: '', parent_tel: '' };

export function Eleves({ d }: { d: Data }) {
  const [f, setF] = useState<any>(VIDE);
  const [edit, setEdit] = useState<Eleve | null>(null);
  const [open, setOpen] = useState(false);
  const [cl, setCl] = useState('');
  const [q, setQ] = useState('');
  const nomClasse = (id: string | null) => d.classes.find((c) => c.id === id)?.nom || '—';

  const liste = useMemo(() => d.eleves.filter((e) =>
    (!cl || e.classe_id === cl) && (!q || (e.nom + ' ' + e.prenoms + ' ' + e.matricule).toLowerCase().includes(q.toLowerCase()))), [d.eleves, cl, q]);

  function nouveauMatricule() {
    const an = String(new Date().getFullYear()).slice(2);
    const nums = d.eleves.map((e) => parseInt(e.matricule.split('-').pop() || '0', 10)).filter((n) => !isNaN(n));
    return `GT${an}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const row = { ...f, nom: f.nom.trim().toUpperCase(), prenoms: f.prenoms.trim(), date_naissance: f.date_naissance || null, classe_id: f.classe_id || null };
    const r = edit
      ? await run(supabase.from('eleves').update(row).eq('id', edit.id))
      : await run(supabase.from('eleves').insert({ ...row, matricule: nouveauMatricule() }));
    if (r === null && !edit) {
      // une erreur a déjà été affichée par run()
    }
    setF(VIDE); setEdit(null); setOpen(false);
    await d.reload();
  }
  function modifier(e: Eleve) {
    setEdit(e); setOpen(true);
    setF({ nom: e.nom, prenoms: e.prenoms, sexe: e.sexe, date_naissance: e.date_naissance || '', classe_id: e.classe_id || '', parent_nom: e.parent_nom || '', parent_tel: e.parent_tel || '' });
  }
  async function suppr(e: Eleve) {
    if (!confirm(`Supprimer ${e.nom} ${e.prenoms} ? Ses notes, présences et paiements seront aussi supprimés.`)) return;
    await run(supabase.from('eleves').delete().eq('id', e.id));
    await d.reload();
  }
  const msg = (e: Eleve) => wa(e.parent_tel || '') + '?text=' + encodeURIComponent(
    `Bonjour, voici l'accès à l'Espace parents de ${ECOLE.court} pour ${e.nom} ${e.prenoms} : ${location.origin}/#/parents\nMatricule : ${e.matricule}\nCode secret : ${e.code_parent}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input !w-48" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-44" value={cl} onChange={(e) => setCl(e.target.value)}>
          <option value="">Toutes les classes</option>
          {d.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => imprimerListe('Liste des élèves' + (cl ? ' — ' + nomClasse(cl) : ''), ['N°', 'Matricule', 'Nom et prénoms', 'Sexe', 'Classe', 'Parent', 'Téléphone'], liste.map((e, i) => [String(i + 1), e.matricule, e.nom + ' ' + e.prenoms, e.sexe, nomClasse(e.classe_id), e.parent_nom, e.parent_tel]))}><Printer size={16} />Imprimer</button>
        <button className="btn btn-primary ml-auto" onClick={() => { setEdit(null); setF(VIDE); setOpen(!open); }}><Plus size={16} />Nouvel élève</button>
      </div>

      {open && (
        <form onSubmit={save} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="Nom *" required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
          <input className="input" placeholder="Prénoms *" required value={f.prenoms} onChange={(e) => setF({ ...f, prenoms: e.target.value })} />
          <select className="input" value={f.sexe} onChange={(e) => setF({ ...f, sexe: e.target.value })}><option value="M">Garçon</option><option value="F">Fille</option></select>
          <input className="input" type="date" value={f.date_naissance} onChange={(e) => setF({ ...f, date_naissance: e.target.value })} title="Date de naissance" />
          <select className="input" required value={f.classe_id} onChange={(e) => setF({ ...f, classe_id: e.target.value })}>
            <option value="">Classe *</option>{d.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <input className="input" placeholder="Nom du parent" value={f.parent_nom} onChange={(e) => setF({ ...f, parent_nom: e.target.value })} />
          <input className="input" placeholder="Téléphone du parent" inputMode="tel" value={f.parent_tel} onChange={(e) => setF({ ...f, parent_tel: e.target.value })} />
          <button className="btn btn-primary">{edit ? 'Enregistrer' : 'Inscrire'}</button>
        </form>
      )}

      <div className="card overflow-x-auto !p-0">
        <table className="w-full">
          <thead><tr className="border-b bg-slate-50"><th className="th">Matricule</th><th className="th">Nom et prénoms</th><th className="th">Classe</th><th className="th">Parent</th><th className="th">Code parent</th><th className="th" /></tr></thead>
          <tbody>
            {liste.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="td font-bold">{e.matricule}</td>
                <td className="td">{e.nom} {e.prenoms}</td>
                <td className="td">{nomClasse(e.classe_id)}</td>
                <td className="td">{e.parent_nom}<br /><span className="text-xs text-slate-500">{e.parent_tel}</span></td>
                <td className="td font-mono">{e.code_parent}</td>
                <td className="td whitespace-nowrap text-right">
                  {e.parent_tel && <a className="btn btn-ghost !px-2 !py-1.5" href={msg(e)} target="_blank" rel="noreferrer" title="Envoyer l'accès au parent par WhatsApp"><MessageCircle size={15} /></a>}{' '}
                  <button className="btn btn-ghost !px-2 !py-1.5" onClick={() => modifier(e)}><Pencil size={15} /></button>{' '}
                  <button className="btn btn-danger !px-2 !py-1.5" onClick={() => suppr(e)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {!liste.length && <tr><td className="td text-slate-500" colSpan={6}>Aucun élève. Cliquez sur « Nouvel élève ».</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">{liste.length} élève(s). Le bouton vert WhatsApp envoie au parent son matricule et son code secret.</p>
    </div>
  );
}
