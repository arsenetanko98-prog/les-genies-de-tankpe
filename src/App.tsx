import { useEffect, useState } from 'react';
import Site from '@/components/Site';
import Parents from '@/components/Parents';
import Direction from '@/components/Direction';

const route = () => (location.hash.startsWith('#/parents') ? 'parents' : location.hash.startsWith('#/direction') ? 'direction' : 'site');

export default function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const f = () => { setR(route()); if (route() !== 'site') window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  if (r === 'parents') return <Parents />;
  if (r === 'direction') return <Direction />;
  return <Site />;
}
