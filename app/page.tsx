'use client';

import { useEffect, useState } from 'react';
import { TASKS, ZONES } from '../lib/tasksData';
import { getScheduledTasksForMonth, getTasksForDate, ScheduledTask } from '../lib/calendarUtils';

interface CompletedTask {
  taskId: number;
  completedAt: string;
  date: string;
}

function requestNotificationPermission() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
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
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [history, setHistory] = useState<CompletedTask[]>([]);
  
  // Calendrier
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`tasks-${today}`);
      if (saved) {
        setCompletedTasks(new Set(JSON.parse(saved)));
      }

      const savedHistory = localStorage.getItem('tasks-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode === 'true') {
        setDarkMode(true);
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        setNotificationEnabled(true);
      }
    }
  }, []);

  useEffect(() => {
    const scheduled = getScheduledTasksForMonth(currentYear, currentMonth, TASKS);
    setScheduledTasks(scheduled);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`tasks-${today}`, JSON.stringify([...completedTasks]));
    }
  }, [completedTasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks-history', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  const toggleTaskCompletion = (taskId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
        setHistory(h => h.filter(item => !(item.taskId === taskId && item.date === today)));
      } else {
        newSet.add(taskId);
        setHistory(h => [...h, { taskId, completedAt: now, date: today }]);
      }
      return newSet;
    });
  };

  // ✅ NOUVELLE FONCTION : Cocher tâche depuis calendrier
  const toggleTaskCompletionForDate = (taskId: number, date: string) => {
    const now = new Date().toISOString();
    
    setHistory(prev => {
      const existing = prev.find(h => h.taskId === taskId && h.date === date);
      if (existing) {
        // Décocher
        return prev.filter(item => !(item.taskId === taskId && item.date === date));
      } else {
        // Cocher
        return [...prev, { taskId, completedAt: now, date }];
      }
    });

    // Si c'est aujourd'hui, mettre à jour aussi completedTasks
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) {
          newSet.delete(taskId);
        } else {
          newSet.add(taskId);
        }
        return newSet;
      });
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getStatsForLast7Days = () => {
    const days = getLast7Days();
    return days.map(date => ({
      date,
      count: history.filter(h => h.date === date).length,
      label: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })
    }));
  };

  const stats7Days = getStatsForLast7Days();
  const maxCount = Math.max(...stats7Days.map(s => s.count), 1);
  const totalThisWeek = stats7Days.reduce((sum, s) => sum + s.count, 0);
  const streakDays = (() => {
    let streak = 0;
    const days = getLast7Days().reverse();
    for (const date of days) {
      if (history.some(h => h.date === date)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const today = new Date().toISOString().split('T')[0];
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate, scheduledTasks) : [];

  let zoneTasks = selectedZone ? TASKS.filter(t => t.zone === selectedZone) : [];
  if (filterFrequency !== 'all') {
    zoneTasks = zoneTasks.filter(t => t.frequency === filterFrequency);
  }

  const frequencies = ['quotidienne', 'hebdomadaire', 'mensuelle', 'saisonnière', 'annuelle', 'trimestrielle'];

  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    gradientFrom: darkMode ? '#1e3a8a' : '#e3f2fd',
    gradientTo: darkMode ? '#3730a3' : '#bbdefb',
  };

  return (
    <main style={{ 
      padding: '1rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: theme.bg,
      transition: 'background 0.3s ease'
    }}>
      {/* HEADER */}
      <header style={{ padding: '1rem 0', marginBottom: '1rem' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.8rem, 7vw, 4rem)', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          🏠 CleanHome Pro
        </h1>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowStats(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showCalendar ? '#3b82f6' : theme.cardBg,
              color: showCalendar ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem'
            }}
            title="Calendrier"
          >
            📅
          </button>
          <button
            onClick={() => {
              setShowStats(!showStats);
              setShowCalendar(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showStats ? '#3b82f6' : theme.cardBg,
              color: showStats ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem'
            }}
            title="Statistiques"
          >
            📊
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '0.5rem 1rem',
              background: theme.cardBg,
              color: theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem'
            }}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <p style={{ fontSize: '1rem', color: theme.textSecondary, marginBottom: '0.75rem', textAlign: 'center' }}>
          <strong>{TASKS.length} tâches</strong> organisées
        </p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          color: theme.textSecondary
        }}>
          <span>✅ {completedTasks.size} aujourd'hui</span>
          <span>📅 {totalThisWeek} cette semaine</span>
          <span>🔥 {streakDays} jour{streakDays > 1 ? 's' : ''}</span>
        </div>
      </header>

      {/* CALENDRIER */}
      {showCalendar && (
        <div style={{ 
          background: theme.cardBg, 
          borderRadius: '16px', 
          padding: '1.5rem', 
          marginBottom: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={prevMonth} style={{
              padding: '0.5rem 1rem',
              background: theme.bg,
              color: theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              ←
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} style={{
              padding: '0.5rem 1rem',
              background: theme.bg,
              color: theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}>
              →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {dayNames.map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                fontWeight: '600', 
                fontSize: '0.75rem',
                color: theme.textSecondary,
                padding: '0.5rem 0'
              }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', background: theme.bg, borderRadius: '8px' }} />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const tasksForDay = getTasksForDate(dateStr, scheduledTasks);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const completedForDay = history.filter(h => h.date === dateStr).length;
              
              return (
                <div 
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: '1',
                    background: isSelected ? '#3b82f6' : isToday ? theme.gradientFrom : theme.bg,
                    border: isToday ? `2px solid #3b82f6` : `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isToday ? '700' : '500',
                    color: isSelected ? 'white' : theme.text
                  }}>
                    {day}
                  </div>
                  {tasksForDay.length > 0 && (
                    <div style={{
                      fontSize: '0.65rem',
                      color: isSelected ? 'white' : '#3b82f6',
                      fontWeight: '600'
                    }}>
                      {tasksForDay.length}
                    </div>
                  )}
                  {completedForDay > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4caf50'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ✅ TÂCHES CLIQUABLES DU JOUR */}
          {selectedDate && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: theme.bg, borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: theme.text, marginBottom: '1rem' }}>
                📋 {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {selectedDateTasks.length === 0 ? (
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Aucune tâche planifiée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedDateTasks.map((task, idx) => {
                    const isCompleted = history.some(h => h.taskId === task.taskId && h.date === selectedDate);
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleTaskCompletionForDate(task.taskId, selectedDate)}
                        style={{
                          padding: '1rem',
                          background: isCompleted ? (darkMode ? '#1e3a1e' : '#e8f5e9') : theme.cardBg,
                          border: isCompleted ? '2px solid #4caf50' : `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isCompleted ? '2px solid #4caf50' : `2px solid ${theme.border}`,
                            background: isCompleted ? '#4caf50' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isCompleted && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              fontSize: '0.95rem',
                              color: isCompleted ? '#4caf50' : theme.text,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              marginBottom: '0.5rem'
                            }}>
                              {task.taskName}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: darkMode ? '#1e3a8a' : '#e3f2fd',
                                color: darkMode ? '#93c5fd' : '#1565c0',
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                {task.zone}
                              </span>
                              <span style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: darkMode ? '#065f46' : '#d1fae5',
                                color: darkMode ? '#6ee7b7' : '#047857',
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                {task.frequency}
                              </span>
                              {task.estimatedTime && (
                                <span style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  background: darkMode ? '#7c2d12' : '#fff3e0',
                                  color: darkMode ? '#fdba74' : '#e65100',
                                  borderRadius: '4px',
                                  fontWeight: '600'
                                }}>
                                  ⏱ {task.estimatedTime}m
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STATISTIQUES */}
      {showStats && (
        <div style={{ 
          background: theme.cardBg, 
          borderRadius: '16px', 
          padding: '1.5rem', 
          marginBottom: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
            📊 7 derniers jours
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '150px', gap: '0.25rem', marginBottom: '1.5rem' }}>
            {stats7Days.map((stat, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: theme.text
                }}>
                  {stat.count}
                </div>
                <div style={{ 
                  width: '100%',
                  height: `${(stat.count / maxCount) * 100}px`,
                  background: stat.count > 0 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : theme.border,
                  borderRadius: '8px 8px 0 0',
                  minHeight: '10px'
                }} />
                <div style={{ fontSize: '0.65rem', color: theme.textSecondary }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: theme.bg, padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalThisWeek}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Semaine</div>
            </div>
            <div style={{ background: theme.bg, padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{completedTasks.size}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Aujourd'hui</div>
            </div>
            <div style={{ background: theme.bg, padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{streakDays}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Streak</div>
            </div>
            <div style={{ background: theme.bg, padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{history.length}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Total</div>
            </div>
          </div>
        </div>
      )}

      {!selectedZone ? (
        <>
          <div style={{ 
            background: theme.cardBg, 
            borderRadius: '16px', 
            padding: '1.5rem', 
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
              📍 {ZONES.length} Zones
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {ZONES.map((zone) => {
                const taskCount = TASKS.filter((t) => t.zone === zone).length;
                const completedCount = TASKS.filter((t) => t.zone === zone && completedTasks.has(t.id)).length;
                const percentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
                
                return (
                  <div 
                    key={zone} 
                    onClick={() => setSelectedZone(zone)}
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                      padding: '1.25rem',
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `2px solid ${theme.border}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {percentage > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: '4px',
                        width: `${percentage}%`,
                        background: '#4caf50'
                      }} />
                    )}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem', color: theme.text }}>
                      {zone}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: theme.textSecondary, marginBottom: '0.25rem' }}>
                      {taskCount} tâches
                    </p>
                    {percentage > 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#4caf50', fontWeight: '600' }}>
                        {percentage}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: theme.cardBg, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}` }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
              🔔 Notifications
            </h2>
            {!notificationEnabled ? (
              <button 
                onClick={handleEnableNotifications}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔔 Activer les rappels
              </button>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
                border: '2px solid #4caf50',
                color: '#1b5e20',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '0.9rem'
              }}>
                <strong>✅ Activées !</strong><br/>
                Rappels à 20h la veille.
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ 
          background: theme.cardBg, 
          borderRadius: '16px', 
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.border}`
        }}>
          <button 
            onClick={() => setSelectedZone(null)}
            style={{
              padding: '0.5rem 1rem',
              background: theme.bg,
              color: theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Retour
          </button>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
            {selectedZone}
          </h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              onClick={() => setFilterFrequency('all')}
              style={{
                padding: '0.4rem 0.8rem',
                background: filterFrequency === 'all' ? '#3b82f6' : theme.bg,
                color: filterFrequency === 'all' ? 'white' : theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Toutes
            </button>
            {frequencies.map(freq => (
              <button
                key={freq}
                onClick={() => setFilterFrequency(freq)}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: filterFrequency === freq ? '#3b82f6' : theme.bg,
                  color: filterFrequency === freq ? 'white' : theme.text,
                  border: `2px solid ${theme.border}`,
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {freq}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {zoneTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              return (
                <div 
                  key={task.id}
                  onClick={() => toggleTaskCompletion(task.id)}
                  style={{
                    background: isCompleted ? (darkMode ? '#1e3a1e' : '#e8f5e9') : theme.bg,
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: isCompleted ? '2px solid #4caf50' : `2px solid ${theme.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isCompleted ? '2px solid #4caf50' : `2px solid ${theme.border}`,
                      background: isCompleted ? '#4caf50' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isCompleted && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: isCompleted ? '#4caf50' : theme.text,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        marginBottom: '0.5rem'
                      }}>
                        {task.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          background: darkMode ? '#1e3a8a' : '#e3f2fd',
                          color: darkMode ? '#93c5fd' : '#1565c0',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          📅 {task.frequency}
                        </span>
                        {task.estimatedTime && (
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            background: darkMode ? '#7c2d12' : '#fff3e0',
                            color: darkMode ? '#fdba74' : '#e65100',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            ⏱ {task.estimatedTime}m
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
