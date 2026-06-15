import React, { useState } from 'react';
import { EmotionProvider } from './context/EmotionContext';
import { useEmotion } from './hooks/useEmotion';
import MoleculeCanvas from './components/MoleculeCanvas';
import AmorphousBackground from './components/AmorphousBackground';
import { useThemeManager } from './hooks/useThemeManager';

import type { Emotions } from './types/emotion';

const EmotionStats: React.FC<{ emotions: Emotions }> = React.memo(({ emotions }) => {
  return (
    <div className="glass-card stats-grid">
      {Object.entries(emotions).map(([name, value]) => (
        <div key={name} className="stat-item">
          <span className="stat-label">{name.toUpperCase()}</span>
          <div className="stat-bar">
            <div
              className="stat-fill"
              style={{
                width: `${value * 100}%`,
                backgroundColor: `var(--color-${name === 'neutral' ? 'peach' : name === 'surprised' ? 'purple' : name === 'sad' ? 'blue' : name === 'angry' ? 'coral' : 'yellow'})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

const DebugPanel: React.FC<{ isReady: boolean; videoRef: React.RefObject<HTMLVideoElement | null> }> = React.memo(({ isReady, videoRef }) => {
  if (!isReady) return null;

  return (
    <div className="glass-card" style={{ position: 'absolute', top: 20, right: 20, width: 180, zIndex: 100, padding: 8 }}>
      <video
        ref={(el) => {
          if (el && videoRef.current) el.srcObject = videoRef.current.srcObject;
        }}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', border: '3px solid black', transform: 'scaleX(-1)' }}
      />
      <div className="control-label" style={{ marginTop: 8, width: '100%', textAlign: 'center' }}>BIO-DATA LINKED</div>
    </div>
  );
});

const CustomizationPanel: React.FC<{
  font: string; setFont: (f: string) => void;
  sensitivity: number; setSensitivity: (s: number) => void;
  palette: string; setPalette: (p: string) => void;
}> = React.memo(({ font, setFont, sensitivity, setSensitivity, setPalette, palette }) => {
  return (
    <div className="glass-card controls-grid">
      <div className="control-item">
        <label className="control-label">Typeface</label>
        <select value={font} onChange={(e) => setFont(e.target.value)}>
          <option value="'Archivo Black', sans-serif">SOLID (Archivo)</option>
          <option value="'Anton', sans-serif">HEAVY (Anton)</option>
          <option value="'Syne', sans-serif">QUIRKY (Syne)</option>
          <option value="'Bricolage Grotesque', sans-serif">MAIN (Bricolage)</option>
          <option value="'Space Mono', monospace">MONO (Space)</option>
        </select>
      </div>
      <div className="control-item">
        <label className="control-label">Spectrum</label>
        <select value={palette} onChange={(e) => setPalette(e.target.value)}>
          <option value="acid">ACID PASTEL</option>
          <option value="retro">70S GROOVY</option>
          <option value="neon">ELECTRIC</option>
          <option value="mono">STARK B&W</option>
        </select>
      </div>
      <div className="control-item">
        <label className="control-label">Gain: {sensitivity.toFixed(1)}</label>
        <input
          type="range" min="0.1" max="2" step="0.1"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
});

const MainContent: React.FC = () => {
  const [text, setText] = useState('AMPLIFY');
  const [font, setFont] = useState("'Archivo Black', sans-serif");
  const [size] = useState(150);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [palette, setPalette] = useState('acid');
  const [debug, setDebug] = useState(false);

  const { emotions, isReady, videoRef } = useEmotion();
  useThemeManager();

  return (
    <div style={{ fontFamily: font }}>
      <AmorphousBackground />
      {!isReady && (
        <div className="glass-card" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 100, width: 'auto', textAlign: 'center'
        }}>
          <div className="font-display" style={{ fontSize: '2rem' }}>CALIBRATING SENSORS...</div>
        </div>
      )}

      {debug && <DebugPanel isReady={isReady} videoRef={videoRef} />}

      <MoleculeCanvas text={text} fontFamily={font} fontSize={size} sensitivity={sensitivity} palette={palette} />

      <br /><br />
      <div className="ui-container">

        <div className="glass-card" style={{ padding: '10px 20px' }}>
          <input
            type="text"
            className="input-field"
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            placeholder="FEEDBACK LOOP"
          />
        </div>

        <CustomizationPanel
          font={font} setFont={setFont}
          sensitivity={sensitivity} setSensitivity={setSensitivity}
          palette={palette} setPalette={setPalette}
        />

        <EmotionStats emotions={emotions} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <EmotionProvider>
      <MainContent />
    </EmotionProvider>
  );
};

export default App;
