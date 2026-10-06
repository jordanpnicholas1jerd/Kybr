import { DeviceFrame } from '../components/DeviceFrame';
import { NavTray, type Tab } from '../components/NavTray';
import { ChromeText } from '../components/Chrome';
import type { Skin } from '../theme/skins';

const DEVICES: Record<Tab, string> = {
  wire: 'game boy color',
  chnl: 'hi-fi component rack',
  deck: 'record sleeve + chrome radio',
  case: 'cd binder',
  ctrl: 'windows 98 control panel',
};

/** Placeholder for tabs that come after the first-run checkpoint. */
export function NotBuiltYet({ tab, skin, onTab, onSignOut }: { tab: Tab; skin: Skin; onTab: (t: Tab) => void; onSignOut: () => void }) {
  return (
    <DeviceFrame skin={skin} screenBg="radial-gradient(130% 80% at 12% -10%,#2b2236,#1a1622 52%)">
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 'var(--safe-top) 24px 0', textAlign: 'center' }}>
        <ChromeText style={{ fontSize: 22, letterSpacing: 4 }}>{tab.toUpperCase()}</ChromeText>
        <div style={{ fontSize: 11, color: 'rgba(233,228,240,.7)' }}>the {DEVICES[tab]} goes here.</div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'rgba(233,228,240,.5)' }}>NOT BUILT YET</div>
        {tab === 'ctrl' && (
          <button type="button" onClick={onSignOut} style={{ marginTop: 14, minHeight: 44, padding: '0 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: '#241f2c', color: '#e9e4f0', fontSize: 10, letterSpacing: 1.5, cursor: 'pointer' }}>SIGN OUT</button>
        )}
      </main>
      <NavTray active={tab} skin={skin} onSelect={onTab} />
    </DeviceFrame>
  );
}
