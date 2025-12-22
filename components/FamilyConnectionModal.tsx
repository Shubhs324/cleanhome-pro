'use client';
import { useState } from 'react';

interface Props {
  onCreateFamily: () => string;
  onJoinFamily: (code: string) => void;
  onClose: () => void;
}

export default function FamilyConnectionModal({ onCreateFamily, onJoinFamily, onClose }: Props) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const handleCreate = () => {
    const code = onCreateFamily();
    setCreatedCode(code);
    setMode('create');
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      onJoinFamily(joinCode.toUpperCase());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {mode === 'choice' && (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              👨‍👩‍��‍👦 Partage Familial
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Synchronisez vos tâches en temps réel avec votre famille
            </p>
            
            <button
              onClick={handleCreate}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              🆕 Créer une famille
            </button>

            <button
              onClick={() => setMode('join')}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              🔗 Rejoindre une famille
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              ✅ Famille créée !
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', textAlign: 'center' }}>
              Partagez ce code à votre famille :
            </p>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '0.2em' }}>
                {createdCode}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdCode);
                alert('📋 Code copié !');
              }}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              📋 Copier le code
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Continuer
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              🔗 Rejoindre
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', textAlign: 'center' }}>
              Entrez le code famille à 6 caractères :
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                fontWeight: '800',
                marginBottom: '1rem',
                textTransform: 'uppercase'
              }}
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              style={{
                width: '100%',
                padding: '1rem',
                background: joinCode.length === 6 ? '#10b981' : '#e2e8f0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
                marginBottom: '1rem'
              }}
            >
              Rejoindre
            </button>
            <button
              onClick={() => setMode('choice')}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
}
