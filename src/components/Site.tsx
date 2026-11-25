import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Check, Download, FileText, GraduationCap, Mail, MapPin, Menu, MessageCircle, Phone, Send, ShieldCheck, Users, X } from 'lucide-react';
import { ECOLE, tel, wa } from '@/lib/ecole';
import { supabase, configured } from '@/lib/supabase';
import { dateFr } from '@/lib/format';

const NAV = [
  ['#ecole', "L'école"],
  ['#cycles', 'Cycles'],
  ['#galerie', 'Galerie'],
  ['#contact', 'Contact'],
];

export function Logo({ size = 44 }: { size?: number }) {
  return <img src="/logo.png" alt="Logo Les Génies de Tankpè" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 object-contain" />;
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <a href="#top" className="flex min-w-0 items-center gap-2.5">
          <Logo size={42} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[15px] font-extrabold text-navy">Les Génies de Tankpè</span>
            <span className="block truncate text-[11px] font-semibold text-slate-500">Complexe Scolaire</span>
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {NAV.map(([h, l]) => <a key={h} href={h} className="text-sm font-bold text-slate-600 hover:text-royal">{l}</a>)}
          <a href="#/parents" className="btn btn-primary !py-2">Espace parents</a>
        </nav>
        <button className="ml-auto rounded-lg p-2 text-navy md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 md:hidden">
          {NAV.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block border-b border-slate-100 py-3 font-bold text-slate-700">{l}</a>)}
          <a href="#/parents" className="btn btn-primary mt-3 w-full">Espace parents</a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(/img/batiment.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
        <div className="min-w-0">
          <p className="mb-3 inline-block rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-navy">Inscriptions ouvertes · {ECOLE.annee}</p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            Complexe Scolaire<br /><span className="text-gold">Les Génies de Tankpè</span>
          </h1>
          <p className="mt-4 font-display text-lg italic text-blue-100">{ECOLE.devise.join(' · ')}</p>
          <p className="mt-3 max-w-md text-sm text-blue-100">De la maternelle à la terminale, un encadrement sérieux pour que chaque enfant révèle son talent.</p>
          <div className="mt-6 grid max-w-md grid-cols-2 gap-2.5">
            <a href="#cycles" className="btn btn-gold">Inscrire mon enfant</a>
            <a href="#/parents" className="btn border border-white/40 text-white hover:bg-white/10">Espace parents</a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-blue-100">
            <span className="flex items-center gap-1.5"><MapPin size={15} className="text-gold" />Parana-Tankpè, Abomey-Calavi</span>
            <a href={'tel:' + tel(ECOLE.telephones[0])} className="flex items-center gap-1.5"><Phone size={15} className="text-gold" />{ECOLE.telephones[0]}</a>
          </div>
        </div>
        <div className="relative min-w-0">
          <img src="/img/groupe.jpg" alt="Élèves et enseignants devant l'école" className="aspect-[4/3] w-full rounded-3xl border-4 border-white/90 object-cover shadow-2xl" />
          <img src="/logo.png" alt="" className="absolute -bottom-5 -left-3 h-20 w-20 rounded-full bg-white p-1 shadow-xl sm:-left-6 sm:h-24 sm:w-24" />
        </div>
      </div>
    </section>
  );
}

function Annonces() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!configured) return;
    supabase.from('annonces').select('*').order('jour', { ascending: false }).limit(3).then(({ data }) => setRows(data || []));
  }, []);
  if (!rows.length) return null;
  return (
    <section className="bg-gold/15">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold text-navy"><CalendarDays size={20} />Annonces de l'école</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {rows.map((a) => (
            <article key={a.id} className="card">
              <p className="text-xs font-bold text-royal">{dateFr(a.jour)}</p>
              <h3 className="font-display text-lg font-bold leading-tight text-navy">{a.titre}</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.texte}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Ecole() {
  return (
    <section id="ecole" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <img src="/img/classe1.jpg" alt="Enseignant en classe" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg" loading="lazy" />
        <div>
          <h2 className="font-display text-3xl font-extrabold text-navy">Le mot du Directeur</h2>
          <p className="mt-3 leading-relaxed text-slate-600">{ECOLE.motDirecteur}</p>
          <p className="mt-3 font-display font-bold text-royal">{ECOLE.directeur}</p>
        </div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {ECOLE.valeurs.map((v, i) => {
          const I = [ShieldCheck, BookOpen, GraduationCap][i];
          return (
            <div key={v.t} className="card">
              <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-royal text-white"><I size={22} /></span>
              <h3 className="font-display text-xl font-bold text-navy">{v.t}</h3>
              <p className="text-sm text-slate-600">{v.d}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Cycles() {
  return (
    <section id="cycles" className="scroll-mt-16 bg-mist py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-extrabold text-navy">Nos cycles</h2>
        <p className="mt-1 text-slate-600">Un parcours complet, de la maternelle à la terminale.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {ECOLE.cycles.map((c) => (
            <article key={c.t} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={c.img} alt={c.t} className="aspect-[16/10] w-full object-cover" loading="lazy" />
              <div className="p-4">
                <h3 className="font-display text-2xl font-extrabold text-navy">{c.t}</h3>
                <p className="text-sm font-bold text-royal">{c.n}</p>
                <p className="mt-1 text-sm text-slate-600">{c.d}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="card">
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-navy"><FileText size={18} />Dossiers à fournir</h3>
            <ul className="space-y-1.5 text-sm">
              {ECOLE.dossiers.map((d) => <li key={d} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{d}</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 className="mb-2 font-display text-lg font-bold text-navy">Frais de scolarité</h3>
            <div className="divide-y divide-slate-100 text-sm">
              {ECOLE.frais.map((f) => <div key={f.n} className="py-2"><p className="font-bold">{f.n}</p><p className="text-slate-500">{f.m}</p></div>)}
            </div>
            <h3 className="mb-1 mt-3 font-display text-lg font-bold text-navy">Échéances</h3>
            <div className="divide-y divide-slate-100 text-sm">
              {ECOLE.echeances.map((e) => <div key={e.t} className="flex justify-between py-1.5"><span className="font-bold">{e.t}</span><span className="text-slate-600">{e.q}</span></div>)}
            </div>
          </div>
          <div className="flex flex-col rounded-2xl bg-navy p-4 text-white">
            <h3 className="font-display text-lg font-bold text-gold">Réductions spéciales</h3>
            <ul className="mt-2 space-y-1 text-sm">{ECOLE.reductions.map((r) => <li key={r}>• {r}</li>)}</ul>
            <a href={ECOLE.fiche} download className="btn btn-gold mt-auto !mt-5"><Download size={17} />Télécharger la fiche (PDF)</a>
            <p className="mt-2 text-center text-xs text-blue-200">Cycles, dossiers, frais et échéances.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Galerie() {
  const [big, setBig] = useState<string | null>(null);
  const liste = [...ECOLE.galerie, ...ECOLE.galerie];
  return (
    <section id="galerie" className="scroll-mt-16 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl font-extrabold text-navy">La vie à l'école</h2>
        <p className="mt-1 text-slate-600">Classes, sorties éducatives et sport : un aperçu de nos journées.</p>
      </div>
      <div className="mt-6 overflow-hidden">
        <div className="defile flex w-max gap-4 px-2">
          {liste.map((p, i) => (
            <button key={i} onClick={() => setBig(p.src)} className="group relative h-56 w-80 shrink-0 overflow-hidden rounded-2xl sm:h-64 sm:w-96">
              <img src={p.src} alt={p.l} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
              <span className="absolute bottom-2 left-2 rounded-full bg-navy/80 px-3 py-1 text-xs font-bold text-white">{p.l}</span>
            </button>
          ))}
        </div>
      </div>
      {big && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setBig(null)}>
          <img src={big} alt="" className="max-h-full max-w-full rounded-xl" />
          <button className="absolute right-4 top-4 rounded-full bg-white p-2"><X size={20} /></button>
        </div>
      )}
    </section>
  );
}

function Contact() {
  const [f, setF] = useState({ nom: '', telephone: '', texte: '' });
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'err'>('');
  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEtat('envoi');
    const { error } = await supabase.from('messages').insert(f);
    if (error) { setEtat('err'); return; }
    setEtat('ok'); setF({ nom: '', telephone: '', texte: '' });
  }
  return (
    <section id="contact" className="scroll-mt-16 bg-navy py-14 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold">Nous contacter</h2>
          <p className="mt-2 text-blue-100">Une question sur les inscriptions, les frais ou la rentrée ? Appelez-nous ou écrivez-nous.</p>
          <div className="mt-5 space-y-3">
            {ECOLE.telephones.map((t) => (
              <div key={t} className="flex flex-wrap items-center gap-2">
                <a href={'tel:' + tel(t)} className="btn btn-gold"><Phone size={16} />{t}</a>
                <a href={wa(t)} className="btn border border-white/40 text-white hover:bg-white/10" target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a>
              </div>
            ))}
            <p className="flex items-start gap-2 text-sm text-blue-100"><MapPin size={18} className="mt-0.5 shrink-0 text-gold" />{ECOLE.adresse}</p>
            <a className="inline-block text-sm font-bold text-gold underline" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=Parana+Tankp%C3%A8+Abomey-Calavi">Voir sur la carte</a>
          </div>
        </div>
        <form onSubmit={envoyer} className="space-y-3 rounded-2xl bg-white p-5 text-slate-800">
          <h3 className="flex items-center gap-2 font-display text-xl font-bold text-navy"><Mail size={18} />Envoyer un message</h3>
          <input className="input" placeholder="Votre nom" required minLength={2} value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
          <input className="input" placeholder="Votre téléphone" required minLength={6} inputMode="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} />
          <textarea className="input min-h-[110px]" placeholder="Votre message" required minLength={2} value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} />
          <button className="btn btn-primary w-full" disabled={etat === 'envoi'}><Send size={16} />{etat === 'envoi' ? 'Envoi…' : 'Envoyer'}</button>
          {etat === 'ok' && <p className="text-sm font-bold text-emerald-700">Merci, message envoyé. L'école vous rappelle.</p>}
          {etat === 'err' && <p className="text-sm font-bold text-red-700">Envoi impossible. Appelez-nous directement.</p>}
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 py-6 text-center text-xs text-slate-400">
      <p>© {new Date().getFullYear()} {ECOLE.nom} · {ECOLE.adresse}</p>
      <p className="mt-1"><a href="#/direction" className="inline-flex items-center gap-1 hover:text-white"><Users size={12} />Espace Direction</a></p>
    </footer>
  );
}

export default function Site() {
  return (
    <div>
      <Header />
      <Hero />
      <Annonces />
      <Ecole />
      <Cycles />
      <Galerie />
      <Contact />
      <Footer />
    </div>
  );
}
