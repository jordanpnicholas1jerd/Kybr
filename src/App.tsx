import { useEffect, useMemo, useState } from 'react';
import { createApi, formatDub, type Crew, type Profile, type Session } from './data';
import { DEMO_DUBS } from './data/demo';
import type { Tab } from './components/NavTray';
import { AnsweringMachine, type MachineStage } from './screens/AnsweringMachine';
import { NotBuiltYet } from './screens/NotBuiltYet';
import { DEFAULT_SKIN, SKINS, type SkinKey } from './theme/skins';

type Boot =
  | { k: 'loading' }
  | { k: 'ready'; session: Session | null; profile: Profile | null; crews: Crew[] };

export function App() {
  const api = useMemo(createApi, []);
  const [boot, setBoot] = useState<Boot>({ k: 'loading' });
  const [skinKey, setSkinKey] = useState<SkinKey>(DEFAULT_SKIN);
  // Stay on the answering machine after starting/joining a crew until GO TO WIRE.
  const [onboarding, setOnboarding] = useState(false);
  const [tab, setTab] = useState<Tab>('wire');
  const skin = SKINS[skinKey];

  useEffect(() => {
    let live = true;
    const load = async (session: Session | null) => {
      if (!session) { if (live) setBoot({ k: 'ready', session: null, profile: null, crews: [] }); return; }
      const profile = await api.me();
      const crews = profile ? await api.myCrews() : [];
      if (profile) setSkinKey(await api.skin());
      if (live) setBoot({ k: 'ready', session, profile, crews });
    };
    api.session().then(load).catch(() => load(null));
    const off = api.onSessionChange((s) => { load(s).catch(() => {}); });
    return () => { live = false; off(); };
  }, [api]);

  if (boot.k === 'loading') return null;

  const { session, profile, crews } = boot;
  const stage: MachineStage | null =
    !session ? 'signin' : !profile ? 'greeting' : crews.length === 0 || onboarding ? 'messages' : null;

  if (stage) {
    return (
      <AnsweringMachine
        api={api}
        skin={skin}
        stage={stage}
        onProfile={(p) => setBoot({ ...boot, profile: p })}
        onCrew={(c) => { setOnboarding(true); setBoot({ ...boot, crews: [...crews.filter((x) => x.id !== c.id), c] }); }}
        onDone={() => { setOnboarding(false); setTab('wire'); }}
        demoHint={api.mode === 'demo' ? <DemoHint /> : undefined}
      />
    );
  }

  return (
    <NotBuiltYet
      tab={tab}
      skin={skin}
      onTab={setTab}
      onSignOut={async () => { await api.signOut(); setBoot({ k: 'ready', session: api.mode === 'demo' ? session : null, profile: api.mode === 'demo' ? profile : null, crews: [] }); }}
    />
  );
}

function DemoHint() {
  const codes = Object.keys(DEMO_DUBS);
  return (
    <>
      <div style={{ letterSpacing: 1.5 }}>DEMO MODE · NOTHING IS SAVED</div>
      <div>dubs to try: {codes.slice(0, 3).map(formatDub).join(' · ')}</div>
      <div>{formatDub(codes[3])} is full · {formatDub(codes[4])} is used · {formatDub(codes[5])} ran out</div>
    </>
  );
}
