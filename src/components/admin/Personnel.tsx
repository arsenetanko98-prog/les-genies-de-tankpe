import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAll, run } from '@/lib/admin';

export function Personnel() {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ nom: '', role: 'Enseignant', matiere: '', telephone: '' });
  const charger = async () => setRows(await fetchAll('personnel', 'nom'));
  useEffect(() => { charger(); }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await run(supabase.from('personnel').insert({ ...f, nom: f.nom.trim() }));
    setF({ nom: '', role: 'Enseignant', matiere: '', telephone: '' });
    charger();
  }
  async function suppr(id: string, nom: string) {
    if (!confirm(`Retirer ${nom} de la liste ?`)) return;
    await run(supabase.from('personnel').delete().eq('id', id));
    charger();
  }
  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input" placeholder="Nom et prénoms *" required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
        <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option>Enseignant</option><option>Surveillant</option><option>Secrétaire</option><option>Comptable</option><option>Chauffeur</option><option>Agent d'entretien</option><option>Autre</option></select>
        <input className="input" placeholder="Matière / classe" value={f.matiere} onChange={(e) => setF({ ...f, matiere: e.target.value })} />
        <input className="input" placeholder="Téléphone" inputMode="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
        <button className="btn btn-primary"><Plus size={16} />Ajouter</button>
      </form>
      <div className="card overflow-x-auto !p-0"><table className="w-full"><thead><tr className="border-b bg-slate-50"><th className="th">Nom</th><th className="th">Fonction</th><th className="th">Matière / classe</th><th className="th">Téléphone</th><th className="th" /></tr></thead>
        <tbody>{rows.map((p) => <tr key={p.id} className="border-b border-slate-100"><td className="td font-bold">{p.nom}</td><td className="td">{p.role}</td><td className="td">{p.matiere}</td><td className="td">{p.telephone && <a className="font-bold text-royal" href={'tel:' + p.telephone}>{p.telephone}</a>}</td>
          <td className="td text-right"><button className="btn btn-danger !px-2 !py-1.5" onClick={() => suppr(p.id, p.nom)}><Trash2 size={15} /></button></td></tr>)}
          {!rows.length && <tr><td className="td text-slate-500" colSpan={5}>Aucun membre du personnel enregistré.</td></tr>}</tbody></table></div>
    </div>
  );
}
