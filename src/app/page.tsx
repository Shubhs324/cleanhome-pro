'use client';

import { useEffect, useState } from 'react';
import { TASKS, ZONES } from '@/lib/tasksData';

function requestNotificationPermission() {
  return new Promise<boolean>((resolve) => {
    if (!('Notification' in window)) {
      resolve(false);
      return;
    }
    if (Notification.permission === 'granted') {
      resolve(true);
      return;
    }
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        resolve(permission === 'granted');
      });
    } else {
      resolve(false);
    }
  });
}

export default function Home() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationEnabled(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  return (
    <main style={{ 
      padding: '2rem 1rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      minHeight: '100vh'
    }}>
      <header style={{ textAlign: 'center', padding: '2rem 0' }}>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 5vw, 4rem)', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          🏠 CleanHome Pro
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '3rem' }}>
          Votre assistant ménage intelligent avec <strong>{TASKS.length} tâches</strong>
        </p>
      </header>

      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '2rem', 
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: '#1e293b', 
          marginBottom: '1.5rem' 
        }}>
          📍 Zones disponibles
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {ZONES.map((zone) => {
            const taskCount = TASKS.filter((t) => t.zone === zone).length;
            return (
              <div key={zone} style={{ 
                background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                padding: '1.5rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid transparent'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(59,130,246,0.3)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {zone}
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#475569' }}>
                  {taskCount} tâches
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: '#1e293b', 
          marginBottom: '1.5rem' 
        }}>
          🔔 Notifications
        </h2>
        {!notificationEnabled ? (
          <button 
            onClick={handleEnableNotifications}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(59,130,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Activer les rappels quotidiens
          </button>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
            border: '2px solid #4caf50',
            color: '#1b5e20',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <strong>✅ Notifications activées !</strong><br/>
            Vous recevrez vos rappels à 20h la veille.
          </div>
        )}
      </div>
    </main>
  );
}
