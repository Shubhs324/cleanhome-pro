'use client';

import { useEffect, useState } from 'react';
import { TASKS, ZONES } from '../lib/tasksData';
import { TUTORIALS, getTutorialByTaskId, getTutorialsByZone, type Tutorial } from '../lib/tutorialsData';
import { getScheduledTasksForMonth, getTasksForDate, ScheduledTask } from '../lib/calendarUtils';
import { useFirebaseFamily } from '@/hooks/useFirebaseFamily';
import FamilyConnectionModal from '@/components/FamilyConnectionModal';
import {
  BADGES,
  LEVELS,
  generateWeeklyChallenges,
  calculatePoints,
  getCurrentLevel,
  getNextLevel,
  getProgressToNextLevel,
  checkBadgeUnlocked,
  type Badge,
  type Challenge,
} from '../lib/gamification';
import type { FamilyMember, TaskAssignment, TaskComment } from '../types';

interface CompletedTask {
  taskId: number;
  completedAt: string;
  date: string;
  memberId?: string;
  points?: number;
}

const DEFAULT_AVATARS = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👶'];
const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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
  const [showFamily, setShowFamily] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [history, setHistory] = useState<CompletedTask[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);

  // Partage familial
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedTaskForComment, setSelectedTaskForComment] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  // Gamification
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [newBadgeUnlocked, setNewBadgeUnlocked] = useState<Badge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteTasks, setFavoriteTasks] = useState<Set<number>>(new Set());
  const [customTasks, setCustomTasks] = useState<any[]>([]);
  const [hiddenTasks, setHiddenTasks] = useState<Set<number>>(new Set());
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [newTask, setNewTask] = useState({ name: '', zone: 'Cuisine', frequency: 'quotidienne', estimatedTime: 10, description: '' });
  const [showTutorials, setShowTutorials] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [tutorialZoneFilter, setTutorialZoneFilter] = useState<string>('all');
  
  // Firebase Family Sync
  const { 
  familyCode: firebaseFamilyCode,
  isConnected: firebaseIsConnected,
  createFamily: firebaseCreateFamily,
  joinFamily: firebaseJoinFamily,
  disconnect: firebaseDisconnect,
  syncData: firebaseSyncData,
  listenToData: firebaseListenToData
} = useFirebaseFamily();

  const [showFamilyModal, setShowFamilyModal] = useState(!firebaseIsConnected);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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

      const savedMembers = localStorage.getItem('family-members');
      if (savedMembers) {
        setFamilyMembers(JSON.parse(savedMembers));
      }

      const savedAssignments = localStorage.getItem('task-assignments');
      if (savedAssignments) {
        setTaskAssignments(JSON.parse(savedAssignments));
      }

      const savedComments = localStorage.getItem('task-comments');
      if (savedComments) {
        setTaskComments(JSON.parse(savedComments));
      }

      const savedCurrentMember = localStorage.getItem('current-member-id');
      if (savedCurrentMember) {
        setCurrentMemberId(savedCurrentMember);
      }

      const savedPoints = localStorage.getItem('total-points');
      if (savedPoints) {
        setTotalPoints(parseInt(savedPoints));
      }

      const savedBadges = localStorage.getItem('unlocked-badges');
      if (savedBadges) {
        setUnlockedBadges(JSON.parse(savedBadges));
      }

      const currentWeek = getWeekNumber();
      const savedChallenges = localStorage.getItem(`challenges-${currentWeek}`);
      if (savedChallenges) {
        setWeeklyChallenges(JSON.parse(savedChallenges));
      } else {
        const challenges = generateWeeklyChallenges(currentWeek);
        setWeeklyChallenges(challenges);
        localStorage.setItem(`challenges-${currentWeek}`, JSON.stringify(challenges));
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        setNotificationEnabled(true);
      }

      if ('serviceWorker' in navigator) {
        navigator
          .serviceWorker.register('/sw.js')
          .then((reg) => console.log('✅ Service Worker enregistré'))
          .catch((err) => console.log('❌ Service Worker erreur:', err));
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const getWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return `${now.getFullYear()}-W${Math.floor(diff / oneWeek)}`;
  };

  // Début de semaine (lundi)
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = dimanche
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('✅ PWA installée');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

// Wrappers pour le modal (sync vers async)
const handleCreateFamilyWrapper = async () => {
  const code = await firebaseCreateFamily();
  return code || '';
};

const handleJoinFamilyWrapper = async (code: string) => {
  await firebaseJoinFamily(code);
};

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

  // Historiques + points + badges
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks-history', JSON.stringify(history));

      const calculatedPoints = history.reduce((sum, task) => sum + (task.points || 0), 0);
      setTotalPoints(calculatedPoints);
      localStorage.setItem('total-points', calculatedPoints.toString());

      // Vérif badges avec la valeur calculée
      checkForNewBadges(calculatedPoints);
      updateMemberPoints();
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('family-members', JSON.stringify(familyMembers));
    }
  }, [familyMembers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('task-assignments', JSON.stringify(taskAssignments));
    }
  }, [taskAssignments]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('task-comments', JSON.stringify(taskComments));
    }
  }, [taskComments]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentMemberId) {
      localStorage.setItem('current-member-id', currentMemberId);
    }
  }, [currentMemberId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unlocked-badges', JSON.stringify(unlockedBadges));
    }
  }, [unlockedBadges]);
  
// ========================================
// 🔥 FIREBASE - LISTENERS (LECTURE)
// ========================================

useEffect(() => {
  if (!firebaseIsConnected) return;

  const unsubMembers = firebaseListenToData('members', (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      setFamilyMembers(data as FamilyMember[]);
      console.log('📥 Members reçus:', data.length);
    }
  });

  const unsubHistory = firebaseListenToData('history', (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      setHistory(data as CompletedTask[]);
      console.log('📥 History reçu:', data.length);
    }
  });

  const unsubAssignments = firebaseListenToData('assignments', (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      setTaskAssignments(data as TaskAssignment[]);
      console.log('📥 Assignments reçus:', data.length);
    }
  });

  const unsubComments = firebaseListenToData('comments', (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      setTaskComments(data as TaskComment[]);
      console.log('📥 Comments reçus:', data.length);
    }
  });

  return () => {
    unsubMembers();
    unsubHistory();
    unsubAssignments();
    unsubComments();
  };
}, [firebaseIsConnected]);

// ========================================
// 🔥 FIREBASE - SYNC (ÉCRITURE)
// ========================================

useEffect(() => {
  if (!firebaseIsConnected || familyMembers.length === 0) return;
  const timeoutId = setTimeout(() => {
    firebaseSyncData('members', familyMembers);
  }, 500);
  return () => clearTimeout(timeoutId);
}, [familyMembers.length, firebaseIsConnected]);

useEffect(() => {
  if (!firebaseIsConnected || history.length === 0) return;
  const timeoutId = setTimeout(() => {
    firebaseSyncData('history', history);
  }, 500);
  return () => clearTimeout(timeoutId);
}, [history.length, firebaseIsConnected]);

useEffect(() => {
  if (!firebaseIsConnected || taskAssignments.length === 0) return;
  const timeoutId = setTimeout(() => {
    firebaseSyncData('assignments', taskAssignments);
  }, 500);
  return () => clearTimeout(timeoutId);
}, [taskAssignments.length, firebaseIsConnected]);

useEffect(() => {
  if (!firebaseIsConnected || taskComments.length === 0) return;
  const timeoutId = setTimeout(() => {
    firebaseSyncData('comments', taskComments);
  }, 500);
  return () => clearTimeout(timeoutId);
}, [taskComments.length, firebaseIsConnected]);



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorite-tasks');
      if (saved) setFavoriteTasks(new Set(JSON.parse(saved)));
      const savedCustom = localStorage.getItem('custom-tasks');
      if (savedCustom) setCustomTasks(JSON.parse(savedCustom));
      const savedHidden = localStorage.getItem('hidden-tasks');
      if (savedHidden) setHiddenTasks(new Set(JSON.parse(savedHidden)));
    }
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('favorite-tasks', JSON.stringify([...favoriteTasks])); }, [favoriteTasks]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('custom-tasks', JSON.stringify(customTasks)); }, [customTasks]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('hidden-tasks', JSON.stringify([...hiddenTasks])); }, [hiddenTasks]);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const streakDays = (() => {
    let streak = 0;
    const days = getLast7Days().reverse();
    for (const date of days) {
      if (history.some((h) => h.date === date)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  // Badges avec points passés en argument
  const checkForNewBadges = (currentPoints: number) => {
    const stats = {
      totalTasks: history.length,
      totalPoints: currentPoints,
      currentStreak: streakDays,
    };

    BADGES.forEach((badge) => {
      if (!unlockedBadges.includes(badge.id) && checkBadgeUnlocked(badge, stats)) {
        setUnlockedBadges((prev) => [...prev, badge.id]);
        setNewBadgeUnlocked(badge);
        setTimeout(() => setNewBadgeUnlocked(null), 5000);
      }
    });
  };

  const updateMemberPoints = () => {
    setFamilyMembers((prev) => {
      return prev.map((member) => {
        const memberTasks = history.filter((h) => h.memberId === member.id);
        const points = memberTasks.reduce((sum, task) => sum + (task.points || 0), 0);
        return { ...member, points };
      });
    });
  };

  const addFamilyMember = () => {
    if (!newMemberName.trim()) return;

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      color: DEFAULT_COLORS[familyMembers.length % DEFAULT_COLORS.length],
      avatar: DEFAULT_AVATARS[familyMembers.length % DEFAULT_AVATARS.length],
      points: 0,
    };

    setFamilyMembers([...familyMembers, newMember]);
    setNewMemberName('');
    setShowAddMember(false);

    if (!currentMemberId) {
      setCurrentMemberId(newMember.id);
    }
  };

  const removeFamilyMember = (memberId: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== memberId));
    setTaskAssignments(taskAssignments.filter((a) => a.memberId !== memberId));
    if (currentMemberId === memberId) {
      setCurrentMemberId(familyMembers[0]?.id || null);
    }
  };

  const assignTaskToMember = (taskId: number, memberId: string) => {
    const existing = taskAssignments.find((a) => a.taskId === taskId);
    if (existing) {
      setTaskAssignments(
        taskAssignments.map((a) =>
          a.taskId === taskId ? { ...a, memberId, assignedAt: new Date().toISOString() } : a,
        ),
      );
    } else {
      setTaskAssignments([
        ...taskAssignments,
        {
          taskId,
          memberId,
          assignedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const addComment = (taskId: number) => {
    if (!newComment.trim() || !currentMemberId) return;

    const comment: TaskComment = {
      id: Date.now().toString(),
      taskId,
      memberId: currentMemberId,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setTaskComments([...taskComments, comment]);
    setNewComment('');
    setSelectedTaskForComment(null);
  };

  const toggleFavorite = (taskId: number) => {
    setFavoriteTasks((prev) => { const newSet = new Set(prev); newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId); return newSet; });
  };

  const toggleHideTask = (taskId: number) => {
    setHiddenTasks((prev) => { const newSet = new Set(prev); newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId); return newSet; });
  };

  const addCustomTask = () => {
    if (!newTask.name.trim()) return;
    const task = { id: Date.now(), ...newTask, isCustom: true };
    setCustomTasks([...customTasks, task]);
    setNewTask({ name: '', zone: 'Cuisine', frequency: 'quotidienne', estimatedTime: 10, description: '' });
    setShowAddTask(false);
  };

  const deleteCustomTask = (taskId: number) => {
    setCustomTasks(customTasks.filter(t => t.id !== taskId));
    setCompletedTasks(prev => { const newSet = new Set(prev); newSet.delete(taskId); return newSet; });
    setHistory(prev => prev.filter(h => h.taskId !== taskId));
  };

  const openTutorialForTask = (taskId: number) => {
    const tutorial = getTutorialByTaskId(taskId);
    if (tutorial) {
      setSelectedTutorial(tutorial);
      setShowTutorials(true);
    } else {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        setTutorialZoneFilter(task.zone);
        setShowTutorials(true);
      }
    }
  };

  const TEMPLATES = {
    all: { name: 'Toutes', zones: [] as string[] },
    studio: { name: 'Studio', zones: ['Cuisine', 'Salon', 'Salle de bain'] },
    appartement: { name: 'Appartement', zones: ['Cuisine', 'Salon', 'Chambres', 'Salle de bain', 'Entrée'] },
    maison: { name: 'Maison', zones: ['Cuisine', 'Salon', 'Chambres', 'Salle de bain', 'Entrée', 'Garage', 'Extérieur', 'Buanderie'] },
    minimal: { name: 'Minimaliste', zones: ['Cuisine', 'Salle de bain'] }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  const toggleTaskCompletion = (taskId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const task = TASKS.find((t) => t.id === taskId);
    const points = calculatePoints(task?.estimatedTime);

    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
        setHistory((h) => h.filter((item) => !(item.taskId === taskId && item.date === today)));
      } else {
        newSet.add(taskId);
        setHistory((h) => [
          ...h,
          {
            taskId,
            completedAt: now,
            date: today,
            memberId: currentMemberId || undefined,
            points,
          },
        ]);
      }
      return newSet;
    });
  };

  const toggleTaskCompletionForDate = (taskId: number, date: string) => {
    const now = new Date().toISOString();
    const task = TASKS.find((t) => t.id === taskId);
    const points = calculatePoints(task?.estimatedTime);

    setHistory((prev) => {
      const existing = prev.find((h) => h.taskId === taskId && h.date === date);
      if (existing) {
        return prev.filter((item) => !(item.taskId === taskId && item.date === date));
      } else {
        return [
          ...prev,
          {
            taskId,
            completedAt: now,
            date,
            memberId: currentMemberId || undefined,
            points,
          },
        ];
      }
    });

    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      setCompletedTasks((prev) => {
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

  const getStatsForLast7Days = () => {
    const days = getLast7Days();
    return days.map((date) => ({
      date,
      count: history.filter((h) => h.date === date).length,
      label: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    }));
  };

  const stats7Days = getStatsForLast7Days();
  const maxCount = Math.max(...stats7Days.map((s) => s.count), 1);
  const totalThisWeek = stats7Days.reduce((sum, s) => sum + s.count, 0);

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

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const today = new Date().toISOString().split('T')[0];

  const allTasks = [...TASKS, ...customTasks];

  const filteredByTemplate = (tasks: any[]) => {
    if (selectedTemplate === 'all') return tasks;
    const templateZones = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].zones;
    return templateZones.length > 0 ? tasks.filter(t => templateZones.includes(t.zone)) : tasks;
  };

  const selectedDateTasks = selectedDate ? filteredByTemplate(getTasksForDate(selectedDate, scheduledTasks)) : [];

  let zoneTasks = allTasks;
  if (selectedTemplate !== 'all') {
    const templateZones = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].zones;
    if (templateZones.length > 0) zoneTasks = zoneTasks.filter(t => templateZones.includes(t.zone));
  }
  if (selectedZone) zoneTasks = zoneTasks.filter((t) => t.zone === selectedZone);
  if (filterFrequency !== 'all') zoneTasks = zoneTasks.filter((t) => t.frequency === filterFrequency);
  if (searchQuery.trim()) zoneTasks = zoneTasks.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.zone.toLowerCase().includes(searchQuery.toLowerCase()));
  zoneTasks = zoneTasks.filter(t => !hiddenTasks.has(t.id));
  zoneTasks.sort((a, b) => (favoriteTasks.has(b.id) ? 1 : 0) - (favoriteTasks.has(a.id) ? 1 : 0));

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

  const sortedMembers = [...familyMembers].sort((a, b) => b.points - a.points);
  const currentLevel = getCurrentLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const progressToNext = getProgressToNextLevel(totalPoints);

  return (
    <main
      style={{
        padding: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        background: theme.bg,
        transition: 'background 0.3s ease',
      }}
    >
      {newBadgeUnlocked && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: 'white',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 10000,
            textAlign: 'center',
            minWidth: '300px',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{newBadgeUnlocked.icon}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Nouveau Badge Débloqué !</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{newBadgeUnlocked.name}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{newBadgeUnlocked.description}</div>
        </div>
      )}

      {!isOnline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#f59e0b',
            color: 'white',
            padding: '0.75rem',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '0.9rem',
            zIndex: 9999,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          📡 Mode hors-ligne - Vos données sont sauvegardées localement
        </div>
      )}

      {showInstallPrompt && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            background: theme.cardBg,
            border: `2px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: theme.text, marginBottom: '0.5rem' }}>
                📲 Installer CleanHome Pro
              </div>
              <div style={{ fontSize: '0.85rem', color: theme.textSecondary }}>
                Accédez rapidement depuis votre écran d'accueil
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.textSecondary,
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleInstallClick}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Installer
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: theme.bg,
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      <header style={{ padding: !isOnline ? '3rem 1rem 1rem' : '1rem 0', marginBottom: '1rem' }}>
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 7vw, 4rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            textAlign: 'center',
            lineHeight: '1.2',
          }}
        >
          🏠 CleanHome Pro
        </h1>

        <div
          style={{
            background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}dd)`,
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>{currentLevel.icon}</span>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{currentLevel.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Niveau {currentLevel.level}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{totalPoints}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>points</div>
            </div>
          </div>
          {nextLevel && (
            <>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    height: '100%',
                    width: `${progressToNext}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.9 }}>
                {nextLevel.minPoints - totalPoints} pts jusqu'à {nextLevel.name} {nextLevel.icon}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => {
              setShowGamification(!showGamification);
              setShowFamily(false);
              setShowCalendar(false);
              setShowStats(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showGamification ? '#3b82f6' : theme.cardBg,
              color: showGamification ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem',
            }}
            title="Gamification"
          >
            🎮
          </button>
          <button
            onClick={() => {
              setShowFamily(!showFamily);
              setShowGamification(false);
            setShowTutorials(false);
              setShowCalendar(false);
              setShowStats(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showFamily ? '#3b82f6' : theme.cardBg,
              color: showFamily ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem',
            }}
            title="Famille"
          >
            👨‍👩‍👧‍👦
          </button>
          <button
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowStats(false);
              setShowFamily(false);
              setShowGamification(false);
            setShowTutorials(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showCalendar ? '#3b82f6' : theme.cardBg,
              color: showCalendar ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem',
            }}
            title="Calendrier"
          >
            📅
          </button>
          <button
            onClick={() => {
              setShowStats(!showStats);
              setShowCalendar(false);
              setShowFamily(false);
              setShowGamification(false);
            setShowTutorials(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showStats ? '#3b82f6' : theme.cardBg,
              color: showStats ? 'white' : theme.text,
              border: `2px solid ${theme.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.3rem',
            }}
            title="Statistiques"
          >
            📊
          </button>
        <button
          onClick={() => {
            setShowTutorials(!showTutorials);
            setShowStats(false);
            setShowCalendar(false);
            setShowFamily(false);
            setShowGamification(false);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: showTutorials ? '#3b82f6' : theme.cardBg,
            color: showTutorials ? 'white' : theme.text,
            border: `2px solid ${theme.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.3rem',
          }}
          title="Tutoriels & Aide"
        >
          🎥
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
              fontSize: '1.3rem',
            }}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
			<button
			  onClick={() => {
				console.log('🔥 Bouton cliqué !');
				setShowFamilyModal(true);
			  }}
			  style={{
				padding: '0.5rem 1rem',
				background: firebaseIsConnected ? '#10b981' : '#f59e0b',
				color: 'white',
				border: 'none',
				borderRadius: '8px',
				cursor: 'pointer',
				fontSize: '1.3rem',
			  }}
			  title={firebaseIsConnected ? `Famille: ${firebaseFamilyCode}` : 'Connecter famille'}
			>
			  {firebaseIsConnected ? '🔗' : '⚠️'}
			</button>


          <button
            style={{
              padding: '0.5rem 1rem',
              background: isOnline ? '#10b981' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.3rem',
              cursor: 'default',
            }}
            title={isOnline ? 'En ligne' : 'Hors-ligne'}
          >
            {isOnline ? '🌐' : '📡'}
          </button>
        </div>

        {currentMemberId && familyMembers.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setCurrentMemberId(member.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentMemberId === member.id ? member.color : theme.cardBg,
                  color: currentMemberId === member.id ? 'white' : theme.text,
                  border: `2px solid ${currentMemberId === member.id ? member.color : theme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{member.avatar}</span>
                {member.name}
              </button>
            ))}
          </div>
        )}

        <p style={{ fontSize: '1rem', color: theme.textSecondary, marginBottom: '0.75rem', textAlign: 'center' }}>
          <strong>{TASKS.length} tâches</strong> organisées
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: theme.textSecondary,
          }}
        >
          <span>✅ {completedTasks.size} aujourd'hui</span>
          <span>📅 {totalThisWeek} cette semaine</span>
          <span>
            🔥 {streakDays} jour{streakDays > 1 ? 's' : ''}
          </span>
          <span>
            🏆 {unlockedBadges.length}/{BADGES.length} badges
          </span>
        </div>
      </header>

      {/* GAMIFICATION */}
      {showGamification && (
        <div
          style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>🎮 Gamification</h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: theme.text, marginBottom: '1rem' }}>🔥 Défis de la Semaine</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {weeklyChallenges.map((challenge) => {
                const weekStart = getWeekStart();
                const thisWeekTasks = history.filter((h) => {
                  const taskDate = new Date(h.date);
                  return taskDate >= weekStart;
                });

                let progress = 0;
                if (challenge.id.includes('complete-10')) {
                  progress = Math.min(thisWeekTasks.length, challenge.target);
                } else if (challenge.id.includes('points')) {
                  const weekPoints = thisWeekTasks.reduce((sum, t) => sum + (t.points || 0), 0);
                  progress = weekPoints;
                } else if (challenge.id.includes('daily-streak')) {
                  progress = streakDays;
                }

                const percentage = Math.min(Math.floor((progress / challenge.target) * 100), 100);
                const completed = progress >= challenge.target;

                return (
                  <div
                    key={challenge.id}
                    style={{
                      padding: '1rem',
                      background: completed ? 'linear-gradient(135deg, #10b981, #059669)' : theme.bg,
                      borderRadius: '12px',
                      border: `2px solid ${completed ? '#10b981' : theme.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '2rem' }}>{challenge.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '1rem',
                            color: completed ? 'white' : theme.text,
                          }}
                        >
                          {challenge.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: completed ? 'rgba(255,255,255,0.9)' : theme.textSecondary,
                          }}
                        >
                          {challenge.description}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        background: completed ? 'rgba(255,255,255,0.2)' : theme.border,
                        height: '8px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          background: completed ? 'white' : '#3b82f6',
                          height: '100%',
                          width: `${percentage}%`,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: completed ? 'white' : theme.textSecondary,
                      }}
                    >
                      <span>
                        {progress} / {challenge.target}
                      </span>
                      <span>💎 +{challenge.reward} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: theme.text, marginBottom: '1rem' }}>
              🏆 Badges ({unlockedBadges.length}/{BADGES.length})
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '1rem',
              }}
            >
              {BADGES.map((badge) => {
                const unlocked = unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    style={{
                      padding: '1rem',
                      background: unlocked ? badge.color : theme.bg,
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: `2px solid ${unlocked ? badge.color : theme.border}`,
                      opacity: unlocked ? 1 : 0.5,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '3rem',
                        marginBottom: '0.5rem',
                        filter: unlocked ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: unlocked ? 'white' : theme.text,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {badge.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: unlocked ? 'rgba(255,255,255,0.9)' : theme.textSecondary,
                      }}
                    >
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GESTION FAMILIALE */}
      {showFamily && (
        <div
          style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
            👨‍👩‍👧‍👦 Gestion Familiale
          </h2>

          {sortedMembers.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: theme.text, marginBottom: '1rem' }}>🏆 Classement</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedMembers.map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      padding: '1rem',
                      background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : theme.bg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      border: `2px solid ${index === 0 ? '#f59e0b' : theme.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: index === 0 ? 'white' : theme.text,
                      }}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div style={{ fontSize: '2rem' }}>{member.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          color: index === 0 ? 'white' : theme.text,
                        }}
                      >
                        {member.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          color: index === 0 ? 'rgba(255,255,255,0.9)' : theme.textSecondary,
                        }}
                      >
                        {member.points} points
                      </div>
                    </div>
                    <button
                      onClick={() => removeFamilyMember(member.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: index === 0 ? 'white' : '#ef4444',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                      }}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showAddMember ? (
            <button
              onClick={() => setShowAddMember(true)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ➕ Ajouter un membre
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nom du membre..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFamilyMember()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `2px solid ${theme.border}`,
                  background: theme.bg,
                  color: theme.text,
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={addFamilyMember}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMemberName('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* CALENDRIER */}
      {showCalendar && (
        <div
          style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={prevMonth}
              style={{
                padding: '0.5rem 1rem',
                background: theme.bg,
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              ←
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              style={{
                padding: '0.5rem 1rem',
                background: theme.bg,
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              →
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.25rem',
              marginBottom: '0.5rem',
            }}
          >
            {dayNames.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  color: theme.textSecondary,
                  padding: '0.5rem 0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.25rem',
            }}
          >
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', background: theme.bg, borderRadius: '8px' }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const tasksForDay = getTasksForDate(dateStr, scheduledTasks);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const completedForDay = history.filter((h) => h.date === dateStr).length;

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
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: isToday ? '700' : '500',
                      color: isSelected ? 'white' : theme.text,
                    }}
                  >
                    {day}
                  </div>
                  {tasksForDay.length > 0 && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: isSelected ? 'white' : '#3b82f6',
                        fontWeight: '600',
                      }}
                    >
                      {tasksForDay.length}
                    </div>
                  )}
                  {completedForDay > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#4caf50',
                      }}
                    />
)} 
                </div>
              );
            })}
          </div>

          {selectedDate && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: theme.bg, borderRadius: '12px' }}>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: theme.text,
                  marginBottom: '1rem',
                }}
              >
                📋{' '}
                {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              {selectedDateTasks.length === 0 ? (
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>Aucune tâche planifiée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedDateTasks.map((task, idx) => {
                    const isCompleted = history.some((h) => h.taskId === task.taskId && h.date === selectedDate);
                    const assignment = taskAssignments.find((a) => a.taskId === task.taskId);
                    const assignedMember = assignment ? familyMembers.find((m) => m.id === assignment.memberId) : null;
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          background: isCompleted ? (darkMode ? '#1e3a1e' : '#e8f5e9') : theme.cardBg,
                          border: isCompleted ? '2px solid #4caf50' : assignedMember ? `2px solid ${assignedMember.color}` : `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                          <div
                            onClick={() => toggleTaskCompletionForDate(task.taskId, selectedDate)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: isCompleted ? '2px solid #4caf50' : `2px solid ${theme.border}`,
                              background: isCompleted ? '#4caf50' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer',
                              marginTop: '2px',
                            }}
                          >
                            {isCompleted && (
                              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                color: isCompleted ? '#4caf50' : theme.text,
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                marginBottom: '0.5rem',
                              }}
                            >
                              {task.taskName}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                fontSize: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  background: darkMode ? '#1e3a8a' : '#e3f2fd',
                                  color: darkMode ? '#93c5fd' : '#1565c0',
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                }}
                              >
                                {task.zone}
                              </span>
                              <span
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  background: darkMode ? '#065f46' : '#d1fae5',
                                  color: darkMode ? '#6ee7b7' : '#047857',
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                }}
                              >
                                {task.frequency}
                              </span>
                              {task.estimatedTime && (
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    background: darkMode ? '#7c2d12' : '#fff3e0',
                                    color: darkMode ? '#fdba74' : '#e65100',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                  }}
                                >
                                  ⏱ {task.estimatedTime}m
                                </span>
                              )}
                            </div>

                            {/* 🆕 ATTRIBUTION DES MEMBRES DANS CALENDRIER */}
                            {familyMembers.length > 0 && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <select
                                  value={assignedMember?.id || ''}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (e.target.value) {
                                      assignTaskToMember(task.taskId, e.target.value);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    border: `2px solid ${assignedMember ? assignedMember.color : theme.border}`,
                                    background: assignedMember ? assignedMember.color : theme.bg,
                                    color: assignedMember ? 'white' : theme.text,
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    width: '100%',
                                    maxWidth: '200px',
                                  }}
                                >
                                  <option value="" style={{ background: theme.cardBg, color: theme.text }}>👤 Assigner à...</option>
                                  {familyMembers.map((member) => (
                                    <option key={member.id} value={member.id} style={{ background: theme.cardBg, color: theme.text }}>
                                      {member.avatar} {member.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
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
        <div
          style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
            📊 7 derniers jours
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              height: '150px',
              gap: '0.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {stats7Days.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.text,
                  }}
                >
                  {stat.count}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${(stat.count / maxCount) * 100}px`,
                    background:
                      stat.count > 0 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : theme.border,
                    borderRadius: '8px 8px 0 0',
                    minHeight: '10px',
                  }}
                />
                <div style={{ fontSize: '0.65rem', color: theme.textSecondary }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div
              style={{
                background: theme.bg,
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalThisWeek}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Semaine</div>
            </div>
            <div
              style={{
                background: theme.bg,
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {completedTasks.size}
              </div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Aujourd'hui</div>
            </div>
            <div
              style={{
                background: theme.bg,
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{streakDays}</div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Streak</div>
            </div>
            <div
              style={{
                background: theme.bg,
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {history.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: theme.textSecondary }}>Total</div>
            </div>
          </div>
        </div>
      )}


      {/* TUTORIELS & AIDE */}
      {showTutorials && (
        <div style={{ background: theme.cardBg, borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}` }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
            🎥 Tutoriels & Aide
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>Filtrer par zone :</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setTutorialZoneFilter('all')} style={{ padding: '0.4rem 0.8rem', background: tutorialZoneFilter === 'all' ? '#3b82f6' : theme.bg, color: tutorialZoneFilter === 'all' ? 'white' : theme.text, border: `2px solid ${theme.border}`, borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                Toutes
              </button>
              {ZONES.map(zone => (
                <button key={zone} onClick={() => setTutorialZoneFilter(zone)} style={{ padding: '0.4rem 0.8rem', background: tutorialZoneFilter === zone ? '#3b82f6' : theme.bg, color: tutorialZoneFilter === zone ? 'white' : theme.text, border: `2px solid ${theme.border}`, borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {TUTORIALS.filter(tuto => tutorialZoneFilter === 'all' || tuto.zone === tutorialZoneFilter || tuto.zone === 'Toutes').map(tutorial => (
              <div key={tutorial.id} style={{ background: theme.bg, borderRadius: '12px', padding: '1.5rem', border: `2px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: theme.text, margin: 0 }}>
                    {tutorial.title}
                  </h3>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                    {tutorial.zone}
                  </span>
                </div>

                {tutorial.youtubeUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <a href={tutorial.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ff0000', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>▶️</span>
                      Voir le tutoriel vidéo
                    </a>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: theme.text, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💡 Astuces
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {tutorial.tips.map((tip, idx) => (
                      <li key={idx} style={{ color: theme.text, fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: theme.text, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🧴 Produits recommandés
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tutorial.recommendedProducts.map((product, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', background: theme.cardBg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: theme.text, fontSize: '0.9rem' }}>{product.name}</span>
                          <span style={{ padding: '0.2rem 0.5rem', background: '#10b981', color: 'white', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                            {product.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: theme.textSecondary, fontStyle: 'italic' }}>
                          → {product.why}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {tutorial.safetyWarnings.length > 0 && (
                  <div style={{ padding: '1rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚠️ Sécurité
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {tutorial.safetyWarnings.map((warning, idx) => (
                        <li key={idx} style={{ color: '#991b1b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {TUTORIALS.filter(tuto => tutorialZoneFilter === 'all' || tuto.zone === tutorialZoneFilter || tuto.zone === 'Toutes').length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: theme.textSecondary }}>
              Aucun tutoriel disponible pour cette zone. 🚧 Plus de tutoriels bientôt !
            </div>
          )}
        </div>
      )}

      {/* RECHERCHE ET TEMPLATES */}
      <div style={{ background: theme.cardBg, borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}` }}>
        <input type="text" placeholder="🔍 Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `2px solid ${theme.border}`, background: theme.bg, color: theme.text, marginBottom: '1rem' }} />

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: theme.textSecondary, marginBottom: '0.5rem', fontWeight: '600' }}>🏠 Type d'habitat (filtre zones + calendrier)</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <button key={key} onClick={() => { setSelectedTemplate(key); setSelectedZone(null); }} style={{ padding: '0.5rem 1rem', background: selectedTemplate === key ? '#3b82f6' : theme.bg, color: selectedTemplate === key ? 'white' : theme.text, border: `2px solid ${selectedTemplate === key ? '#3b82f6' : theme.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {!showAddTask ? (
          <button onClick={() => setShowAddTask(true)} style={{ width: '100%', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>➕ Ajouter tâche personnalisée</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: theme.bg, borderRadius: '8px' }}>
            <input type="text" placeholder="Nom" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${theme.border}`, background: theme.cardBg, color: theme.text }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <select value={newTask.zone} onChange={(e) => setNewTask({ ...newTask, zone: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${theme.border}`, background: theme.cardBg, color: theme.text }}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <select value={newTask.frequency} onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${theme.border}`, background: theme.cardBg, color: theme.text }}>
                {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <input type="number" placeholder="Durée (min)" value={newTask.estimatedTime} onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 10 })} style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${theme.border}`, background: theme.cardBg, color: theme.text }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={addCustomTask} style={{ flex: 1, padding: '0.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>✅ Ajouter</button>
              <button onClick={() => { setShowAddTask(false); setNewTask({ name: '', zone: 'Cuisine', frequency: 'quotidienne', estimatedTime: 10, description: '' }); }} style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>❌ Annuler</button>
            </div>
          </div>
        )}

        {hiddenTasks.size > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: '0.85rem', color: theme.textSecondary, marginBottom: '0.5rem' }}>{hiddenTasks.size} tâche(s) masquée(s)</div>
            <button onClick={() => setHiddenTasks(new Set())} style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>↩️ Tout restaurer</button>
          </div>
        )}
      </div>

            {/* ZONES ET TÂCHES */}
      {!selectedZone ? (
        <>
          <div
            style={{
              background: theme.cardBg,
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.border}`,
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: theme.text, marginBottom: '1rem' }}>
              📍 {selectedTemplate !== 'all' ? TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].name + ' - Zones' : ZONES.length + ' Zones'}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
              }}
            >
              {ZONES.filter(zone => {
                if (selectedTemplate === 'all') return true;
                const templateZones = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].zones;
                return templateZones.length === 0 || templateZones.includes(zone);
              }).map((zone) => {
                const taskCount = allTasks.filter((t) => t.zone === zone && !hiddenTasks.has(t.id)).length;
                const completedCount = allTasks.filter(
                  (t) => t.zone === zone && completedTasks.has(t.id) && !hiddenTasks.has(t.id),
                ).length;
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
                      overflow: 'hidden',
                    }}
                  >
                    {percentage > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          height: '4px',
                          width: `${percentage}%`,
                          background: '#4caf50',
                        }}
                      />
                    )}
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        marginBottom: '0.25rem',
                        color: theme.text,
                      }}
                    >
                      {zone}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: theme.textSecondary,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {taskCount} tâches
                    </p>
                    {percentage > 0 && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#4caf50',
                          fontWeight: '600',
                        }}
                      >
                        {percentage}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: theme.cardBg,
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.border}`,
            }}
          >
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
                  cursor: 'pointer',
                }}
              >
                🔔 Activer les rappels
              </button>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
                  border: '2px solid #4caf50',
                  color: '#1b5e20',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                }}
              >
                <strong>✅ Activées !</strong>
                <br />
                Rappels à 20h la veille.
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          style={{
            background: theme.cardBg,
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.border}`,
          }}
        >
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
              marginBottom: '1rem',
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
                cursor: 'pointer',
              }}
            >
              Toutes
            </button>
            {frequencies.map((freq) => (
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
                  textTransform: 'capitalize',
                }}
              >
                {freq}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {zoneTasks.map((task) => {
              const isCompleted = completedTasks.has(task.id);
              const assignment = taskAssignments.find((a) => a.taskId === task.id);
              const assignedMember = assignment ? familyMembers.find((m) => m.id === assignment.memberId) : null;
              const comments = taskComments.filter((c) => c.taskId === task.id);

              return (
                <div
                  key={task.id}
                  style={{
                    background: isCompleted ? (darkMode ? '#1e3a1e' : '#e8f5e9') : theme.bg,
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isCompleted
                      ? '2px solid #4caf50'
                      : assignedMember
                      ? `2px solid ${assignedMember.color}`
                      : `2px solid ${theme.border}`,
                  }}
                >
                  <div
                    onClick={() => toggleTaskCompletion(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'start',
                      gap: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: isCompleted ? '2px solid #4caf50' : `2px solid ${theme.border}`,
                        background: isCompleted ? '#4caf50' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isCompleted && (
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: isCompleted ? '#4caf50' : theme.text,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {task.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            background: darkMode ? '#1e3a8a' : '#e3f2fd',
                            color: darkMode ? '#93c5fd' : '#1565c0',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}
                        >
                          📅 {task.frequency}
                        </span>
                        {task.estimatedTime && (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              background: darkMode ? '#7c2d12' : '#fff3e0',
                              color: darkMode ? '#fdba74' : '#e65100',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                            }}
                          >
                            ⏱ {task.estimatedTime}m
                          </span>
                        )}
                        {assignedMember && (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              background: assignedMember.color,
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {assignedMember.avatar} {assignedMember.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {familyMembers.length > 0 && (
                      <select
                        value={assignment?.memberId || ''}
                        onChange={(e) => assignTaskToMember(task.id, e.target.value)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          border: `2px solid ${theme.border}`,
                          background: theme.bg,
                          color: theme.text,
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Assigner à...</option>
                        {familyMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.avatar} {member.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() =>
                        setSelectedTaskForComment(selectedTaskForComment === task.id ? null : task.id)
                      }
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: comments.length > 0 ? '#3b82f6' : theme.bg,
                        color: comments.length > 0 ? 'white' : theme.text,
                        border: `2px solid ${theme.border}`,
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      💬 {comments.length > 0 && `(${comments.length})`}
                    </button>
                  </div>

                  {selectedTaskForComment === task.id && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: theme.bg, borderRadius: '8px' }}>
                      {comments.map((comment) => {
                        const member = familyMembers.find((m) => m.id === comment.memberId);
                        return (
                          <div
                            key={comment.id}
                            style={{
                              marginBottom: '0.5rem',
                              paddingBottom: '0.5rem',
                              borderBottom: `1px solid ${theme.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                                fontSize: '0.75rem',
                                color: theme.textSecondary,
                              }}
                            >
                              {member && (
                                <span>
                                  {member.avatar} {member.name}
                                </span>
                              )}
                              <span>
                                {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: theme.text }}>{comment.comment}</div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Ajouter un commentaire..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addComment(task.id)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: `2px solid ${theme.border}`,
                            background: theme.cardBg,
                            color: theme.text,
                            fontSize: '0.85rem',
                          }}
                        />
                        <button
                          onClick={() => addComment(task.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          ➤
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
	        {/* 🆕 Modale connexion famille Firebase */}
{showFamilyModal && (
  <FamilyConnectionModal
    onCreateFamily={handleCreateFamilyWrapper}
    onJoinFamily={handleJoinFamilyWrapper}
    onClose={() => setShowFamilyModal(false)}
  />
)}

    </main>
  );
}
