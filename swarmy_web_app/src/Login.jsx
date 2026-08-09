import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';
import './index.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Connect to our local Node.js Authentication Backend
      const response = await fetch(`http://${window.location.hostname}:3001/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('swarmy_token', data.token);
        onLoginSuccess();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Cannot connect to authentication server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1>Swarmy OS</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', fontFamily: 'Outfit', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ marginTop: '16px', padding: '14px', background: 'var(--accent-cyan)', border: 'none', borderRadius: '12px', color: 'white', fontFamily: 'Outfit', fontWeight: '600', fontSize: '1rem', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            {isLoading ? 'Authenticating...' : <>Login <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
