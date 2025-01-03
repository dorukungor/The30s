'use client';

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

let database: any;

if (typeof window !== 'undefined') {
  const firebaseConfig = {
    apiKey: "AIzaSyALPZM4VDikplXPhc-aA-uckURKqAf6C5E",
    authDomain: "the30s.firebaseapp.com",
    projectId: "the30s",
    storageBucket: "the30s.firebasestorage.app",
    messagingSenderId: "201132374540",
    appId: "1:201132374540:web:2014eac009ce77dd020c29",
    databaseURL: "https://the30s-default-rtdb.europe-west1.firebasedatabase.app"
  };

  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

export { database }; 