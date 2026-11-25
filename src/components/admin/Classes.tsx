import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAll, run } from '@/lib/admin';
import { fcfa } from '@/lib/format';
import type { Data } from '@/components/Direction';

export function Classes({ d }: { d: Data }) {
  const [nc, setNc] = useState({ nom: '', cycle: 'Primaire', frais_annuels: '' });
  const [sel, setSel] = useState('');
  const [mats, setMats] = useState<any[]>([]);
  const [nm, setNm] = useState({ nom: '', coef: '1' });
  const [frais, setFrais] = useState<Record<string, string>>({});

  const charger = async (id: string) => {
    if (!id) { setMats([]); return; }
    const r = await run(supabase.from('matieres').select('*').eq('classe_id', id).order('nom'));
    setMats((r as any[]) || []);
  };
  useEffect(() => { charger(sel); }, [sel]);
  void fetchAll;

  async function addClasse(e: React.FormEvent) {
    e.preventDefault();
    const ordre = (d.classes.length ? Math.max(...d.classes.map((c) => c.ordre)) : 0) + 1;
    await run(supabase.from('classes').insert({ nom: nc.nom.trim(), cycle: nc.cycle, ordre, frais_annuels: parseInt(nc.frais_annuels || '0', 10) }));
    setNc({ nom: '', cycle: 'Primaire', frais_annuels: '' });
    await d.reload();
  }
  async function saveFrais(id: string) {
    const v = parseInt(frais[id] ?? '', 10);
    if (isNaN(v) || v < 0) return;
    await run(supabase.from('classes').update({ frais_annuels: v }).eq('id', id));
    setFrais((s) => { const n = { ...s }; delete n[id]; return n; });
    await d.reload();
  }
  async function delClasse(id: string, nom: string) {
    if (!confirm(`Supprimer la classe ${nom} et ses matières ? Les élèves de cette classe resteront sans classe.`)) return;
    await run(supabase.from('classes').delete().eq('id', id));
    if (sel === id) setSel('');
    await d.reload();
  }
  async function addMat(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return;
    await run(supabase.from('matieres').insert({ classe_id: sel, nom: nm.nom.trim(), coef: parseFloat(nm.coef.replace(',', '.')) || 1 }));
    setNm({ nom: '', coef: '1' });
    charger(sel);
  }
  async function delMat(id: string) {
    if (!confirm('Supprimer cette matière et ses notes ?')) return;
    await run(supabase.from('matieres').delete().eq('id', id));
    charger(sel);
  }
  async function copier() {
    const src = prompt('Copier les matières depuis quelle classe ? Tapez son nom exact (ex. CE1)');
    const c = d.classes.find((x) => x.nom.toLowerCase() === (src || '').trim().toLowerCase());
    if (!c) { if (src) alert('Classe introuvable.'); return; }
    const r = ((await run(supabase.from('matieres').select('*').eq('classe_id', c.id))) as any[]) || [];
    if (!r.length) { alert('Cette classe n\'a pas de matières.'); return; }
    await run(supabase.from('matieres').insert(r.map((m) => ({ classe_id: sel, nom: m.nom, coef: m.coef }))));
    charger(sel);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-navy">Classes et frais annuels</h2>
        <form onSubmit={addClasse} className="card grid grid-cols-2 gap-2">
          <input className="input col-span-2" placeholder="Nom de la classe (ex. CM2 B)" required value={nc.nom} onChange={(e) => setNc({ ...nc, nom: e.target.value })} />
          <select className="input" value={nc.cycle} onChange={(e) => setNc({ ...nc, cycle: e.target.value })}><option>Maternelle</option><option>Primaire</option><option>Secondaire</option></select>
          <input className="input" placeholder="Frais annuels (F)" inputMode="numeric" value={nc.frais_annuels} onChange={(e) => setNc({ ...nc, frais_annuels: e.target.value.replace(/\D/g, '') })} />
          <button className="btn btn-primary col-span-2"><Plus size={16} />Ajouter la classe</button>
        </form>
        <div className="card divide-y divide-slate-100 !p-0">
          {d.classes.map((c) => (
            <div key={c.id} className={'flex items-center gap-2 px-3 py-2 ' + (sel === c.id ? 'bg-blue-50' : '')}>
              <button className="min-w-0 flex-1 text-left" onClick={() => setSel(c.id)}>
                <p className="font-bold">{c.nom}</p><p className="text-xs text-slate-500">{c.cycle} · {fcfa(c.frais_annuels)}</p>
              </button>
              <input className="input !w-28 !py-1.5" inputMode="numeric" placeholder="Frais" value={frais[c.id] ?? ''} onChange={(e) => setFrais({ ...frais, [c.id]: e.target.value.replace(/\D/g, '') })} />
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => saveFrais(c.id)} disabled={!(c.id in frais)}>OK</button>
              <button className="btn btn-danger !px-2 !py-1.5" onClick={() => delClasse(c.id, c.nom)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Pour changer les frais : tapez le montant à droite puis OK. Touchez une classe pour gérer ses matières.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-navy">Matières {sel && <span className="text-royal">· {d.classes.find((c) => c.id === sel)?.nom}</span>}</h2>
        {!sel ? <p className="card text-sm text-slate-500">Choisissez une classe à gauche.</p> : (
          <>
            <form onSubmit={addMat} className="card grid grid-cols-[1fr_5rem_auto] gap-2">
              <input className="input" placeholder="Matière (ex. Mathématiques)" required value={nm.nom} onChange={(e) => setNm({ ...nm, nom: e.target.value })} />
              <input className="input" placeholder="Coef" inputMode="decimal" value={nm.coef} onChange={(e) => setNm({ ...nm, coef: e.target.value })} />
              <button className="btn btn-primary"><Plus size={16} /></button>
            </form>
            <button className="btn btn-ghost w-full" onClick={copier}>Copier les matières d'une autre classe</button>
            <div className="card divide-y divide-slate-100 !p-0">
              {mats.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2"><span className="font-bold">{m.nom}</span><span className="text-sm text-slate-500">coef {m.coef}</span>
                  <button className="btn btn-danger !px-2 !py-1.5" onClick={() => delMat(m.id)}><Trash2 size={15} /></button></div>
              ))}
              {!mats.length && <p className="px-3 py-3 text-sm text-slate-500">Aucune matière pour cette classe.</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
