import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarCheck, GraduationCap, LayoutDashboard, LogOut, Mail, Megaphone, School, UserCog, Users, Wallet } from 'lucide-react';
import { Logo } from '@/components/Site';
import { supabase, configured } from '@/lib/supabase';
import { fetchAll, type Classe, type Eleve, type Paiement } from '@/lib/admin';
import { fcfa } from '@/lib/format';
import { Eleves } from '@/components/admin/Eleves';
import { Classes } from '@/components/admin/Classes';
import { Notes } from '@/components/admin/Notes';
import { Paiements } from '@/components/admin/Paiements';
import { Personnel } from '@/components/admin/Personnel';
import { Presences } from '@/components/admin/Presences';
import { Annonces, Messages } from '@/components/admin/Divers';

export type Data = { classes: Classe[]; eleves: Eleve[]; paiements: Paiement[]; reload: () => Promise<void> };

const TABS = [
  ['accueil', 'Tableau de bord', LayoutDashboard],
  ['eleves', 'Élèves', GraduationCap],
  ['classes', 'Classes et matières', School],
  ['notes', 'Notes et bulletins', BookOpen],
  ['paiements', 'Scolarité', Wallet],
  ['personnel', 'Personnel', UserCog],
  ['presences', 'Présences', CalendarCheck],
  ['annonces', 'Annonces', Megaphone],
  ['messages', 'Messages', Mail],
] as const;

function Login({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setLoad(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) { setErr(error.message === 'Email not confirmed' ? "E-mail non confirmé : dans Supabase, ouvrez l'utilisateur et confirmez-le." : error.message === 'Invalid login credentials' ? "E-mail ou mot de passe incorrect, ou utilisateur inexistant dans Supabase (Authentication > Users)." : 'Connexion impossible : ' + error.message); setLoad(false); return; }
    const { data } = await supabase.rpc('est_admin');
    setLoad(false);
    if (!data) { await supabase.auth.signOut(); setErr("Ce compte n'a pas accès à l'espace Direction."); return; }
    onOk();
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist p-4">
      <form onSubmit={go} className="card w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3"><Logo size={52} /><div><h1 className="font-display text-xl font-extrabold text-navy">Espace Direction</h1><p className="text-xs text-slate-500">Accès réservé</p></div></div>
        {!configured && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Base de données non connectée (variables Supabase manquantes).</p>}
        <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <input className="input" type="password" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />
        <button className="btn btn-primary w-full" disabled={load}>{load ? 'Connexion…' : 'Se connecter'}</button>
        {err && <p className="text-sm font-bold text-red-700">{err}</p>}
        <a href="#top" className="block text-center text-xs font-bold text-royal">← Retour au site</a>
      </form>
    </div>
  );
}

function Accueil({ d, go }: { d: Data; go: (t: string) => void }) {
  const encaisse = d.paiements.reduce((s, p) => s + p.montant, 0);
  const frais = (e: Eleve) => d.classes.find((c) => c.id === e.classe_id)?.frais_annuels || 0;
  const du = d.eleves.filter((e) => e.actif).reduce((s, e) => s + frais(e), 0);
  const cartes = [
    ['Élèves inscrits', String(d.eleves.filter((e) => e.actif).length), 'eleves', Users],
    ['Classes', String(d.classes.length), 'classes', School],
    ['Encaissé', fcfa(encaisse), 'paiements', Wallet],
    ['Reste à encaisser', fcfa(Math.max(0, du - encaisse)), 'paiements', Wallet],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartes.map(([l, v, t, I]) => (
          <button key={l} onClick={() => go(t)} className="card text-left transition hover:border-royal">
            <I size={20} className="text-royal" /><p className="mt-2 text-xs font-bold text-slate-500">{l}</p><p className="font-display text-2xl font-extrabold text-navy">{v}</p>
          </button>
        ))}
      </div>
      <div className="card text-sm text-slate-600">
        <p className="font-display text-lg font-bold text-navy">Pour commencer</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>Dans <b>Classes et matières</b> : réglez les frais annuels de chaque classe et ajoutez les matières avec leurs coefficients.</li>
          <li>Dans <b>Élèves</b> : inscrivez les élèves. Le matricule et le code parent sont créés automatiquement.</li>
          <li>Donnez aux parents le matricule et le code : ils suivent notes, paiements et présences sur l'<b>Espace parents</b>.</li>
        </ol>
      </div>
    </div>
  );
}

export default function Direction() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [tab, setTab] = useState<string>('accueil');
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  const reload = useCallback(async () => {
    const [c, e, p] = await Promise.all([fetchAll('classes', 'ordre'), fetchAll('eleves', 'nom'), fetchAll('paiements', 'created_at')]);
    setClasses(c); setEleves(e); setPaiements(p);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { setOk(false); return; }
      const { data } = await supabase.rpc('est_admin');
      if (!data) { await supabase.auth.signOut(); setOk(false); return; }
      setOk(true);
    })();
  }, []);
  useEffect(() => { if (ok) reload(); }, [ok, reload]);

  if (ok === null) return <div className="p-8 text-center text-slate-500">Chargement…</div>;
  if (!ok) return <Login onOk={() => setOk(true)} />;

  const d: Data = { classes, eleves, paiements, reload };
  return (
    <div className="min-h-screen bg-mist">
      <header className="no-print sticky top-0 z-30 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <a href="#top" className="rounded-lg p-1.5 hover:bg-white/10"><ArrowLeft size={20} /></a>
          <Logo size={34} />
          <p className="font-display font-extrabold leading-tight">Espace Direction</p>
          <button className="btn ml-auto !py-1.5 text-white hover:bg-white/10" onClick={async () => { await supabase.auth.signOut(); setOk(false); }}><LogOut size={16} /><span className="hidden sm:inline">Quitter</span></button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ' + (tab === k ? 'bg-white text-navy' : 'text-blue-100 hover:bg-white/10')}><I size={15} />{l}</button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        {tab === 'accueil' && <Accueil d={d} go={setTab} />}
        {tab === 'eleves' && <Eleves d={d} />}
        {tab === 'classes' && <Classes d={d} />}
        {tab === 'notes' && <Notes d={d} />}
        {tab === 'paiements' && <Paiements d={d} />}
        {tab === 'personnel' && <Personnel />}
        {tab === 'presences' && <Presences d={d} />}
        {tab === 'annonces' && <Annonces />}
        {tab === 'messages' && <Messages />}
      </main>
    </div>
  );
}
