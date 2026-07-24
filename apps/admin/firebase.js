import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseCredentials.js';

export { firebaseConfig };

let app;

export function getFirebaseApp() {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}
