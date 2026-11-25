import { useEffect, useState } from 'react';
import { MessageCircle, Phone, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAll, run } from '@/lib/admin';
import { dateFr } from '@/lib/format';
import { tel, wa } from '@/lib/ecole';

export function Annonces() {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ titre: '', texte: '' });
  const charger = async () => setRows(await fetchAll('annonces', 'jour').then((r) => r.reverse()));
  useEffect(() => { charger(); }, []);
  async function add(e: React.FormEvent) { e.preventDefault(); await run(supabase.from('annonces').insert(f)); setF({ titre: '', texte: '' }); charger(); }
  async function suppr(id: string) { if (!confirm('Supprimer cette annonce ?')) return; await run(supabase.from('annonces').delete().eq('id', id)); charger(); }
  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card space-y-2">
        <p className="text-sm text-slate-600">Les 3 dernières annonces s'affichent en haut du site public.</p>
        <input className="input" placeholder="Titre (ex. Rentrée le 7 septembre)" required value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} />
        <textarea className="input min-h-[80px]" placeholder="Détails" value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} />
        <button className="btn btn-primary"><Plus size={16} />Publier</button>
      </form>
      <div className="space-y-2">
        {rows.map((a) => <div key={a.id} className="card flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold text-royal">{dateFr(a.jour)}</p><p className="font-bold">{a.titre}</p><p className="whitespace-pre-line text-sm text-slate-600">{a.texte}</p></div>
          <button className="btn btn-danger !px-2 !py-1.5" onClick={() => suppr(a.id)}><Trash2 size={15} /></button></div>)}
        {!rows.length && <p className="text-sm text-slate-500">Aucune annonce.</p>}
      </div>
    </div>
  );
}

export function Messages() {
  const [rows, setRows] = useState<any[]>([]);
  const charger = async () => setRows(await fetchAll('messages', 'created_at').then((r) => r.reverse()));
  useEffect(() => { charger(); }, []);
  async function lu(id: string, v: boolean) { await run(supabase.from('messages').update({ lu: v }).eq('id', id)); charger(); }
  async function suppr(id: string) { if (!confirm('Supprimer ce message ?')) return; await run(supabase.from('messages').delete().eq('id', id)); charger(); }
  return (
    <div className="space-y-2">
      {rows.map((m) => (
        <div key={m.id} className={'card ' + (m.lu ? '' : 'border-royal bg-blue-50/50')}>
          <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{m.nom}</p><span className="text-xs text-slate-500">{dateFr(m.created_at)}</span>
            <span className="ml-auto flex gap-1"><a className="btn btn-ghost !px-2 !py-1.5" href={'tel:' + tel(m.telephone)}><Phone size={15} /></a><a className="btn btn-ghost !px-2 !py-1.5" target="_blank" rel="noreferrer" href={wa(m.telephone)}><MessageCircle size={15} /></a>
              <button className="btn btn-ghost !py-1.5" onClick={() => lu(m.id, !m.lu)}>{m.lu ? 'Marquer non lu' : 'Marquer lu'}</button>
              <button className="btn btn-danger !px-2 !py-1.5" onClick={() => suppr(m.id)}><Trash2 size={15} /></button></span></div>
          <p className="text-sm font-bold text-royal">{m.telephone}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{m.texte}</p>
        </div>))}
      {!rows.length && <p className="card text-sm text-slate-500">Aucun message reçu pour l'instant.</p>}
    </div>
  );
}
