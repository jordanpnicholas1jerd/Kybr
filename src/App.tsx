import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { NavTray, TABS, type Tab } from './components/NavTray';
import { Toast } from './components/Toast';
import {
  createApi, formatDub,
  type Burn, type Crew, type CrewDeck, type Dub, type Etch as EtchT, type KeptDisc, type Profile, type Service, type Session, type Track,
} from './data';
import { DEMO_DUBS } from './data/demo';
import { Burn as BurnOverlay } from './overlays/Burn';
import { Etch } from './overlays/Etch';
import { Plyr } from './overlays/Plyr';
import { AnsweringMachine, type MachineStage } from './screens/AnsweringMachine';
import { Case, CASE_SCREEN } from './screens/Case';
import { Chnl, CHNL_SCREEN } from './screens/Chnl';
import { Ctrl, CTRL_SCREEN } from './screens/Ctrl';
import { Deck, DECK_SCREEN } from './screens/Deck';
import { Wire, WIRE_SCREEN, WIRE_SHELL, type WireRow } from './screens/Wire';
import { DEFAULT_SKIN, SKINS, type SkinKey } from './theme/skins';

type Boot =
  | { k: 'loading' }
  | { k: 'ready'; session: Session | null; profile: Profile | null; crews: Crew[] };

/** What PLYR is stepping through. */
interface Queue {
  burns: Burn[];
  i: number;
  context: (b: Burn) => string;
  back: string;
}

type Overlay =
  | { k: 'plyr'; q: Queue }
  | { k: 'etch'; q: Queue }
  | { k: 'burn' }
  | null;

const SCREENS: Record<Tab, { bg: string; status: string; nav?: string }> = {
  wire: { bg: WIRE_SCREEN, status: '#3a2f52' },
  chnl: { bg: CHNL_SCREEN, status: 'rgba(233,228,240,.6)' },
  deck: { bg: DECK_SCREEN, status: 'rgba(233,228,240,.6)' },
  case: { bg: CASE_SCREEN, status: 'rgba(233,228,240,.6)' },
  ctrl: { bg: CTRL_SCREEN, status: '#15315c', nav: '#c0c0c0' },
};

const RECENT_KEY = 'kybr.recent';
function readRecent(): Track[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function pushRecent(t: Track) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([t, ...readRecent().filter((x) => x.id !== t.id)].slice(0, 6))); } catch { /* storage off */ }
}

export function App() {
  const api = useMemo(createApi, []);
  const [boot, setBoot] = useState<Boot>({ k: 'loading' });
  const [skinKey, setSkinKey] = useState<SkinKey>(DEFAULT_SKIN);
  const [service, setService] = useState<Service>('link');
  // The answering machine stays up after starting/joining a crew until GO TO WIRE,
  // and CTRL can reopen it to start or join another.
  const [onboarding, setOnboarding] = useState(false);
  const [machineEntry, setMachineEntry] = useState<'naming' | 'dubbing' | null>(null);

  const [tab, setTab] = useState<Tab>('wire');
  const [crewId, setCrewId] = useState('');
  const [wireSel, setWireSel] = useState(0);
  const [cursor, setCursor] = useState(0);

  const [wire, setWire] = useState<WireRow[]>([]);
  const [deck, setDeck] = useState<CrewDeck | null>(null);
  const [week, setWeek] = useState<Burn[]>([]);
  const [kept, setKept] = useState<KeptDisc[]>([]);
  const [loading, setLoading] = useState({ wire: true, case: true });

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [etches, setEtches] = useState<EtchT[] | null>(null);
  const [toast, setToast] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);

  const skin = SKINS[skinKey];
  const ready = boot.k === 'ready' ? boot : null;
  const crews = ready?.crews ?? [];
  const me = ready?.profile ?? null;
  const meId = me?.id ?? '';

  const say = useCallback((t: string) => {
    setToast(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 2600);
  }, []);

  // ---- boot -------------------------------------------------------------------
  useEffect(() => {
    let live = true;
    const load = async (session: Session | null) => {
      if (!session) { if (live) setBoot({ k: 'ready', session: null, profile: null, crews: [] }); return; }
      const profile = await api.me();
      const crews = profile ? await api.myCrews() : [];
      if (profile) {
        const s = await api.settings();
        setSkinKey(s.skin);
        setService(s.preferredService);
      }
      if (live) setBoot({ k: 'ready', session, profile, crews });
    };
    api.session().then(load).catch(() => load(null));
    const off = api.onSessionChange((s) => { load(s).catch(() => {}); });
    return () => { live = false; off(); };
  }, [api]);

  useEffect(() => {
    if (crews.length && !crews.some((c) => c.id === crewId)) setCrewId(crews[0].id);
  }, [crews, crewId]);

  // ---- data -------------------------------------------------------------------
  const loadWire = useCallback(async () => {
    const burns = await api.wire(5);
    let rows: WireRow[] = burns.map((burn) => ({ kind: 'burn', burn }));
    // This Week: the weekly mix of whichever crew burned most recently.
    if (burns[0]) {
      const wk = await api.thisWeek(burns[0].crewId);
      if (wk.length) {
        rows = [rows[0], { kind: 'week' as const, crewId: burns[0].crewId, crewName: burns[0].crewName, burns: wk }, ...rows.slice(1)].slice(0, 5);
      }
    }
    setWire(rows);
    setLoading((l) => ({ ...l, wire: false }));
  }, [api]);

  const loadDeck = useCallback(async (id: string) => {
    if (!id) return;
    const [d, wk] = await Promise.all([api.deck(id), api.thisWeek(id)]);
    setDeck(d);
    setWeek(wk);
  }, [api]);

  const loadKept = useCallback(async () => {
    setKept(await api.kept());
    setLoading((l) => ({ ...l, case: false }));
  }, [api]);

  const inApp = !!(ready?.session && me && crews.length && !onboarding && !machineEntry);

  const refresh = useCallback(() => {
    if (!inApp) return;
    if (tab === 'wire') loadWire().catch(() => {});
    if (tab === 'chnl') loadDeck(crewId).catch(() => {});
    if (tab === 'case') loadKept().catch(() => {});
  }, [inApp, tab, crewId, loadWire, loadDeck, loadKept]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setCursor(0); }, [crewId]);
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, [refresh]);
  // Kept list is needed by ETCH's keep switch wherever PLYR was opened.
  useEffect(() => { if (inApp) loadKept().catch(() => {}); }, [inApp, loadKept]);

  // Etches for whatever PLYR / ETCH is showing.
  const current = overlay && overlay.k !== 'burn' ? overlay.q.burns[overlay.q.i] : null;
  useEffect(() => {
    setEtches(null);
    if (!current) return;
    let live = true;
    api.etches(current.id).then((e) => live && setEtches(e)).catch(() => live && setEtches([]));
    return () => { live = false; };
  }, [api, current?.id]);

  // ---- actions ----------------------------------------------------------------
  const goTab = (t: Tab) => { setOverlay(null); setTab(t); };
  const openPlyr = (q: Queue) => setOverlay({ k: 'plyr', q });

  const openWireRow = (i: number) => {
    const r = wire[i];
    if (!r) return;
    if (r.kind === 'week') {
      openPlyr({ burns: r.burns, i: 0, context: () => `${r.crewName}'s this week`, back: 'WIRE' });
    } else {
      const burns = wire.flatMap((x) => (x.kind === 'burn' ? [x.burn] : []));
      openPlyr({ burns, i: burns.findIndex((b) => b.id === r.burn.id), context: () => 'from WIRE', back: 'WIRE' });
    }
  };

  const openLink = (url: string) => {
    if (current) pushRecent(current.track);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const pickSkin = (k: SkinKey) => {
    setSkinKey(k);
    api.saveSettings({ skin: k }).catch(() => say("couldn't save your skin"));
  };

  const shareDub = async (crew: Crew, dub: Dub) => {
    const text = `you're dubbed into ${crew.name} on KYBR. dub: ${formatDub(dub.code)}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'KYBR', text, url: window.location.origin }); return; }
      await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
      say('dub copied · paste it to a friend');
    } catch { /* share sheet dismissed */ }
  };

  const mintAndShare = async () => {
    const crew = crews.find((c) => c.id === crewId);
    if (!crew) return;
    try {
      const dub = await api.mintDub(crew.id);
      say(`new dub for ${crew.name}: ${formatDub(dub.code)}`);
      await shareDub(crew, dub);
    } catch { say("couldn't make a dub"); }
  };

  const setCrews = (next: Crew[]) => ready && setBoot({ ...ready, crews: next });

  // ---- keyboard: the Game Boy -------------------------------------------------
  useEffect(() => {
    if (!inApp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOverlay(null); return; }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (tab !== 'wire' || overlay) return;
      const n = wire.length;
      if (!n) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); setWireSel((s) => (s - 1 + n) % n); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setWireSel((s) => (s + 1) % n); }
      else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') openWireRow(wireSel);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- render -----------------------------------------------------------------
  if (boot.k === 'loading') return null;

  const stage: MachineStage | null =
    !boot.session ? 'signin' : !boot.profile ? 'greeting' : crews.length === 0 || onboarding || machineEntry ? 'messages' : null;

  if (stage) {
    return (
      <AnsweringMachine
        api={api}
        skin={skin}
        stage={stage}
        entry={machineEntry ?? undefined}
        onCancel={machineEntry && crews.length ? () => setMachineEntry(null) : undefined}
        onProfile={(p) => setBoot({ ...boot, profile: p })}
        onCrew={(c) => { setOnboarding(true); setCrews([...crews.filter((x) => x.id !== c.id), c]); setCrewId(c.id); }}
        onDone={() => { setOnboarding(false); setMachineEntry(null); setTab('wire'); setWireSel(0); }}
        demoHint={api.mode === 'demo' ? <DemoHint /> : undefined}
      />
    );
  }

  const scr = SCREENS[tab];
  const q = overlay && overlay.k !== 'burn' ? overlay.q : null;
  const keptIds = new Set(kept.map((k) => k.burn.id));

  return (
    <DeviceFrame skin={skin} screenBg={scr.bg} statusFg={scr.status} shell={tab === 'wire' ? WIRE_SHELL : undefined}>
      {tab === 'wire' && (
        <Wire skin={skin} rows={wire} sel={Math.min(wireSel, Math.max(0, wire.length - 1))} meId={meId} loading={loading.wire}
          onSel={setWireSel} onOpen={openWireRow} onStart={() => setOverlay({ k: 'burn' })}
          onNextTab={() => goTab(TABS[(TABS.indexOf(tab) + 1) % TABS.length])} onBack={() => setOverlay(null)} />
      )}
      {tab === 'chnl' && (
        <Chnl skin={skin} crews={crews} crewId={crewId} deck={deck?.id === crewId ? deck : null} cursor={cursor} weekCount={week.length}
          onPickCrew={setCrewId} onCursor={setCursor}
          onOpen={(i) => deck && openPlyr({ burns: deck.burns, i, context: (b) => `in ${b.crewName}`, back: 'CHNL' })}
          onThisWeek={() => week.length && openPlyr({ burns: week, i: 0, context: (b) => `${b.crewName}'s this week`, back: 'CHNL' })}
          onDub={mintAndShare} />
      )}
      {tab === 'deck' && me && <Deck profile={me} />}
      {tab === 'case' && (
        <Case skin={skin} discs={kept} meId={meId} loading={loading.case} onSkin={pickSkin}
          onPlay={(i) => kept[i] && openPlyr({ burns: kept.map((k) => k.burn), i, context: () => 'saved in CASE', back: 'CASE' })} />
      )}
      {tab === 'ctrl' && me && (
        <Ctrl skin={skin} profile={me} email={boot.session?.email ?? null} crews={crews} service={service}
          onSkin={pickSkin}
          onService={(s) => { setService(s); api.saveSettings({ preferredService: s }).catch(() => say("couldn't save that")); }}
          onMintDub={(id) => api.mintDub(id)}
          onShareDub={shareDub}
          onLeave={async (id) => { await api.leaveCrew(id); setCrews(crews.filter((c) => c.id !== id)); setKept((k) => k.filter((d) => d.burn.crewId !== id)); }}
          onStartCrew={() => setMachineEntry('naming')}
          onEnterDub={() => setMachineEntry('dubbing')}
          onSignOut={async () => { await api.signOut(); setOverlay(null); setTab('wire'); setBoot({ k: 'ready', session: api.mode === 'demo' ? boot.session : null, profile: api.mode === 'demo' ? me : null, crews: [] }); }}
          onOpenCase={() => goTab('case')} onOpenWire={() => goTab('wire')} />
      )}

      <NavTray active={tab} skin={skin} onSelect={goTab} ground={scr.nav} />

      {overlay?.k === 'plyr' && q && (
        <Plyr skin={skin} burn={q.burns[q.i]} context={q.context(q.burns[q.i])} backLabel={q.back} meId={meId} etches={etches} service={service}
          onClose={() => setOverlay(null)}
          canStep={q.burns.length > 1}
          onStep={(d) => setOverlay({ k: 'plyr', q: { ...q, i: (q.i + d + q.burns.length) % q.burns.length } })}
          onEtch={() => setOverlay({ k: 'etch', q })}
          onOpenLink={openLink} />
      )}
      {overlay?.k === 'etch' && q && (
        <Etch skin={skin} burn={q.burns[q.i]}
          mine={etches?.find((e) => e.by.id === meId) ?? null}
          theirs={etches?.find((e) => e.by.id !== meId) ?? null}
          alreadyKept={keptIds.has(q.burns[q.i].id)}
          onCancel={() => setOverlay({ k: 'plyr', q })}
          onSave={async (heat, note, keep) => {
            const b = q.burns[q.i];
            await api.etch(b.id, heat, note || null);
            const was = keptIds.has(b.id);
            if (keep && !was) await api.keep(b.id);
            if (!keep && was) await api.unkeep(b.id);
            await loadKept();
            setEtches(await api.etches(b.id));
            setOverlay({ k: 'plyr', q });
            say(keep && !was ? 'etched · kept in your case' : !keep && was ? 'etched · taken out of your case' : 'etched');
          }} />
      )}
      {overlay?.k === 'burn' && (
        <BurnOverlay api={api} crews={crews} defaultCrewId={crewId} recent={readRecent()}
          onClose={() => setOverlay(null)}
          onBurned={() => { setWireSel(0); loadWire().catch(() => {}); if (crewId) loadDeck(crewId).catch(() => {}); }}
          onSeeWire={() => { setOverlay(null); setTab('wire'); setWireSel(0); }} />
      )}

      <Toast text={toast} />
    </DeviceFrame>
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
