/**
 * Single Firebase project for GCUL customer + admin apps (Firestore cache reads).
 * Backend services write gcul_cache/* via GCUL_FIRESTORE_PROJECT (same project id).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAe_Mns9QWCtTszP0p5cBo4Wpg64UvG6gE',
  authDomain: 'insure360-83a36.firebaseapp.com',
  projectId: 'insure360-83a36',
  storageBucket: 'insure360-83a36.firebasestorage.app',
  messagingSenderId: '690935448909',
  appId: '1:690935448909:web:d7bbf4b583758e11fde304',
};

export const FIRESTORE_CACHE_COLLECTION = 'gcul_cache';
