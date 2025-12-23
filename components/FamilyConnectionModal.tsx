'use client';
import { useState } from 'react';

interface Props {
  onCreateFamily: () => Promise<string>;  // ✅ Async
  onJoinFamily: (code: string) => Promise<void | boolean>;  // ✅ Async
  onClose: () => void;
}

export default function FamilyConnectionModal({ onCreateFamily, onJoinFamily, onClose }: Props) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const code = await onCreateFamily();
      if (code) {
        setCreatedCode(code);
        setMode('create');
      }
    } catch (error) {
      console.error('Erreur création famille:', error);
      alert('❌ Erreur lors de la création de la famille');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length !== 6) return;
    
    setIsLoading(true);
    try {
      const success = await onJoinFamily(joinCode.toUpperCase());
      if (success !== false) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur rejoindre famille:', error);
    } finally {
      setIsLoading(false);
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
              👨‍👩‍👧‍👦 Partage Familial
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Synchronisez vos tâches en temps réel avec votre famille
            </p>
            
            <button
              onClick={handleCreate}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? '⏳ Création...' : '🆕 Créer une famille'}
            </button>

            <button
              onClick={() => setMode('join')}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                background: isLoading ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              🔗 Rejoindre une famille
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer'
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
              disabled={isLoading}
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
                textTransform: 'uppercase',
                opacity: isLoading ? 0.5 : 1
              }}
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                background: (joinCode.length === 6 && !isLoading) ? '#10b981' : '#e2e8f0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: (joinCode.length === 6 && !isLoading) ? 'pointer' : 'not-allowed',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? '⏳ Connexion...' : 'Rejoindre'}
            </button>
            <button
              onClick={() => setMode('choice')}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer'
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
