'use client';

import { useEffect, useState } from 'react';
import { TASKS, ZONES } from '@/lib/tasksData';
import { Task } from '@/types';

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
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationEnabled(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  const toggleTaskCompletion = (taskId: number) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const zoneTasks = selectedZone ? TASKS.filter(t => t.zone === selectedZone) : [];

  return (
    <main style={{ 
      padding: '2rem 1rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
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

      {!selectedZone ? (
        <>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>
              📍 Zones disponibles
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {ZONES.map((zone) => {
                const taskCount = TASKS.filter((t) => t.zone === zone).length;
                return (
                  <div 
                    key={zone} 
                    onClick={() => setSelectedZone(zone)}
                    style={{ 
                      background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(59,130,246,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
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

          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>
              �� Notifications
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
        </>
      ) : (
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <button 
            onClick={() => setSelectedZone(null)}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}
          >
            ← Retour aux zones
          </button>
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>
            {selectedZone} - {zoneTasks.length} tâches
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {zoneTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              return (
                <div 
                  key={task.id}
                  onClick={() => toggleTaskCompletion(task.id)}
                  style={{
                    background: isCompleted ? '#e8f5e9' : '#f8f9fa',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: isCompleted ? '2px solid #4caf50' : '2px solid #e0e0e0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isCompleted ? '2px solid #4caf50' : '2px solid #cbd5e1',
                      background: isCompleted ? '#4caf50' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isCompleted && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        color: isCompleted ? '#2e7d32' : '#1e293b',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        marginBottom: '0.5rem'
                      }}>
                        {task.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {task.frequency}
                        </span>
                        {task.estimatedTime && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: '#fff3e0',
                            color: '#e65100',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            ⏱ {task.estimatedTime} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
