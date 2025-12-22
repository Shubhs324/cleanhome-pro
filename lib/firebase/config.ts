import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🔥 REMPLACE PAR TA CONFIG depuis Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyALSDfEM7dgijRUiTz5v1aRo-BwtGE2JQA",
  authDomain: "cleanhome-pro-a4d33.firebaseapp.com",
  databaseURL: "https://cleanhome-pro-a4d33-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cleanhome-pro-a4d33",
  storageBucket: "cleanhome-pro-a4d33.firebasestorage.app",
  messagingSenderId: "311071899614",
  appId: "1:311071899614:web:9963b5590dd83eccbea74f"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Obtenir la référence de la base de données
export const database = getDatabase(app);
export default app;
