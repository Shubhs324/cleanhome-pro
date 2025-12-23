'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '@/lib/firebase/config';

export function useFirebaseFamily() {
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem('family-code');
    if (savedCode) {
      setFamilyCode(savedCode);
      setIsConnected(true);
    }
  }, []);

const createFamily = async () => {
  console.log('🔍 1. Début createFamily');
  
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log('🔍 2. Code généré:', code);
  
  const familyRef = ref(database, `families/${code}`);
  
  try {
    console.log('🔍 3. Écriture Firebase...');
    await set(familyRef, {
      createdAt: new Date().toISOString(),
      members: {},
      history: {},
      assignments: {},
      comments: {}
    });
    console.log('🔍 4. Firebase OK');
    
    console.log('🔍 5. Sauvegarde localStorage...');
    localStorage.setItem('family-code', code);
    const verify = localStorage.getItem('family-code');
    console.log('🔍 6. Vérification localStorage:', verify);
    
    setFamilyCode(code);
    setIsConnected(true);
    
    console.log(`✅ Famille créée: ${code}`);
    return code;
  } catch (error) {
    console.error('❌ Erreur création famille:', error);
    return null;
  }
};


  const joinFamily = async (code: string) => {
    if (!code || code.length !== 6) {
      alert('❌ Code famille invalide');
      return false;
    }

    const familyRef = ref(database, `families/${code.toUpperCase()}`);
    
    return new Promise<boolean>((resolve) => {
      onValue(familyRef, (snapshot) => {
        if (snapshot.exists()) {
          localStorage.setItem('family-code', code.toUpperCase());
          setFamilyCode(code.toUpperCase());
          setIsConnected(true);
          console.log(`✅ Connecté à: ${code.toUpperCase()}`);
          resolve(true);
        } else {
          alert('❌ Code famille invalide !');
          resolve(false);
        }
      }, { onlyOnce: true });
    });
  };

  const disconnect = () => {
    localStorage.removeItem('family-code');
    setFamilyCode(null);
    setIsConnected(false);
  };

const syncData = async (path: string, data: any) => {
  if (!familyCode || !data) return false;

  try {
    // ✅ Nettoie les undefined → null
    const cleanData = JSON.parse(JSON.stringify(data));
    
    // ✅ Si c'est history, filtre uniquement les items vraiment invalides
    let dataToSync = cleanData;
    if (path === 'history' && Array.isArray(cleanData)) {
		  // 🔍 DEBUG: Affiche le premier item
  console.log('🔍 Premier item history:', cleanData[0]);
  console.log('🔍 Propriétés:', {
    id: cleanData[0]?.id,
    taskId: cleanData[0]?.taskId,
    memberId: cleanData[0]?.memberId,
    date: cleanData[0]?.date
  });
      dataToSync = cleanData.filter(item => {
        const isValid = item && 
          item.taskId != null && // != null vérifie undefined ET null
          item.memberId != null && 
          item.date;
        
        if (!isValid) {
          console.warn('⚠️ Item invalide filtré:', item);
        }
        return isValid;
      });
      console.log(`🔍 History: ${cleanData.length} items → ${dataToSync.length} valides`);
    }

    const dataRef = ref(database, `families/${familyCode}/${path}`);
    await set(dataRef, dataToSync);
    console.log(`📤 Synced: ${path} (${Array.isArray(dataToSync) ? dataToSync.length : 'N/A'} items)`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur sync ${path}:`, error);
    return false;
  }
};



  const listenToData = (path: string, callback: (data: any) => void) => {
    if (!familyCode) return () => {};

    const dataRef = ref(database, `families/${familyCode}/${path}`);
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

      // 🔍 DEBUG - Affiche EXACTEMENT ce qui est reçu
      console.log('🔍 RAW DATA reçue pour', path, ':', JSON.stringify(data, null, 2));
	  
        // Convertir objet → array si besoin
        if (typeof data === 'object' && !Array.isArray(data)) {
          const dataArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value as object
          }));
          console.log('🔍 CONVERTED TO ARRAY:', dataArray);
          callback(dataArray);
        } else {
		  console.log('🔍 ALREADY ARRAY:', data);	
          callback(data);
        }
      } else {
        callback([]);
      }
    });

    return unsubscribe;
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
