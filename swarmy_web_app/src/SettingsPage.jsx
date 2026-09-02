import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Palette, Settings, Brain } from 'lucide-react';
const THEMES = ['apple-dark', 'apple-light', 'midnight', 'obsidian', 'emerald', 'amethyst', 'gold', 'arctic', 'sunset', 'ocean', 'blossom', 'monolith', 'autumn', 'royal', 'mint', 'cyber', 'tokyo', 'lunar', 'blood', 'aurora'];
const API_URL = '';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('swarmy_token')}` };
}

export default function SettingsPage() {
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('swarmy_theme') || 'apple-dark');
  const [volume, setVolume] = useState(50);
  const [voiceProfile, setVoiceProfile] = useState(localStorage.getItem('swarmy_voice_profile') || 'doraemon');
  const [elevenLabsKey, setElevenLabsKey] = useState(localStorage.getItem('swarmy_eleven_key') || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(localStorage.getItem('swarmy_eleven_vid') || '');
  const [model, setModel] = useState(localStorage.getItem('swarmy_ai_model') || 'minimaxai/minimax-m3');

  useEffect(() => {
    fetch(`${API_URL}/api/system/volume`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.volume !== undefined) setVolume(d.volume); })
      .catch(e => console.error(e));
  }, []);

  const changeTheme = (theme) => {
    setActiveTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('swarmy_theme', theme);
    window.dispatchEvent(new Event('themeChanged'));
  };

  const getThemeIconColor = (theme) => {
    switch (theme) {
      case 'apple-dark': return '#f5f5f7';
      case 'apple-light': return '#1d1d1f';
      case 'midnight': return '#9ca3af';
      case 'obsidian': return '#9333ea';
      case 'emerald': return '#10b981';
      case 'amethyst': return '#a855f7';
      case 'gold': return '#fbbf24';
      case 'arctic': return '#60a5fa';
      case 'sunset': return '#f43f5e';
      case 'ocean': return '#06b6d4';
      case 'blossom': return '#f472b6';
      case 'monolith': return '#d1d5db';
      case 'autumn': return '#d97706';
      case 'royal': return '#4f46e5';
      case 'mint': return '#34d399';
      case 'cyber': return '#00ff41';
      case 'tokyo': return '#ff003c';
      case 'lunar': return '#facc15';
      case 'blood': return '#b91c1c';
      case 'aurora': return '#a78bfa';
      default: return '#f5f5f7';
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    fetch(`${API_URL}/api/system/volume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ volume: v })
    }).catch(e => console.error(e));
  };

  return (
    <div className="dashboard-grid">
      <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
        <h2 style={{color: 'var(--hexa-cyan)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,243,255,0.2)', paddingBottom: '12px'}}>
          <Settings /> System Settings
        </h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px'}}>
          
          {/* VOLUME CONTROL */}
          <div className="panel" style={{background: 'rgba(0,0,0,0.2)'}}>
            <h3 style={{color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Volume2 color="#00f3ff" /> Audio & Volume
            </h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>Adjust the physical speaker volume of the robot.</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px'}}>
              <Volume2 size={24} color={volume === 0 ? '#ff003c' : '#00f3ff'} />
              <input 
                type="range" 
                min="0" max="100" 
                value={volume} 
                onChange={handleVolumeChange} 
                style={{ flex: 1, accentColor: '#00f3ff', cursor: 'pointer' }}
              />
              <span style={{ minWidth: '40px', fontSize: '1.2rem', fontWeight: 'bold' }}>{volume}%</span>
            </div>
          </div>

          {/* AI ASSISTANT SETTINGS */}
          <div className="panel" style={{background: 'rgba(0,0,0,0.2)'}}>
            <h3 style={{color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Brain color="#a855f7" /> AI Voice Engine
            </h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>Configure the AI assistant persona and LLM model.</p>
            
            <label style={{display: 'block', marginBottom: '8px', color: 'var(--text-muted)'}}>Active Voice Persona</label>
            <select 
              className="input-tech" 
              style={{width: '100%', marginBottom: '16px'}}
              value={voiceProfile}
              onChange={(e) => {
                setVoiceProfile(e.target.value);
                localStorage.setItem('swarmy_voice_profile', e.target.value);
              }}
            >
              <option value="doraemon">Doraemon (Indian Accent)</option>
              <option value="jarvis">J.A.R.V.I.S (British Formal)</option>
              <option value="ultron">Ultron (Avengers Menacing AI)</option>
              <option value="glados">GLaDOS (Cold AI)</option>
              <option value="standard_in">Standard (Indian English)</option>
              <option value="elevenlabs">☁️ Custom Cloud Clone (ElevenLabs)</option>
            </select>

            <label style={{display: 'block', marginBottom: '8px', color: 'var(--text-muted)'}}>Brain Model</label>
            <select 
              className="input-tech" 
              style={{width: '100%', marginBottom: '16px'}}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                localStorage.setItem('swarmy_ai_model', e.target.value);
              }}
            >
              <option value="minimaxai/minimax-m3">MiniMax M3 (Fast, Recommended)</option>
              <option value="google/gemini-flash">Gemini Flash (Creative)</option>
              <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B (Local Equivalent)</option>
            </select>

            {voiceProfile === 'elevenlabs' && (
              <div style={{background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px'}}>
                <h4 style={{marginTop: 0, color: '#f59e0b', fontSize: '0.9rem'}}>ElevenLabs Cloud API</h4>
                <label style={{display: 'block', fontSize: '0.8rem', marginBottom: '4px'}}>API Key</label>
                <input 
                  type="password" className="input-tech" placeholder="sk_..."
                  style={{width: '100%', marginBottom: '12px', fontSize: '0.85rem', padding: '8px'}}
                  value={elevenLabsKey}
                  onChange={(e) => { setElevenLabsKey(e.target.value); localStorage.setItem('swarmy_eleven_key', e.target.value); }}
                />
                <label style={{display: 'block', fontSize: '0.8rem', marginBottom: '4px'}}>Voice ID</label>
                <input 
                  type="text" className="input-tech" placeholder="21m00Tcm4TlvDq8ikWAM"
                  style={{width: '100%', fontSize: '0.85rem', padding: '8px'}}
                  value={elevenLabsVoiceId}
                  onChange={(e) => { setElevenLabsVoiceId(e.target.value); localStorage.setItem('swarmy_eleven_vid', e.target.value); }}
                />
              </div>
            )}
          </div>

          {/* THEMES */}
          <div className="panel" style={{background: 'rgba(0,0,0,0.2)'}}>
            <h3 style={{color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Palette color="#10b981" /> Dashboard Theme
            </h3>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px'}}>Personalize the look and feel of your dashboard.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {THEMES.map(theme => (
                <button
                  key={theme}
                  onClick={() => changeTheme(theme)}
                  style={{
                    background: activeTheme === theme ? 'rgba(0,243,255,0.1)' : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${activeTheme === theme ? 'var(--hexa-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    color: activeTheme === theme ? '#fff' : 'var(--text-muted)',
                    padding: '10px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%', 
                    background: getThemeIconColor(theme),
                    boxShadow: activeTheme === theme ? `0 0 8px ${getThemeIconColor(theme)}` : 'none',
                    flexShrink: 0
                  }} />
                  <span style={{fontSize: '0.85rem', fontWeight: activeTheme === theme ? '600' : '400'}}>{theme.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
