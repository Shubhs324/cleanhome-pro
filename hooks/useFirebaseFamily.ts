'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, set, push, update } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export function useFirebaseFamily() {
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Récupérer le code famille depuis localStorage
    const savedCode = localStorage.getItem('family-code');
    if (savedCode) {
      setFamilyCode(savedCode);
      setIsConnected(true);
    }
  }, []);

  // Créer une nouvelle famille
  const createFamily = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const familyRef = ref(database, `families/${code}`);
    
    set(familyRef, {
      createdAt: new Date().toISOString(),
      members: {},
      tasks: {},
      history: {}
    }).then(() => {
      localStorage.setItem('family-code', code);
      setFamilyCode(code);
      setIsConnected(true);
    });

    return code;
  };

  // Rejoindre une famille existante
  const joinFamily = (code: string) => {
    const familyRef = ref(database, `families/${code}`);
    
    onValue(familyRef, (snapshot) => {
      if (snapshot.exists()) {
        localStorage.setItem('family-code', code);
        setFamilyCode(code);
        setIsConnected(true);
      } else {
        alert('❌ Code famille invalide !');
      }
    }, { onlyOnce: true });
  };

  // Se déconnecter
  const disconnect = () => {
    localStorage.removeItem('family-code');
    setFamilyCode(null);
    setIsConnected(false);
  };

  // Synchroniser les données
  const syncData = (path: string, data: any) => {
    if (!familyCode) return;
    const dataRef = ref(database, `families/${familyCode}/${path}`);
    set(dataRef, data);
  };

  // Écouter les changements
  const listenToData = (path: string, callback: (data: any) => void) => {
    if (!familyCode) return;
    const dataRef = ref(database, `families/${familyCode}/${path}`);
    return onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  };

  return {
    familyCode,
    isConnected,
    createFamily,
    joinFamily,
    disconnect,
    syncData,
    listenToData
  };
}
